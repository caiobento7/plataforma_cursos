import { Search } from 'lucide-react';
import CourseCard from '../components/CourseCard.jsx';

// Catálogo da área do aluno: busca, filtros e a grade de cursos.
const HomePage = ({ navigateTo, courses, filters, setFilters, searchTerm, setSearchTerm, enrolledCourseIds = [] }) => {
  const handleFilterChange = (event) => {
    setFilters((previousFilters) => ({ ...previousFilters, [event.target.name]: event.target.value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ level: 'all', price: 'all', rating: 'all' });
  };

  return (
    <section className="ui-page">
      <div className="container">
        <div className="ui-page-head">
          <div>
            <h1>Catálogo</h1>
            <p>Encontre o próximo curso e matricule-se em poucos cliques.</p>
          </div>
        </div>

        <div className="ui-toolbar" role="search">
          <label className="ui-search">
            <Search size={18} aria-hidden="true" />
            <input className="ui-input" type="search" placeholder="Buscar por nome do curso" aria-label="Buscar cursos" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
          <select className="ui-select" name="level" value={filters.level} onChange={handleFilterChange} aria-label="Nível do curso">
            <option value="all">Todos os níveis</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>
          <select className="ui-select" name="price" value={filters.price} onChange={handleFilterChange} aria-label="Preço do curso">
            <option value="all">Qualquer preço</option>
            <option value="gratuito">Gratuitos</option>
            <option value="ate50">Até R$ 50</option>
            <option value="50a100">R$ 50 a R$ 100</option>
            <option value="acima100">Acima de R$ 100</option>
          </select>
          <select className="ui-select" name="rating" value={filters.rating} onChange={handleFilterChange} aria-label="Avaliação do curso">
            <option value="all">Qualquer avaliação</option>
            <option value="4.5">4,5 ou mais</option>
            <option value="4">4,0 ou mais</option>
            <option value="3">3,0 ou mais</option>
          </select>
          <span className="ui-toolbar-count">{courses.length} {courses.length === 1 ? 'curso' : 'cursos'}</span>
        </div>

        {courses.length > 0 ? (
          <div className="ui-course-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} navigateTo={navigateTo} isEnrolled={enrolledCourseIds.includes(course.id)} />
            ))}
          </div>
        ) : (
          <div className="ui-empty">
            <h2>Nenhum curso encontrado</h2>
            <p>Tente outro termo de busca ou ajuste os filtros.</p>
            <button type="button" className="ui-btn ui-btn-secondary" onClick={clearFilters}>Limpar filtros</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomePage;
