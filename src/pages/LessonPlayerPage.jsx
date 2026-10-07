import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
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

const LessonPlayerPage = ({ navigateTo, courseId, content, progress, onProgressUpdate, questions, onAskQuestion }) => {
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const hasPositioned = useRef(false);
    const lastRecordedLessonId = useRef(null);

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
        <div className="container" style={{ marginTop: '30px' }}>
          <div className="card"><p>Carregando aulas do curso...</p></div>
        </div>
      );
    }

    if (courseContent.length === 0 || !courseContent[currentModuleIndex] || !courseContent[currentModuleIndex].lessons[currentLessonIndex]) {
      return (
        <div className="container" style={{marginTop: '30px'}}>
          <div className="card">
            <h2>Conteúdo Indisponível</h2>
            <p>O instrutor ainda não adicionou aulas a este curso.</p>
            <button className="btn" onClick={() => navigateTo('studentDashboard')}>Voltar aos Meus Cursos</button>
          </div>
        </div>
      );
    }
  
    const currentLesson = courseContent[currentModuleIndex].lessons[currentLessonIndex];
    
    const handleToggleCompletion = () => {
      if (currentLesson.type !== 'video') return;
      
      const newCompleted = new Set(completedLessons);
      const passaAConcluir = !newCompleted.has(currentLesson.id);

      if (passaAConcluir) {
        newCompleted.add(currentLesson.id);
      } else {
        newCompleted.delete(currentLesson.id);
      }

      // changedLesson informa ao App qual aula gravar na API. Sem esse campo, a
      // atualização é tratada como local (é o caso do desbloqueio de módulos).
      onProgressUpdate(courseId, {
        completed: newCompleted,
        changedLesson: { id: currentLesson.id, completed: passaAConcluir }
      });
    };

    const handleQuizPass = () => {
      const newCompleted = new Set(completedLessons).add(currentLesson.id);
      onProgressUpdate(courseId, {
        completed: newCompleted,
        changedLesson: { id: currentLesson.id, completed: true }
      });
    };
    
    const goToLesson = (moduleIndex, lessonIndex) => {
      if (!unlockedModules.has(moduleIndex)) {
        alert('Você precisa concluir o quiz ou todas as aulas do módulo anterior para desbloquear este.');
        return;
      }
      setCurrentModuleIndex(moduleIndex);
      setCurrentLessonIndex(lessonIndex);
    };
  
    const handlePrev = () => {
      if (currentLessonIndex > 0) {
        setCurrentLessonIndex(prev => prev - 1);
      } else if (currentModuleIndex > 0) {
        const prevModuleIndex = currentModuleIndex - 1;
        const prevModuleLessonCount = courseContent[prevModuleIndex].lessons.length;
        setCurrentModuleIndex(prevModuleIndex);
        setCurrentLessonIndex(prevModuleLessonCount - 1);
      }
    };
    
    const handleNext = () => {
      const currentModuleLessonCount = courseContent[currentModuleIndex].lessons.length;
      
      if (currentLessonIndex < currentModuleLessonCount - 1) {
        setCurrentLessonIndex(prev => prev + 1);
      } else if (currentModuleIndex < courseContent.length - 1) {
        if (unlockedModules.has(currentModuleIndex + 1)) {
          setCurrentModuleIndex(prev => prev + 1);
          setCurrentLessonIndex(0);
        } else {
          alert("Complete todas as aulas ou quizzes deste módulo para avançar.");
        }
      } else {
        alert("Parabéns, você concluiu o curso! (simulado)");
      }
    };
    
    const localProgress = calculateProgress(courseId, { [courseId]: { completed: completedLessons } }, courseContent);
  
    const renderPlayerContent = () => {
      switch(currentLesson.type) {
        case 'video': {
          const embedUrl = getVideoEmbedUrl(currentLesson.videoUrl);
          return (
            <>
              {embedUrl ? (
                <iframe
                  key={currentLesson.id}
                  className="video-player video-embed"
                  src={embedUrl}
                  title={currentLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : currentLesson.videoUrl ? (
                <video key={currentLesson.id} className="video-player" controls src={currentLesson.videoUrl}>
                  Seu navegador não suporta a tag de vídeo.
                </video>
              ) : (
                <div className="video-player video-unavailable">O vídeo desta aula ainda não foi publicado.</div>
              )}
              <h2>{currentLesson.title}</h2>
              <p>Nesta aula, vamos explorar o tópico: {currentLesson.title}.</p>
              {currentLesson.documentUrl && (
                <a 
                  href={currentLesson.documentUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent" 
                  style={{marginTop: '20px', display: 'inline-block'}}
                >
                  Baixar Material de Apoio
                </a>
              )}
            </>
          );
        }
        case 'quiz':
          return (
            <QuizComponent 
              quizData={currentLesson.quizData} 
              onQuizPass={handleQuizPass}
              onProceed={handleNext} 
            />
          );
        default:
          return <h2>Tipo de aula desconhecido.</h2>
      }
    };
  
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="course-content">
          <div className="course-main">
            <div className="card">
              {renderPlayerContent()}
              
              {currentLesson.type === 'video' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button className="btn" onClick={handlePrev}>Aula Anterior</button>
                  <button 
                    className={`btn ${completedLessons.has(currentLesson.id) ? 'btn' : 'btn-success'}`} 
                    onClick={handleToggleCompletion}
                  >
                    {completedLessons.has(currentLesson.id) ? 'Desmarcar Conclusão' : 'Marcar como Concluída'}
                  </button>
                  <button className="btn btn-accent" onClick={handleNext}>Próxima Aula</button>
                </div>
              )}
  
              {currentLesson.type === 'quiz' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button className="btn" onClick={handlePrev}>Aula Anterior</button>
                  <button className="btn btn-accent" onClick={handleNext}>Próxima Aula</button>
                </div>
              )}
            </div>
            
            <QuestionArea
              courseId={courseId}
              lessonId={currentLesson.id}
              questions={questions}
              onAskQuestion={onAskQuestion}
            />
          </div>
          
          <div className="course-sidebar">
            <div className="card">
              <h4>Progresso do Curso</h4>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${localProgress}%` }}></div>
              </div>
              <p>{localProgress}% concluído</p>
            </div>
  
            <div className="card">
              <h3>Conteúdo do Curso</h3>
              {courseContent.map((module, moduleIndex) => {
                const isModuleLocked = !unlockedModules.has(moduleIndex);
                return (
                  <div className="module" key={module.id}>
                    <div className={`module-header ${isModuleLocked ? 'locked' : ''}`}>
                      {module.title} {isModuleLocked ? '(Bloqueado)' : ''}
                    </div>
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isActive = moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;
                      const isCompleted = completedLessons.has(lesson.id);
                      
                      return (
                        <div 
                          className={`lesson ${isActive ? 'active' : ''} ${isModuleLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`} 
                          key={lesson.id}
                          onClick={() => goToLesson(moduleIndex, lessonIndex)}
                        >
                          <span>{lesson.title}</span>
                          <span>{isCompleted ? <Check size={16} strokeWidth={2.5} aria-label="Concluída" /> : lesson.duration}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default LessonPlayerPage;
