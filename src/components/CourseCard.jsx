const CourseCard = ({ course, navigateTo }) => {
  if (!course) return null;

  const price = course.price === 0
    ? 'Gratuito'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(course.price);

  return (
    <article className="course-card">
      <div className="course-image-wrap">
        <img
          src={course.imageUrl}
          alt=""
          className="course-image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = 'https://placehold.co/600x400/1e293b/ffffff?text=Curso';
          }}
        />
        <span className="course-level">{course.level}</span>
      </div>
      <div className="course-info">
        <div className="course-category">Curso online</div>
        <h3 className="course-title">{course.title}</h3>
        <div className="course-instructor">{course.instructor}</div>

        <div className="course-meta-tags" aria-label={`Avaliação ${course.rating} de 5`}>
          <span className="course-rating">★ <strong>{course.rating}</strong></span>
          <span className="course-rating-count">Avaliação dos alunos</span>
        </div>

        <div className="course-card-footer">
          <div className="course-price">{price}</div>
          <button className="btn course-details-button" type="button" onClick={() => navigateTo('details', course.id)}>
            Ver curso <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
