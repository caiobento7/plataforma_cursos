import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const EditCourseMetadataPage = ({ navigateTo, course, onUpdateCourse }) => {
  const [title, setTitle] = useState(course?.title ?? '');
  const [price, setPrice] = useState(String(course?.price ?? 0));
  const [level, setLevel] = useState(course?.level ?? 'Iniciante');
  const [imageUrl, setImageUrl] = useState(course?.imageUrl ?? '');
  const [accessMonths, setAccessMonths] = useState(String(course?.accessMonths ?? 6));
  const [isSaving, setIsSaving] = useState(false);

  if (!course) {
    return (
      <section className="ui-page">
        <div className="container">
          <div className="ui-empty">
            <h2>Curso não encontrado</h2>
            <button type="button" className="ui-btn ui-btn-secondary" onClick={() => navigateTo('dashboard', 'courses')}>Voltar ao backoffice</button>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      // O App salva na API e volta para a lista de cursos.
      await onUpdateCourse(course.id, { title: title.trim(), price: Number(price), level, imageUrl: imageUrl.trim(), accessMonths: Number(accessMonths) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="ui-page">
      <div className="container bo-narrow">
        <button type="button" className="ui-back" onClick={() => navigateTo('dashboard', 'courses')}><ArrowLeft size={16} aria-hidden="true" /> Backoffice</button>
        <div className="ui-page-head">
          <div>
            <h1>Detalhes do curso</h1>
            <p>Título, preço, nível e imagem exibidos no catálogo.</p>
          </div>
        </div>

        <form className="bo-panel bo-form bo-edit" onSubmit={handleSubmit}>
          <img src={imageUrl || course.imageUrl} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
          <div>
            <div className="ui-field">
              <label htmlFor="course-title">Título do curso</label>
              <input className="ui-input" id="course-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="bo-form-row">
              <div className="ui-field">
                <label htmlFor="course-price">Preço (R$)</label>
                <input className="ui-input" type="number" id="course-price" value={price} onChange={(event) => setPrice(event.target.value)} min="0" step="0.01" required />
              </div>
              <div className="ui-field">
                <label htmlFor="course-level">Nível</label>
                <select className="ui-select" id="course-level" value={level} onChange={(event) => setLevel(event.target.value)}>
                  <option>Iniciante</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </div>
            </div>
            <div className="ui-field">
              <label htmlFor="course-access">Prazo de acesso (meses)</label>
              <input className="ui-input" type="number" id="course-access" value={accessMonths} onChange={(event) => setAccessMonths(event.target.value)} min="1" max="36" step="1" required />
              <small className="ui-muted">Vale para novas matrículas e renovações; as atuais mantêm a data já definida.</small>
            </div>
            <div className="ui-field">
              <label htmlFor="course-image">URL da imagem (opcional)</label>
              <input className="ui-input" type="url" id="course-image" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
            </div>
            <div className="bo-reply-actions">
              <button type="submit" className="ui-btn ui-btn-primary" disabled={isSaving || !title.trim()}>{isSaving ? 'Salvando...' : 'Salvar alterações'}</button>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => navigateTo('dashboard', 'courses')}>Cancelar</button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EditCourseMetadataPage;
