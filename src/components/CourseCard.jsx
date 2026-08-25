import { Star } from 'lucide-react';

const CourseCard = ({ course, navigateTo }) => {
  if (!course) return null;
  const price = course.price === 0 ? 'Gratuito' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(course.price);

  return (
    <article className="course-card">
      <img src={course.imageUrl} alt="" className="course-image" loading="lazy" onError={(event) => { event.currentTarget.src = 'https://placehold.co/600x400/102a43/ffffff?text=Curso'; }} />
      <div className="course-info">
        <div className="course-course-type">CURSO ONLINE</div>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-instructor">Por {course.instructor}</p>
        <div className="course-details-line"><span>{course.level}</span><span className="course-rating"><Star size={14} fill="currentColor" aria-hidden="true" /> {course.rating}</span></div>
        <div className="course-card-footer"><strong className="course-price">{price}</strong><button className="course-details-button" type="button" onClick={() => navigateTo('details', course.id)}>Conhecer curso</button></div>
      </div>
    </article>
  );
};

export default CourseCard;
