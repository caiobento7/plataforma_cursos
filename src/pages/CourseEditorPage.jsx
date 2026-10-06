import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, FileUp, Pencil, Plus, X } from 'lucide-react';
import MiniQuizEditor from '../components/MiniQuizEditor.jsx';
import { api } from '../services/api.js';

const maxMaterialSize = 20 * 1024 * 1024;
const materialAccept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg';

const materialName = (url) => {
  try {
    // Arquivos enviados ficam como <uuid>-<nome>; mostra só o nome original.
    return decodeURIComponent(new URL(url).pathname.split('/').pop()).replace(/^[0-9a-f-]{36}-/, '');
  } catch {
    return url;
  }
};

const emptyLessonForm = { title: '', duration: '10 min', type: 'video', videoUrl: '', documentUrl: '' };

// Itens criados no editor recebem ids temporários (texto). A API reconhece
// que não são numéricos e os insere como novos ao salvar.
const temporaryId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const cloneContent = (content) => JSON.parse(JSON.stringify(content || []));

const CourseEditorPage = ({ navigateTo, course, content, onSaveContent }) => {
  const [modules, setModules] = useState(() => cloneContent(content));
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [renamingModule, setRenamingModule] = useState(null); // { id, title }
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [formModuleId, setFormModuleId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null); // dados originais da aula em edição
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');
  const materialInputRef = useRef(null);

  // Sincroniza com o conteúdo vindo da API (carregamento inicial e após salvar).
  useEffect(() => {
    if (Array.isArray(content)) setModules(cloneContent(content));
  }, [content]);

  const isLoading = content === undefined;
  const hasLoadError = content === null;
  const hasUnsavedChanges = Array.isArray(content) && JSON.stringify(modules) !== JSON.stringify(content);

  const updateModule = (moduleId, update) => {
    setModules((previous) => previous.map((module) => (module.id === moduleId ? update(module) : module)));
  };

  const closeLessonForm = () => {
    setMaterialError('');
    setLessonForm(emptyLessonForm);
    setFormModuleId(null);
    setEditingLesson(null);
  };

  const openNewLessonForm = (moduleId) => {
    setLessonForm(emptyLessonForm);
    setEditingLesson(null);
    setFormModuleId(moduleId);
  };

  const handleAddModule = (event) => {
    event.preventDefault();
    const title = newModuleTitle.trim();
    if (!title) return;

    setModules((previous) => [...previous, { id: temporaryId('modulo'), title, lessons: [] }]);
    setNewModuleTitle('');
  };

  const handleRenameModule = (event) => {
    event.preventDefault();
    const title = renamingModule.title.trim();
    if (!title) return;
    updateModule(renamingModule.id, (module) => ({ ...module, title }));
    setRenamingModule(null);
  };

  const handleDeleteModule = (module) => {
    const lessonCount = module.lessons.length;
    const detail = lessonCount > 0 ? ` As ${lessonCount} aula(s) dele também serão removidas.` : '';
    if (!window.confirm(`Excluir o módulo "${module.title}"?${detail}`)) return;

    setModules((previous) => previous.filter((item) => item.id !== module.id));
    if (formModuleId === module.id) closeLessonForm();
  };

  const handleLessonFormChange = (field, value) => {
    setLessonForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleMaterialFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setMaterialError('');
    if (file.size > maxMaterialSize) {
      setMaterialError('O arquivo deve ter no máximo 20 MB.');
      return;
    }

    setIsUploadingMaterial(true);
    try {
      const publicUrl = await api.uploadCourseMaterial(course.id, file);
      handleLessonFormChange('documentUrl', publicUrl);
    } catch (error) {
      setMaterialError(error.message);
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const saveLesson = (moduleId, lessonData) => {
    if (editingLesson) {
      updateModule(moduleId, (module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => (lesson.id === editingLesson.id ? { ...lessonData, id: editingLesson.id } : lesson)),
      }));
    } else {
      updateModule(moduleId, (module) => ({
        ...module,
        lessons: [...module.lessons, { ...lessonData, id: temporaryId('aula') }],
      }));
    }
    closeLessonForm();
  };

  const validateLessonBasics = () => {
    if (!lessonForm.title.trim() || !lessonForm.duration.trim()) {
      alert('Preencha o título e a duração da aula.');
      return false;
    }
    return true;
  };

  const handleSaveVideoLesson = (moduleId) => {
    if (!validateLessonBasics()) return;
    saveLesson(moduleId, {
      title: lessonForm.title.trim(),
      duration: lessonForm.duration.trim(),
      type: 'video',
      videoUrl: lessonForm.videoUrl.trim() || null,
      documentUrl: lessonForm.documentUrl.trim() || null,
    });
  };

  const handleSaveQuizLesson = (moduleId, quizData) => {
    if (!validateLessonBasics()) return;
    saveLesson(moduleId, {
      title: lessonForm.title.trim(),
      duration: lessonForm.duration.trim(),
      type: 'quiz',
      quizData,
    });
  };

  const handleDeleteLesson = (moduleId, lesson) => {
    if (!window.confirm(`Excluir a aula "${lesson.title}"?`)) return;
    updateModule(moduleId, (module) => ({ ...module, lessons: module.lessons.filter((item) => item.id !== lesson.id) }));
    if (editingLesson?.id === lesson.id) closeLessonForm();
  };

  const handleStartEditLesson = (moduleId, lesson) => {
    setEditingLesson(lesson);
    setFormModuleId(moduleId);
    setLessonForm({
      title: lesson.title,
      duration: lesson.duration,
      type: lesson.type,
      videoUrl: lesson.videoUrl || '',
      documentUrl: lesson.documentUrl || '',
    });
  };

  const handleMoveModule = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const reordered = [...modules];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setModules(reordered);
  };

  const handleMoveLesson = (moduleId, lessonIndex, direction) => {
    updateModule(moduleId, (module) => {
      const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
      if (newIndex < 0 || newIndex >= module.lessons.length) return module;

      const lessons = [...module.lessons];
      [lessons[lessonIndex], lessons[newIndex]] = [lessons[newIndex], lessons[lessonIndex]];
      return { ...module, lessons };
    });
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await onSaveContent(course.id, modules);
      closeLessonForm();
      alert('Conteúdo do curso salvo com sucesso!');
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges && !window.confirm('Existem alterações não salvas. Deseja sair mesmo assim?')) return;
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

  if (isLoading || hasLoadError) {
    return (
      <div className="container course-editor">
        <button className="btn" onClick={() => navigateTo('dashboard', 'manage-courses')} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} aria-hidden="true" /> Voltar para Gerenciador
        </button>
        <div className="card">
          <h2>Editor de Conteúdo: {course.title}</h2>
          {isLoading ? (
            <p>Carregando conteúdo do curso...</p>
          ) : (
            <>
              <p className="editor-feedback error">Não foi possível carregar o conteúdo deste curso.</p>
              <button className="btn" onClick={() => navigateTo('courseEditor', course.id)}>Tentar novamente</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderLessonForm = (module) => (
    <div className="add-lesson-form">
      <h4>{editingLesson ? `Editando: ${editingLesson.title}` : `Nova aula em: ${module.title}`}</h4>

      <div className="form-group">
        <label>Título da Aula</label>
        <input type="text" value={lessonForm.title} onChange={(event) => handleLessonFormChange('title', event.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: '15px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Duração</label>
          <input type="text" placeholder="ex: 15 min" value={lessonForm.duration} onChange={(event) => handleLessonFormChange('duration', event.target.value)} />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Tipo</label>
          <select value={lessonForm.type} onChange={(event) => handleLessonFormChange('type', event.target.value)}>
            <option value="video">Vídeo</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>
      </div>

      {lessonForm.type === 'video' ? (
        <>
          <div className="form-group">
            <label>URL do Vídeo (arquivo .mp4)</label>
            <input type="url" placeholder="https://.../meu-video.mp4" value={lessonForm.videoUrl} onChange={(event) => handleLessonFormChange('videoUrl', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Material de Apoio - Opcional</label>
            <div className="material-picker">
              <input type="url" placeholder="Cole um link ou escolha um arquivo" value={lessonForm.documentUrl} onChange={(event) => handleLessonFormChange('documentUrl', event.target.value)} disabled={isUploadingMaterial} />
              <button type="button" className="btn" onClick={() => materialInputRef.current?.click()} disabled={isUploadingMaterial}>
                <FileUp size={16} aria-hidden="true" /> {isUploadingMaterial ? 'Enviando...' : 'Escolher arquivo'}
              </button>
              <input ref={materialInputRef} type="file" accept={materialAccept} onChange={handleMaterialFileChange} hidden />
            </div>
            {lessonForm.documentUrl && !isUploadingMaterial && (
              <p className="material-current">
                Material: <a href={lessonForm.documentUrl} target="_blank" rel="noopener noreferrer">{materialName(lessonForm.documentUrl)}</a>
                <button type="button" onClick={() => handleLessonFormChange('documentUrl', '')}>Remover</button>
              </p>
            )}
            {materialError && <p className="editor-feedback error">{materialError}</p>}
            <small className="material-hint">PDF, Word, PowerPoint, Excel, ZIP, TXT, PNG ou JPG, até 20 MB.</small>
          </div>
          <button type="button" className={editingLesson ? 'btn btn-success' : 'btn btn-accent'} style={{ width: '100%' }} onClick={() => handleSaveVideoLesson(module.id)} disabled={isUploadingMaterial}>
            {editingLesson ? 'Aplicar Edição' : 'Adicionar Aula'}
          </button>
        </>
      ) : (
        <MiniQuizEditor
          key={editingLesson?.id || 'novo-quiz'}
          initialQuiz={editingLesson?.type === 'quiz' ? editingLesson.quizData : null}
          submitLabel={editingLesson ? 'Aplicar Edição do Quiz' : 'Adicionar Aula de Quiz'}
          onSaveQuiz={(quizData) => handleSaveQuizLesson(module.id, quizData)}
        />
      )}

      <button type="button" className="btn editor-cancel-button" onClick={closeLessonForm}>
        Cancelar
      </button>
    </div>
  );

  return (
    <div className="container course-editor">
      <button className="btn" onClick={handleBack} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} aria-hidden="true" /> Voltar para Gerenciador
      </button>
      <div className="card">
        <div className="editor-title-row">
          <div>
            <h2>Editor de Conteúdo: {course.title}</h2>
            <p>Organize módulos, aulas e quizzes. As alterações só valem depois de salvar.</p>
          </div>
          {hasUnsavedChanges && <span className="editor-unsaved-badge">Alterações não salvas</span>}
        </div>

        <div style={{ marginTop: '20px' }}>
          {modules.length === 0 && <p className="editor-empty">Este curso ainda não tem módulos. Adicione o primeiro abaixo.</p>}

          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="editor-module">
              <div className="editor-module-header">
                {renamingModule?.id === module.id ? (
                  <form className="editor-rename-form" onSubmit={handleRenameModule}>
                    <input
                      type="text"
                      aria-label="Novo título do módulo"
                      value={renamingModule.title}
                      onChange={(event) => setRenamingModule({ id: module.id, title: event.target.value })}
                      autoFocus
                    />
                    <button type="submit" className="btn order-btn" title="Confirmar"><Check size={16} aria-hidden="true" /></button>
                    <button type="button" className="btn order-btn" title="Cancelar" onClick={() => setRenamingModule(null)}><X size={16} aria-hidden="true" /></button>
                  </form>
                ) : (
                  <h3>{module.title}</h3>
                )}
                <div className="editor-lesson-controls">
                  <button className="btn order-btn" title="Renomear Módulo" onClick={() => setRenamingModule({ id: module.id, title: module.title })}>
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button className="btn order-btn" title="Mover Módulo Para Cima" onClick={() => handleMoveModule(moduleIndex, 'up')} disabled={moduleIndex === 0}>
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button className="btn order-btn" title="Mover Módulo Para Baixo" onClick={() => handleMoveModule(moduleIndex, 'down')} disabled={moduleIndex === modules.length - 1}>
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                  <button className="btn-danger" style={{ fontSize: '12px' }} onClick={() => handleDeleteModule(module)}>
                    Excluir Módulo
                  </button>
                </div>
              </div>
              <div className="editor-lessons">
                {module.lessons.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>Nenhuma aula neste módulo.</p>
                ) : (
                  module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className={`editor-lesson ${editingLesson?.id === lesson.id ? 'editing' : ''}`}>
                      <div>
                        <span>{lessonIndex + 1}. {lesson.title}</span>
                        <br />
                        <small>
                          {lesson.type === 'video' ? 'Vídeo' : `Quiz · ${lesson.quizData?.questions?.length || 0} pergunta(s)`} &bull; {lesson.duration}
                        </small>
                      </div>
                      <div className="editor-lesson-controls">
                        <button className="btn order-btn" title="Mover Aula Para Cima" onClick={() => handleMoveLesson(module.id, lessonIndex, 'up')} disabled={lessonIndex === 0}>
                          <ArrowUp size={16} aria-hidden="true" />
                        </button>
                        <button className="btn order-btn" title="Mover Aula Para Baixo" onClick={() => handleMoveLesson(module.id, lessonIndex, 'down')} disabled={lessonIndex === module.lessons.length - 1}>
                          <ArrowDown size={16} aria-hidden="true" />
                        </button>
                        <button className="btn order-btn" style={{ width: 'auto', padding: '0 8px' }} title="Editar Aula" onClick={() => handleStartEditLesson(module.id, lesson)}>
                          Editar
                        </button>
                        <button className="btn-danger" style={{ fontSize: '12px' }} onClick={() => handleDeleteLesson(module.id, lesson)}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {formModuleId === module.id ? (
                renderLessonForm(module)
              ) : (
                <div className="editor-add-lesson">
                  <button type="button" className="btn btn-accent" onClick={() => openNewLessonForm(module.id)}>
                    <Plus size={16} aria-hidden="true" /> Adicionar aula
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <form className="add-module-form card" onSubmit={handleAddModule}>
          <h3>Adicionar Novo Módulo</h3>
          <div className="form-group">
            <label>Título do Módulo</label>
            <input type="text" placeholder="Ex: Módulo 1: Introdução" value={newModuleTitle} onChange={(event) => setNewModuleTitle(event.target.value)} />
          </div>
          <button type="submit" className="btn" style={{ width: '100%' }}>Adicionar Módulo</button>
        </form>

        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

        {saveError && <p className="editor-feedback error" role="alert">{saveError}</p>}
        <button className="btn btn-success" style={{ width: '100%', fontSize: '18px' }} onClick={handleSaveContent} disabled={isSaving || !hasUnsavedChanges}>
          {isSaving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar Alterações do Curso' : 'Nenhuma alteração para salvar'}
        </button>
      </div>
    </div>
  );
};

export default CourseEditorPage;
