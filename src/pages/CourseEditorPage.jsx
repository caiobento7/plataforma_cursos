import React, { useState, useEffect } from 'react';
import MiniQuizEditor from '../components/MiniQuizEditor.jsx';

const CourseEditorPage = ({ navigateTo, course, content, onUpdateContent }) => {
    const [modules, setModules] = useState([]);
    
    useEffect(() => {
      setModules(JSON.parse(JSON.stringify(content || [])));
    }, [content, course]);
    
    const [newModuleTitle, setNewModuleTitle] = useState('');
    
    const [newLessonForm, setNewLessonForm] = useState({ 
      title: '', 
      duration: '10 min', 
      type: 'video',
      videoUrl: '', 
      documentUrl: '' 
    }); 
  
    const [editingLesson, setEditingLesson] = useState(null); // { moduleId, data: lessonData }
  
    const handleAddModule = (e) => {
      e.preventDefault();
      if (!newModuleTitle.trim()) return;
      
      const newModule = {
        id: `mod-${Date.now()}`,
        title: newModuleTitle,
        lessons: []
      };
      setModules(prev => [...prev, newModule]);
      setNewModuleTitle('');
    };
  
    const handleDeleteModule = (moduleId) => {
      const moduleTitle = modules.find(m => m.id === moduleId)?.title;
      if (window.confirm(`Tem certeza que deseja excluir o módulo: "${moduleTitle}"?`)) {
        setModules(prev => prev.filter(m => m.id !== moduleId));
      }
    };
  
    const handleLessonFormChange = (field, value) => {
      setNewLessonForm(prev => ({ ...prev, [field]: value }));
    };
    
    const resetLessonForm = () => {
      setNewLessonForm({ title: '', duration: '10 min', type: 'video', videoUrl: '', documentUrl: '' });
      setEditingLesson(null);
    };
  
    const handleSaveLesson = (e, moduleId) => {
      e.preventDefault();
      
      if (editingLesson) {
        if (!newLessonForm.title.trim()) return;
        
        const updatedLesson = {
          ...editingLesson.data, 
          title: newLessonForm.title,
          duration: newLessonForm.duration,
          type: newLessonForm.type,
          videoUrl: newLessonForm.videoUrl || null,
          documentUrl: newLessonForm.documentUrl || null
        };
  
        setModules(prev => prev.map(m => {
          if (m.id === editingLesson.moduleId) {
            return {
              ...m,
              lessons: m.lessons.map(l => l.id === editingLesson.data.id ? updatedLesson : l)
            };
          }
          return m;
        }));
        
      } else {
        if (!newLessonForm.title.trim() || !newLessonForm.duration.trim()) {
          alert('Preencha o título e a duração da aula.');
          return;
        }
        
        const newLesson = {
          id: `${course.id}-${moduleId}-${Date.now()}`,
          title: newLessonForm.title,
          duration: newLessonForm.duration,
          type: newLessonForm.type,
          videoUrl: newLessonForm.videoUrl || null,
          documentUrl: newLessonForm.documentUrl || null
        };
        
        setModules(prev => prev.map(m => {
          if (m.id === moduleId) {
            return { ...m, lessons: [...m.lessons, newLesson] };
          }
          return m;
        }));
      }
      
      resetLessonForm();
    };
    
    const handleSaveQuizLesson = (moduleId, quizData) => {
      if (!newLessonForm.title.trim()) {
        alert('Preencha o título da aula de quiz.');
        return;
      }
  
      const newLesson = {
        id: `${course.id}-${moduleId}-${Date.now()}`,
        title: newLessonForm.title,
        duration: newLessonForm.duration, 
        type: 'quiz',
        quizData: quizData 
      };
  
      if (editingLesson) {
        const updatedLesson = { ...newLesson, id: editingLesson.data.id }; 
        
        setModules(prev => prev.map(m => {
          if (m.id === editingLesson.moduleId) {
            return {
              ...m,
              lessons: m.lessons.map(l => l.id === editingLesson.data.id ? updatedLesson : l)
            };
          }
          return m;
        }));
        
      } else {
        setModules(prev => prev.map(m => {
          if (m.id === moduleId) {
            return { ...m, lessons: [...m.lessons, newLesson] };
          }
          return m;
        }));
      }
  
      resetLessonForm();
    };
  
    const handleDeleteLesson = (moduleId, lessonId) => {
      const lessonTitle = modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId)?.title;
      if (window.confirm(`Tem certeza que deseja excluir a aula: "${lessonTitle}"?`)) {
        setModules(prev => prev.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.filter(l => l.id !== lessonId)
            };
          }
          return m;
        }));
      }
    };
    
    const handleStartEditLesson = (moduleId, lessonId) => {
      const module = modules.find(m => m.id === moduleId);
      const lesson = module.lessons.find(l => l.id === lessonId);
      
      if (lesson) {
        setEditingLesson({ moduleId, data: lesson });
        setNewLessonForm({
          title: lesson.title,
          duration: lesson.duration,
          type: lesson.type,
          videoUrl: lesson.videoUrl || '',
          documentUrl: lesson.documentUrl || ''
        });
      }
    };
    
    const handleMoveModule = (index, direction) => {
      const newModules = [...modules];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= newModules.length) return; 
      
      [newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]];
      
      setModules(newModules);
    };
  
    const handleMoveLesson = (moduleId, lessonIndex, direction) => {
      const newModules = [...modules];
      const moduleIndexInState = newModules.findIndex(m => m.id === moduleId); 
      if (moduleIndexInState === -1) return;
  
      const module = newModules[moduleIndexInState];
      const newLessons = [...module.lessons];
      const newLessonIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
      
      if (newLessonIndex < 0 || newLessonIndex >= newLessons.length) return; 
  
      [newLessons[lessonIndex], newLessons[newLessonIndex]] = [newLessons[newLessonIndex], newLessons[lessonIndex]];
      
      newModules[moduleIndexInState] = { ...module, lessons: newLessons };
      setModules(newModules);
    };
  
    const handleSaveContent = () => {
      onUpdateContent(course.id, modules);
      alert('Conteúdo do curso salvo com sucesso!');
      navigateTo('dashboard', 'manage-courses'); 
    };
  
    if (!course) {
      return (
        <div className="container" style={{ marginTop: '30px' }}>
          <h2>Curso não encontrado</h2>
          <button className="btn" onClick={() => navigateTo('dashboard')}>Voltar para o Painel</button>
        </div>
      );
    }
  
    return (
      <div className="container course-editor">
        <button className="btn" onClick={() => navigateTo('dashboard', 'manage-courses')} style={{marginBottom: '20px'}}>
          &larr; Voltar para Gerenciador
        </button>
        <div className="card">
          <h2>Editor de Conteúdo: {course.title}</h2>
          <p>Adicione módulos e aulas ao seu curso.</p>
  
          <div style={{marginTop: '20px'}}>
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="editor-module">
                <div className="editor-module-header">
                  <h3>{module.title}</h3>
                  <div className="editor-lesson-controls">
                     <button 
                      className="btn order-btn" 
                      title="Mover Módulo Para Cima"
                      onClick={() => handleMoveModule(moduleIndex, 'up')}
                      disabled={moduleIndex === 0}
                    >
                      &#8593;
                    </button>
                    <button 
                      className="btn order-btn" 
                      title="Mover Módulo Para Baixo"
                      onClick={() => handleMoveModule(moduleIndex, 'down')}
                      disabled={moduleIndex === modules.length - 1}
                    >
                      &#8595;
                    </button>
                    <button className="btn-danger" style={{fontSize: '12px'}} onClick={() => handleDeleteModule(module.id)}>
                      Excluir Módulo
                    </button>
                  </div>
                </div>
                <div className="editor-lessons">
                  {module.lessons.length === 0 ? (
                    <p style={{textAlign: 'center', color: 'var(--text-light)'}}>Nenhuma aula neste módulo.</p>
                  ) : (
                    module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="editor-lesson">
                        <div>
                          <span>{lessonIndex + 1}. {lesson.title}</span>
                          <br/>
                          <small>{lesson.type === 'video' ? 'Vídeo' : 'Quiz'} &bull; {lesson.duration}</small>
                        </div>
                        <div className="editor-lesson-controls">
                          <button 
                            className="btn order-btn" 
                            title="Mover Aula Para Cima"
                            onClick={() => handleMoveLesson(module.id, lessonIndex, 'up')}
                            disabled={lessonIndex === 0}
                          >
                            &#8593;
                          </button>
                          <button 
                            className="btn order-btn" 
                            title="Mover Aula Para Baixo"
                            onClick={() => handleMoveLesson(module.id, lessonIndex, 'down')}
                            disabled={lessonIndex === module.lessons.length - 1}
                          >
                            &#8595;
                          </button>
                           <button 
                            className="btn order-btn" 
                            style={{width: 'auto', padding: '0 8px'}}
                            title="Editar Aula"
                            onClick={() => handleStartEditLesson(module.id, lesson.id)}
                          >
                            Editar
                          </button>
                          <button className="btn-danger" style={{fontSize: '12px'}} onClick={() => handleDeleteLesson(module.id, lesson.id)}>
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="add-lesson-form">
                  <h4>{editingLesson && editingLesson.moduleId === module.id ? 'Editando Aula' : `Adicionar Aula a: ${module.title}`}</h4>
                  
                  <div> 
                    <div className="form-group">
                      <label>Título da Aula</label>
                      <input 
                        type="text" 
                        value={newLessonForm.title}
                        onChange={(e) => handleLessonFormChange('title', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Duração</label>
                        <input 
                          type="text" 
                          placeholder="ex: 15 min"
                          value={newLessonForm.duration}
                          onChange={(e) => handleLessonFormChange('duration', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Tipo</label>
                        <select
                          value={newLessonForm.type}
                          onChange={(e) => handleLessonFormChange('type', e.target.value)}
                          disabled={editingLesson && editingLesson.data.type === 'quiz'}
                        >
                          <option value="video">Vídeo</option>
                          <option value="quiz">Quiz</option>
                        </select>
                      </div>
                    </div>
                    
                    {newLessonForm.type === 'video' && (
                      <>
                        <div className="form-group">
                          <label>URL do Vídeo</label>
                          <input 
                            type="text" 
                            placeholder="https://.../meu-video.mp4" 
                            value={newLessonForm.videoUrl || ''}
                            onChange={(e) => handleLessonFormChange('videoUrl', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>URL do Material de Apoio (PDF, etc.) - Opcional</label>
                          <input 
                            type="text" 
                            placeholder="https://.../meu-arquivo.pdf" 
                            value={newLessonForm.documentUrl || ''}
                            onChange={(e) => handleLessonFormChange('documentUrl', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    
                    {newLessonForm.type !== 'quiz' && (
                      <button 
                        type="button" 
                        className={editingLesson ? 'btn btn-success' : 'btn btn-accent'}
                        style={{width: '100%'}} 
                        onClick={(e) => handleSaveLesson(e, module.id)}
                      >
                        {editingLesson ? 'Salvar Edição' : 'Adicionar Aula'}
                      </button>
                    )}
                    
                    {newLessonForm.type === 'quiz' && !editingLesson && (
                      <MiniQuizEditor 
                        onSaveQuiz={(quizData) => handleSaveQuizLesson(module.id, quizData)}
                      />
                    )}
                    
                    {newLessonForm.type === 'quiz' && editingLesson && (
                      <p style={{color: 'var(--text-light)', textAlign: 'center'}}>A edição de quizzes existentes não é suportada nesta simulação. Cancele a edição para adicionar um novo quiz.</p>
                    )}
                    
                    {editingLesson && (
                       <button 
                        type="button" 
                        className="btn" 
                        style={{width: '100%', marginTop: '10px', backgroundColor: 'var(--text-light)'}} 
                        onClick={resetLessonForm}
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
  
          <form className="add-module-form card" onSubmit={handleAddModule}>
            <h3>Adicionar Novo Módulo</h3>
            <div className="form-group">
              <label>Título do Módulo</label>
              <input 
                type="text" 
                placeholder="Ex: Módulo 1: Introdução"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" style={{width: '100%'}}>Adicionar Módulo</button>
          </form>
          
          <hr style={{margin: '20px 0', border: 'none', borderTop: '1px solid var(--border)'}} />
          
          <button className="btn btn-success" style={{width: '100%', fontSize: '18px'}} onClick={handleSaveContent}>
            Salvar Alterações do Curso
          </button>
  
        </div>
      </div>
    );
  };

  export default CourseEditorPage;