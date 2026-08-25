import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import QuizComponent from '../components/QuizComponent.jsx';
import QuestionArea from '../components/QuestionArea.jsx';
import { calculateProgress } from '../utils/courseUtils.js';

const LessonPlayerPage = ({ navigateTo, courseId, content, progress, onProgressUpdate, questions, onAskQuestion }) => {
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    
    // Memorizados para manter a referência estável entre renderizações: sem isso,
    // o `|| []` e o `new Set()` criariam objetos novos a cada render e o efeito
    // de desbloqueio de módulos abaixo dispararia sem necessidade.
    const courseContent = useMemo(() => content || [], [content]);

    const currentProgress = useMemo(
      () => progress || { completed: new Set(), unlocked: new Set([0]) },
      [progress]
    );
    const { completed: completedLessons, unlocked: unlockedModules } = currentProgress;

    // ATENÇÃO: este efeito precisa ficar ANTES do return antecipado de
    // "Conteúdo Indisponível". Hooks devem ser chamados na mesma ordem em todas
    // as renderizações; se ele ficasse depois do return, um curso sem aulas
    // registraria menos hooks e o React quebraria ao receber o conteúdo depois.
    // O caso "sem conteúdo" já é tratado pela guarda na primeira linha do efeito.
    useEffect(() => {
      if (courseContent.length === 0 || !courseContent[currentModuleIndex]) return;

      const nextModuleIndex = currentModuleIndex + 1;

      if (nextModuleIndex >= courseContent.length || unlockedModules.has(nextModuleIndex)) {
        return;
      }

      const currentModule = courseContent[currentModuleIndex];
      const lessonsInModule = currentModule.lessons;
      const quizzesInModule = lessonsInModule.filter(l => l.type === 'quiz');
      const contentLessonsInModule = lessonsInModule.filter(l => l.type === 'video');

      let isModuleComplete = false;

      if (quizzesInModule.length > 0) {
        isModuleComplete = quizzesInModule.every(q => completedLessons.has(q.id));
      } else if (contentLessonsInModule.length > 0) {
        isModuleComplete = contentLessonsInModule.every(v => completedLessons.has(v.id));
      } else {
        isModuleComplete = true;
      }

      if (isModuleComplete) {
        const newUnlocked = new Set(unlockedModules).add(nextModuleIndex);
        onProgressUpdate(courseId, { unlocked: newUnlocked });
      }

    }, [completedLessons, currentModuleIndex, unlockedModules, courseId, courseContent, onProgressUpdate]);

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
    
    const localProgress = calculateProgress(courseId, { [courseId]: currentProgress }, courseContent);
  
    const renderPlayerContent = () => {
      switch(currentLesson.type) {
        case 'video':
          return (
            <>
              <video 
                key={currentLesson.id} 
                className="video-player" 
                controls 
                src={currentLesson.videoUrl || 'https://youtu.be/6wcnqU9nAms?si=xLStGSVCYn5MyThl'} 
              >
                Seu navegador não suporta a tag de vídeo.
              </video>
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
              <p>{localProgress}% concluído (aulas de vídeo)</p>
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
