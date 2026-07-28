import React from 'react';

const CourseCard = ({ course, navigateTo }) => {
  // --- CORREÇÃO: Adiciona uma verificação de segurança ---
  // Se o curso for indefinido por qualquer motivo, não renderiza nada
  if (!course) {
    return null; 
  }
  // --- FIM DA CORREÇÃO ---

  return (
    <div className="course-card" onClick={() => navigateTo('details', course.id)}>
      <img 
        src={course.imageUrl} 
        alt={course.title} 
        className="course-image" 
        onError={(e) => e.target.src = 'https://placehold.co/600x400/2c3e50/ffffff?text=Imagem+Indisponível'}
      />
      <div className="course-info">
        <div className="course-title">{course.title}</div>
        <div className="course-instructor">{course.instructor}</div>
        
        <div className="course-meta-tags">
          <span className="course-level">{course.level}</span>
          <span className="course-rating">★ {course.rating}</span>
        </div>

        <div className="course-price">
          {course.price === 0 ? 'Gratuito' : `R$ ${course.price.toFixed(2)}`}
        </div>
        <button className="btn">Ver Detalhes</button>
      </div>
    </div>
  );
};

export default CourseCard;