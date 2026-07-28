import React from 'react';
// --- CORREÇÃO: Caminho relativo correto ---
import CourseCard from '../components/CourseCard.jsx';

const HomePage = ({ navigateTo, courses, filters, setFilters }) => {

    const handleFilterChange = (e) => {
      setFilters(prevFilters => ({
        ...prevFilters,
        [e.target.name]: e.target.value
      }));
    };
  
    return (
      <>
        <section className="hero">
          <div className="container">
            <h1>Encontre o curso perfeito para você</h1>
            <p>Aprenda com os melhores instrutores e transforme sua carreira</p>
          </div>
        </section>
  
        <div className="container">
          <div className="card">
            <h2>Filtrar cursos</h2>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <select name="level" value={filters.level} onChange={handleFilterChange} style={{ flex: 1, minWidth: '150px' }}>
                <option value="all">Nível (Todos)</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
              <select name="price" value={filters.price} onChange={handleFilterChange} style={{ flex: 1, minWidth: '150px' }}>
                <option value="all">Preço (Todos)</option>
                <option value="gratuito">Gratuitos</option>
                <option value="ate50">Até R$ 50</option>
                <option value="50a100">R$ 50 - R$ 100</option>
                <option value="acima100">Acima de R$ 100</option>
              </select>
              <select name="rating" value={filters.rating} onChange={handleFilterChange} style={{ flex: 1, minWidth: '150px' }}>
                <option value="all">Avaliação (Todas)</option>
                <option value="4.5">4.5 estrelas ou mais</option>
                <option value="4">4 estrelas ou mais</option>
                <option value="3">3 estrelas ou mais</option>
              </select>
            </div>
          </div>
  
          <div className="course-grid">
            {courses.length > 0 ? (
              courses.map(course => (
                <CourseCard key={course.id} course={course} navigateTo={navigateTo} />
              ))
            ) : (
              <p>Nenhum curso encontrado com esses critérios.</p>
            )}
          </div>
        </div>
      </>
    );
  };

  export default HomePage;