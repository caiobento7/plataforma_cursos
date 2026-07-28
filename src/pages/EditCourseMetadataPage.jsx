import React, { useState } from 'react';

const EditCourseMetadataPage = ({ navigateTo, course, onUpdateCourse }) => {
    const [title, setTitle] = useState(course?.title ?? '');
    const [instructor, setInstructor] = useState(course?.instructor ?? '');
    const [price, setPrice] = useState(course?.price ?? 0);
    const [level, setLevel] = useState(course?.level ?? 'Iniciante');
    const [imageUrl, setImageUrl] = useState(course?.imageUrl ?? '');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      const updatedCourse = {
        ...course,
        title,
        instructor,
        price: parseFloat(price),
        level,
        imageUrl,
      };
      onUpdateCourse(course.id, updatedCourse);
      alert('Detalhes do curso atualizados com sucesso!');
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
      <div className="container">
        <button className="btn" onClick={() => navigateTo('dashboard', 'manage-courses')} style={{marginTop: '20px'}}>
          &larr; Voltar para Gerenciador
        </button>
        <div className="card form-container">
          <h2>Editar Detalhes do Curso</h2>
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
              <label htmlFor="course-instructor">Instrutor</label>
              <input 
                type="text" 
                id="course-instructor" 
                value={instructor} 
                onChange={(e) => setInstructor(e.target.value)} 
                required 
              />
            </div>
             <div className="form-group">
              <label htmlFor="course-image">URL da Imagem</label>
              <input 
                type="text" 
                id="course-image" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                required 
              />
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
            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
              Salvar Alterações
            </button>
          </form>
        </div>
      </div>
    );
  };

  export default EditCourseMetadataPage;