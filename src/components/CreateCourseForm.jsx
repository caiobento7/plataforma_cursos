import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const CreateCourseForm = ({ onCourseCreate }) => {
    const [title, setTitle] = useState('');
    // Autor fixo: a plataforma ainda não tem autenticação real, então o curso
    // criado é sempre atribuído ao professor da sessão simulada.
    const [price, setPrice] = useState(0);
    const [level, setLevel] = useState('Iniciante');
    const [description, setDescription] = useState('');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      const newCourse = {
        id: Date.now(),
        title,
        price: parseFloat(price),
        level,
        rating: 0, 
        imageUrl: `https://placehold.co/600x400/2c3e50/ffffff?text=${encodeURIComponent(title)}`,
        description 
      };
  
      onCourseCreate(newCourse);
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="course-title">Título do Curso</label>
          <input 
            type="text" 
            id="course-title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="course-desc">Descrição Curta</label>
          <textarea 
            id="course-desc" 
            rows="4" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="course-price">Preço (R$)</label>
            <input 
              type="number" 
              id="course-price" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              min="0" 
              step="0.01" 
              required 
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="course-level">Nível</label>
            <select 
              id="course-level" 
              value={level} 
              onChange={(e) => setLevel(e.target.value)}
            >
              <option>Iniciante</option>
              <option>Intermediário</option>
              <option>Avançado</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn admin-submit-button" style={{ width: '100%' }}>
          Próximo: Adicionar Conteúdo <ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>
    );
  };

  export default CreateCourseForm;
