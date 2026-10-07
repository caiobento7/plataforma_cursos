import { Star } from 'lucide-react';
import { formatPrice, formatRating } from '../utils/courseUtils.js';

const CourseCard = ({ course, navigateTo, isEnrolled = false }) => {
  if (!course) return null;
  const openDetails = () => navigateTo('details', course.id);

  return (
    <article className="ui-course">
      <button type="button" className="ui-course-media" onClick={openDetails} aria-label={`Ver detalhes de ${course.title}`}>
        <img src={course.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = 'https://placehold.co/600x450/102a43/ffffff?text=CursoLab'; }} />
      </button>
      <div className="ui-course-body">
        <div className="ui-course-meta">
          <span>{course.level}</span>
          <span className="ui-course-rating"><Star size={14} fill="currentColor" aria-hidden="true" /> {formatRating(course.rating)}</span>
        </div>
        <h3>{course.title}</h3>
        <div className="ui-course-footer">
          {isEnrolled
            ? <span className="ui-price free">Matriculado</span>
            : <span className={`ui-price ${course.price === 0 ? 'free' : ''}`}>{formatPrice(course.price)}</span>}
          <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={isEnrolled ? () => navigateTo('player', course.id) : openDetails}>
            {isEnrolled ? 'Acessar' : 'Ver curso'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
