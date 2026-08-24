import CourseCard from '../components/CourseCard.jsx';

const HomePage = ({ navigateTo, courses, filters, setFilters }) => {
  const handleFilterChange = (event) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Aprendizado que acompanha o seu ritmo</span>
          <h1>Construa habilidades para o seu próximo passo.</h1>
          <p>Cursos práticos para você aprender, evoluir e transformar sua carreira.</p>
        </div>
      </section>

      <div className="container">
        <section className="catalog-header">
          <div>
            <span className="section-eyebrow">Catálogo</span>
            <h2>Explore nossos cursos</h2>
            <p>Escolha a trilha que faz sentido para você.</p>
          </div>
          <div className="course-count">{courses.length} {courses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}</div>
        </section>

        <section className="filter-panel" aria-label="Filtrar cursos">
          <div className="filter-panel-title">
            <span aria-hidden="true">⌘</span>
            <strong>Refinar resultados</strong>
          </div>
          <div className="filters-row">
            <select name="level" value={filters.level} onChange={handleFilterChange} aria-label="Nível do curso">
              <option value="all">Nível (Todos)</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
            <select name="price" value={filters.price} onChange={handleFilterChange} aria-label="Preço do curso">
              <option value="all">Preço (Todos)</option>
              <option value="gratuito">Gratuitos</option>
              <option value="ate50">Até R$ 50</option>
              <option value="50a100">R$ 50 - R$ 100</option>
              <option value="acima100">Acima de R$ 100</option>
            </select>
            <select name="rating" value={filters.rating} onChange={handleFilterChange} aria-label="Avaliação do curso">
              <option value="all">Avaliação (Todas)</option>
              <option value="4.5">4.5 estrelas ou mais</option>
              <option value="4">4 estrelas ou mais</option>
              <option value="3">3 estrelas ou mais</option>
            </select>
          </div>
        </section>

        <div className="course-grid">
          {courses.length > 0 ? (
            courses.map((course) => <CourseCard key={course.id} course={course} navigateTo={navigateTo} />)
          ) : (
            <p>Nenhum curso encontrado com esses critérios.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;
