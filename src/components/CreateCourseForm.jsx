import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const CreateCourseForm = ({ onCourseCreate }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('0');
  const [level, setLevel] = useState('Iniciante');
  const [accessMonths, setAccessMonths] = useState('6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onCourseCreate({ title: title.trim(), price: Number(price), level, accessMonths: Number(accessMonths) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="ui-field">
        <label htmlFor="course-title">Título do curso</label>
        <input className="ui-input" id="course-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Excel para iniciantes" required />
      </div>
      <div className="bo-form-row">
        <div className="ui-field">
          <label htmlFor="course-price">Preço (R$)</label>
          <input className="ui-input" type="number" id="course-price" value={price} onChange={(event) => setPrice(event.target.value)} min="0" step="0.01" required />
          <small className="ui-muted">Use 0 para um curso gratuito.</small>
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
        <small className="ui-muted">Tempo que o aluno tem para concluir o curso a partir da matrícula.</small>
      </div>
      <button type="submit" className="ui-btn ui-btn-primary ui-btn-lg" disabled={isSubmitting || !title.trim()}>
        {isSubmitting ? 'Criando...' : 'Criar e adicionar conteúdo'} <ArrowRight size={17} aria-hidden="true" />
      </button>
    </form>
  );
};

export default CreateCourseForm;
