import CourseCard from '../components/CourseCard.jsx';
import coursesBackground from '../assets/courses-background.png';

const HomePage = ({ navigateTo, courses, filters, setFilters }) => {
  const handleFilterChange = (event) => {
    setFilters((previousFilters) => ({ ...previousFilters, [event.target.name]: event.target.value }));
  };

  return (
    <>
      <section className="catalog-background" style={{ backgroundImage: `url(${coursesBackground})` }}>
        <section className="container catalog-section" id="catalogo">
          <header className="catalog-lead"><div><p className="catalog-label">CATÁLOGO</p><h2>Encontre uma trilha que faz sentido para você.</h2></div><p>Selecione o nível, o preço ou a avaliação para começar.</p></header>
          <section className="catalog-controls" aria-label="Filtrar cursos">
            <span>Filtrar por</span>
            <div className="filters-row">
              <select name="level" value={filters.level} onChange={handleFilterChange} aria-label="Nível do curso"><option value="all">Todos os níveis</option><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option></select>
              <select name="price" value={filters.price} onChange={handleFilterChange} aria-label="Preço do curso"><option value="all">Todos os preços</option><option value="gratuito">Gratuitos</option><option value="ate50">Até R$ 50</option><option value="50a100">R$ 50 - R$ 100</option><option value="acima100">Acima de R$ 100</option></select>
              <select name="rating" value={filters.rating} onChange={handleFilterChange} aria-label="Avaliação do curso"><option value="all">Todas as avaliações</option><option value="4.5">4,5 estrelas ou mais</option><option value="4">4 estrelas ou mais</option><option value="3">3 estrelas ou mais</option></select>
            </div>
            <strong>{courses.length} encontrados</strong>
          </section>
          <div className="course-grid landing-course-grid">{courses.length > 0 ? courses.map((course) => <CourseCard key={course.id} course={course} navigateTo={navigateTo} />) : <div className="catalog-empty"><strong>Nenhum curso encontrado.</strong><span>Tente ajustar os filtros para ver outras opções.</span></div>}</div>
        </section>
      </section>
    </>
  );
};

export default HomePage;
