import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, Download, FileText, ListChecks, Lock, PlayCircle } from 'lucide-react';
import QuizComponent from '../components/QuizComponent.jsx';
import QuestionArea from '../components/QuestionArea.jsx';
import { api } from '../services/api.js';
import { calculateProgress, getVideoEmbedUrl } from '../utils/courseUtils.js';

// Um módulo está concluído quando todos os quizzes dele foram aprovados; sem
// quiz, quando todas as aulas de vídeo foram concluídas.
const isModuleComplete = (module, completedLessons) => {
  const quizzes = module.lessons.filter((lesson) => lesson.type === 'quiz');
  const required = quizzes.length > 0 ? quizzes : module.lessons.filter((lesson) => lesson.type === 'video');
  return required.every((lesson) => completedLessons.has(lesson.id));
};

const LessonPlayerPage = ({ navigateTo, course, courseId, content, progress, onProgressUpdate }) => {
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const hasPositioned = useRef(false);
    const lastRecordedLessonId = useRef(null);
    // Aviso exibido no player (módulo bloqueado, fim do curso), no lugar de alert().
    const [notice, setNotice] = useState('');

    const courseContent = useMemo(() => content || [], [content]);
    const completedLessons = useMemo(() => progress?.completed || new Set(), [progress]);

    // Os módulos liberados são derivados das aulas concluídas, sem estado
    // próprio: o módulo N abre quando o N-1 está liberado e concluído.
    const unlockedModules = useMemo(() => {
      const unlocked = new Set([0]);
      for (let index = 1; index < courseContent.length; index += 1) {
        if (!unlocked.has(index - 1) || !isModuleComplete(courseContent[index - 1], completedLessons)) break;
        unlocked.add(index);
      }
      return unlocked;
    }, [courseContent, completedLessons]);

    // Registra na API a aula aberta, para o "Continue de onde parou". Falhas
    // são ignoradas: não impedem o aluno de estudar.
    const recordAccess = useCallback((lessonId) => {
      if (!lessonId || lastRecordedLessonId.current === lessonId) return;
      lastRecordedLessonId.current = lessonId;
      api.setLastLesson(courseId, lessonId).catch(() => {});
    }, [courseId]);

    const currentLessonId = courseContent[currentModuleIndex]?.lessons[currentLessonIndex]?.id;

    // Declarado antes do posicionamento: assim nunca registra a aula padrão
    // (a primeira) antes de o player ir para a aula certa.
    useEffect(() => {
      if (hasPositioned.current) recordAccess(currentLessonId);
    }, [currentLessonId, recordAccess]);

    // Ao abrir o curso, vai para a aula indicada pela API (a mesma do "Continue
    // de onde parou"). Sem indicação válida, usa a primeira pendente dos módulos
    // liberados. Roda uma única vez, quando conteúdo e progresso já chegaram.
    useEffect(() => {
      if (hasPositioned.current || courseContent.length === 0 || !progress) return;
      hasPositioned.current = true;

      const findTarget = () => {
        for (let moduleIndex = 0; moduleIndex < courseContent.length; moduleIndex += 1) {
          const lessonIndex = courseContent[moduleIndex].lessons.findIndex((lesson) => lesson.id === progress.nextLessonId);
          if (lessonIndex >= 0 && unlockedModules.has(moduleIndex)) return [moduleIndex, lessonIndex];
        }
        for (let moduleIndex = 0; moduleIndex < courseContent.length; moduleIndex += 1) {
          if (!unlockedModules.has(moduleIndex)) break;
          const lessonIndex = courseContent[moduleIndex].lessons.findIndex((lesson) => !completedLessons.has(lesson.id));
          if (lessonIndex >= 0) return [moduleIndex, lessonIndex];
        }
        return [0, 0];
      };

      const [moduleIndex, lessonIndex] = findTarget();
      setCurrentModuleIndex(moduleIndex);
      setCurrentLessonIndex(lessonIndex);
      recordAccess(courseContent[moduleIndex]?.lessons[lessonIndex]?.id);
    }, [courseContent, progress, unlockedModules, completedLessons, recordAccess]);

    if (content === undefined) {
      return (
        <section className="ui-page">
          <div className="container"><p className="ui-muted">Carregando aulas do curso...</p></div>
        </section>
      );
    }

    if (courseContent.length === 0 || !courseContent[currentModuleIndex] || !courseContent[currentModuleIndex].lessons[currentLessonIndex]) {
      return (
        <section className="ui-page">
          <div className="container">
            <div className="ui-empty">
              <h2>Conteúdo em preparação</h2>
              <p>O instrutor ainda não publicou aulas neste curso. Volte em breve.</p>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => navigateTo('studentDashboard')}>Voltar aos meus cursos</button>
            </div>
          </div>
        </section>
      );
    }

    const currentLesson = courseContent[currentModuleIndex].lessons[currentLessonIndex];
    const isCurrentCompleted = completedLessons.has(currentLesson.id);
    const totalLessons = courseContent.reduce((total, module) => total + module.lessons.length, 0);
    const completedCount = courseContent.reduce((total, module) => total + module.lessons.filter((lesson) => completedLessons.has(lesson.id)).length, 0);
    const localProgress = calculateProgress(courseId, { [courseId]: { completed: completedLessons } }, courseContent);
    const isFirstLesson = currentModuleIndex === 0 && currentLessonIndex === 0;
    const isLastLesson = currentModuleIndex === courseContent.length - 1 && currentLessonIndex === courseContent[currentModuleIndex].lessons.length - 1;

    const showNotice = (text) => setNotice(text);

    const goTo = (moduleIndex, lessonIndex) => {
      setNotice('');
      setCurrentModuleIndex(moduleIndex);
      setCurrentLessonIndex(lessonIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleCompletion = () => {
      if (currentLesson.type !== 'video') return;
      const newCompleted = new Set(completedLessons);
      const willComplete = !newCompleted.has(currentLesson.id);
      if (willComplete) newCompleted.add(currentLesson.id);
      else newCompleted.delete(currentLesson.id);

      // changedLesson informa ao App qual aula gravar na API.
      onProgressUpdate(courseId, { completed: newCompleted, changedLesson: { id: currentLesson.id, completed: willComplete } });
    };

    // A aprovação já foi gravada pela API ao corrigir o quiz; aqui só se
    // atualiza o estado local (sem changedLesson, para não gravar de novo).
    const handleQuizPass = () => {
      onProgressUpdate(courseId, { completed: new Set(completedLessons).add(currentLesson.id) });
    };

    const handleSelectLesson = (moduleIndex, lessonIndex) => {
      if (!unlockedModules.has(moduleIndex)) {
        showNotice('Este módulo ainda está bloqueado. Conclua o quiz ou as aulas do módulo anterior para liberá-lo.');
        return;
      }
      goTo(moduleIndex, lessonIndex);
    };

    const handlePrev = () => {
      if (currentLessonIndex > 0) goTo(currentModuleIndex, currentLessonIndex - 1);
      else if (currentModuleIndex > 0) goTo(currentModuleIndex - 1, courseContent[currentModuleIndex - 1].lessons.length - 1);
    };

    const handleNext = () => {
      if (currentLessonIndex < courseContent[currentModuleIndex].lessons.length - 1) {
        goTo(currentModuleIndex, currentLessonIndex + 1);
      } else if (currentModuleIndex < courseContent.length - 1) {
        if (unlockedModules.has(currentModuleIndex + 1)) goTo(currentModuleIndex + 1, 0);
        else showNotice('Para avançar, conclua o quiz ou todas as aulas deste módulo.');
      } else {
        setNotice('finished');
      }
    };

    const renderStage = () => {
      if (currentLesson.type === 'quiz') {
        return (
          <div className="pl-stage quiz">
            <QuizComponent key={currentLesson.id} lessonId={currentLesson.id} quizData={currentLesson.quizData} alreadyPassed={isCurrentCompleted} onQuizPass={handleQuizPass} onProceed={handleNext} />
          </div>
        );
      }

      const embedUrl = getVideoEmbedUrl(currentLesson.videoUrl);
      return (
        <div className="pl-stage">
          {embedUrl ? (
            <iframe key={currentLesson.id} src={embedUrl} title={currentLesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : currentLesson.videoUrl ? (
            <video key={currentLesson.id} controls src={currentLesson.videoUrl}>Seu navegador não suporta vídeos.</video>
          ) : (
            <div className="pl-stage-empty"><PlayCircle size={40} aria-hidden="true" /><span>O vídeo desta aula ainda não foi publicado.</span></div>
          )}
        </div>
      );
    };

    return (
      <section className="pl-page">
        <div className="pl-top">
          <div className="container pl-top-inner">
            <button type="button" className="ui-back" onClick={() => navigateTo('studentDashboard')}><ArrowLeft size={16} aria-hidden="true" /> Meus cursos</button>
            <strong className="pl-top-title">{course?.title}</strong>
            <div className="pl-top-progress">
              <div className={`st-bar ${localProgress >= 100 ? 'done' : ''}`} aria-hidden="true"><i style={{ width: `${localProgress}%` }} /></div>
              <span>{localProgress}% · {completedCount}/{totalLessons} aulas</span>
            </div>
          </div>
        </div>

        <div className="container pl-layout">
          <div className="pl-main">
            {renderStage()}

            <div className="pl-lesson-head">
              <div>
                <span className="st-eyebrow">Módulo {currentModuleIndex + 1} · Aula {currentLessonIndex + 1}</span>
                <h1>{currentLesson.title}</h1>
                <p className="ui-muted">{currentLesson.type === 'quiz' ? 'Quiz' : 'Vídeo-aula'} · {currentLesson.duration}</p>
              </div>
              {currentLesson.type === 'video' && (
                <button type="button" className={`ui-btn ${isCurrentCompleted ? 'ui-btn-secondary pl-done' : 'ui-btn-primary'}`} onClick={handleToggleCompletion}>
                  <CheckCircle2 size={18} aria-hidden="true" /> {isCurrentCompleted ? 'Aula concluída' : 'Marcar como concluída'}
                </button>
              )}
            </div>

            {currentLesson.documentUrl && (
              <a className="pl-material" href={currentLesson.documentUrl} target="_blank" rel="noopener noreferrer">
                <FileText size={22} aria-hidden="true" />
                <span><strong>Material de apoio</strong><small>Abre em uma nova aba</small></span>
                <Download size={18} aria-hidden="true" />
              </a>
            )}

            {notice === 'finished' ? (
              <div className="pl-finish">
                <Award size={28} aria-hidden="true" />
                <div>
                  <strong>Você chegou ao fim do curso!</strong>
                  <span>{localProgress >= 60 ? 'Seu certificado já pode ser emitido no painel.' : 'Conclua as aulas pendentes para liberar o certificado.'}</span>
                </div>
                <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => navigateTo('studentDashboard')}>Ir para o painel</button>
              </div>
            ) : notice && <p className="ui-alert" role="status">{notice}</p>}

            <div className="pl-nav">
              <button type="button" className="ui-btn ui-btn-secondary" onClick={handlePrev} disabled={isFirstLesson}><ArrowLeft size={16} aria-hidden="true" /> Aula anterior</button>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={handleNext}>{isLastLesson ? 'Finalizar curso' : 'Próxima aula'} <ArrowRight size={16} aria-hidden="true" /></button>
            </div>

            <QuestionArea key={currentLesson.id} lessonId={currentLesson.id} />
          </div>

          <aside className="pl-sidebar" aria-label="Conteúdo do curso">
            <h2>Conteúdo do curso</h2>
            {courseContent.map((module, moduleIndex) => {
              const isLocked = !unlockedModules.has(moduleIndex);
              const doneInModule = module.lessons.filter((lesson) => completedLessons.has(lesson.id)).length;
              return (
                <div key={module.id} className={`pl-module ${isLocked ? 'locked' : ''}`}>
                  <div className="pl-module-head">
                    <strong>{module.title}</strong>
                    <small>{isLocked ? <Lock size={13} aria-label="Bloqueado" /> : `${doneInModule}/${module.lessons.length}`}</small>
                  </div>
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isActive = moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;
                    const isDone = completedLessons.has(lesson.id);
                    const Icon = isDone ? CheckCircle2 : isLocked ? Lock : lesson.type === 'quiz' ? ListChecks : PlayCircle;
                    return (
                      <button key={lesson.id} type="button" className={`pl-lesson ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`} onClick={() => handleSelectLesson(moduleIndex, lessonIndex)} aria-current={isActive ? 'true' : undefined}>
                        <Icon size={17} aria-hidden="true" />
                        <span>{lesson.title}</span>
                        <small>{lesson.duration}</small>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </aside>
        </div>
      </section>
    );
  };

  export default LessonPlayerPage;
