import { ArrowLeft, Award, CalendarClock, CheckCircle2, ChevronDown, Clock, ListChecks, MonitorSmartphone, PlayCircle, Star } from 'lucide-react';
import { formatDate, formatPrice, formatRating, getAccessInfo } from '../utils/courseUtils.js';

// Converte as durações livres das aulas ("15 min", "1h 30min") em minutos.
const durationMinutes = (duration) => {
  const text = String(duration || '').toLowerCase();
  const hours = Number(text.match(/(\d+)\s*h/)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*m/)?.[1] || 0);
  return hours || minutes ? hours * 60 + minutes : Number(text.match(/\d+/)?.[0] || 0);
};

const formatTotalDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
};

// "Módulo 1: Introdução" -> "Introdução"
const moduleTopic = (title) => title.replace(/^m[óo]dulo\s*\d+\s*[:.-]\s*/i, '');

const CourseDetailsPage = ({ navigateTo, course, content, addToCart, isEnrolled = false, enrollment = null, isInCart = false }) => {
  if (!course) {
    return (
      <section className="ui-page">
        <div className="container">
          <div className="ui-empty">
            <h2>Curso não encontrado</h2>
            <p>Ele pode ter sido removido do catálogo.</p>
            <button type="button" className="ui-btn ui-btn-secondary" onClick={() => navigateTo('home')}>Voltar ao catálogo</button>
          </div>
        </div>
      </section>
    );
  }

  const modules = content || [];
  const lessons = modules.flatMap((module) => module.lessons);
  const quizCount = lessons.filter((lesson) => lesson.type === 'quiz').length;
  const totalMinutes = lessons.reduce((total, lesson) => total + durationMinutes(lesson.duration), 0);
  const isLoadingContent = content === undefined;
  const isExpired = Boolean(enrollment) && getAccessInfo(enrollment.expiresAt).expired;

  const handleBuyNow = () => {
    addToCart(course);
    navigateTo('checkout');
  };

  return (
    <section className="ui-page">
      <div className="container">
        <button type="button" className="ui-back" onClick={() => navigateTo('home')}><ArrowLeft size={16} aria-hidden="true" /> Catálogo</button>

        <div className="ui-detail">
          <div>
            <span className="ui-detail-level">{course.level}</span>
            <h1>{course.title}</h1>
            <p className="ui-detail-lead">
              {lessons.length > 0
                ? `Um curso de nível ${course.level.toLowerCase()} com ${modules.length} ${modules.length === 1 ? 'módulo' : 'módulos'} e ${lessons.length} aulas. Estude no seu ritmo, teste seus conhecimentos nos quizzes e emita o certificado ao concluir.`
                : `Um curso de nível ${course.level.toLowerCase()} da CursoLab. Estude no seu ritmo e emita o certificado ao concluir.`}
            </p>

            <dl className="ui-detail-facts">
              <div><dt>Avaliação</dt><dd><Star size={15} fill="currentColor" aria-hidden="true" /> {formatRating(course.rating)}{course.reviewCount > 0 && <small style={{ color: 'var(--ui-muted)', fontWeight: 500 }}>&nbsp;({course.reviewCount})</small>}</dd></div>
              {course.enrollmentCount > 0 && <div><dt>Alunos</dt><dd>{course.enrollmentCount.toLocaleString('pt-BR')}</dd></div>}
              {lessons.length > 0 && <div><dt>Aulas</dt><dd>{lessons.length}</dd></div>}
              {totalMinutes > 0 && <div><dt>Duração</dt><dd>{formatTotalDuration(totalMinutes)}</dd></div>}
            </dl>

            {modules.length > 0 && (
              <>
                <h2>O que você vai aprender</h2>
                <ul className="ui-learn">
                  {modules.map((module) => (
                    <li key={module.id}><CheckCircle2 size={18} aria-hidden="true" /> {moduleTopic(module.title)}</li>
                  ))}
                </ul>
              </>
            )}

            <h2>Conteúdo do curso</h2>
            {isLoadingContent ? (
              <p className="ui-muted">Carregando conteúdo...</p>
            ) : modules.length === 0 ? (
              <div className="ui-empty"><p>O conteúdo deste curso está sendo preparado.</p></div>
            ) : (
              <div className="ui-syllabus">
                {modules.map((module, index) => (
                  <details key={module.id} open={index === 0}>
                    <summary>
                      <span>{module.title}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <small>{module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}</small>
                        <ChevronDown size={18} aria-hidden="true" />
                      </span>
                    </summary>
                    <ol>
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          {lesson.type === 'quiz' ? <ListChecks size={16} aria-hidden="true" /> : <PlayCircle size={16} aria-hidden="true" />}
                          <span>{lesson.title}</span>
                          <small>{lesson.duration}</small>
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            )}
          </div>

          <aside className="ui-buy">
            <img src={course.imageUrl} alt="" onError={(event) => { event.currentTarget.src = 'https://placehold.co/600x450/102a43/ffffff?text=CursoLab'; }} />
            <div className="ui-buy-body">
              {isEnrolled ? (
                <>
                  <span className="ui-buy-price free">Você já está matriculado</span>
                  {enrollment?.expiresAt && <span className="ui-buy-note">Acesso até {formatDate(enrollment.expiresAt)}</span>}
                  <button type="button" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" onClick={() => navigateTo('player', course.id)}>Ir para o curso</button>
                </>
              ) : (
                <>
                  {isExpired && <p className="ui-alert">Seu acesso expirou em {formatDate(enrollment.expiresAt)}. Renove para continuar de onde parou.</p>}
                  <span className={`ui-buy-price ${course.price === 0 ? 'free' : ''}`}>{formatPrice(course.price)}</span>
                  <button type="button" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" onClick={handleBuyNow}>
                    {isExpired ? 'Renovar acesso' : course.price === 0 ? 'Matricular-se grátis' : 'Comprar agora'}
                  </button>
                  {isInCart ? (
                    <button type="button" className="ui-btn ui-btn-secondary ui-btn-block" onClick={() => navigateTo('cart')}>Ver carrinho</button>
                  ) : (
                    <button type="button" className="ui-btn ui-btn-secondary ui-btn-block" onClick={() => addToCart(course)}>Adicionar ao carrinho</button>
                  )}
                </>
              )}
              <ul>
                {lessons.length > 0 && <li><PlayCircle size={17} aria-hidden="true" /> {lessons.length} aulas{totalMinutes > 0 ? ` · ${formatTotalDuration(totalMinutes)}` : ''}</li>}
                {quizCount > 0 && <li><ListChecks size={17} aria-hidden="true" /> {quizCount} {quizCount === 1 ? 'quiz' : 'quizzes'} com nota mínima</li>}
                <li><CalendarClock size={17} aria-hidden="true" /> Acesso por {course.accessMonths} meses</li>
                <li><Award size={17} aria-hidden="true" /> Certificado de conclusão em PDF</li>
                <li><Clock size={17} aria-hidden="true" /> Estude no seu ritmo</li>
                <li><MonitorSmartphone size={17} aria-hidden="true" /> Acesso pelo computador e celular</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default CourseDetailsPage;
