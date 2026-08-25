import { ArrowRight, BookOpen, CircleCheck } from 'lucide-react';

const EnrollmentSuccessPage = ({ courses, navigateTo }) => (
  <section className="enrollment-success-page">
    <div className="container">
      <article className="enrollment-success-card">
        <span className="enrollment-success-icon">
          <CircleCheck size={30} aria-hidden="true" />
        </span>
        <span className="enrollment-success-eyebrow">MATRÍCULA CONFIRMADA</span>
        <h1>Seu curso já está disponível.</h1>
        <p>
          Que bom ter você no CursoLab. Acesse seus cursos e comece seus estudos agora.
        </p>

        {courses.length > 0 && (
          <div className="enrollment-success-courses">
            <BookOpen size={18} aria-hidden="true" />
            <div>
              <strong>{courses.length === 1 ? courses[0].title : `${courses.length} cursos adicionados à sua conta`}</strong>
              <small>Disponível no Painel do aluno</small>
            </div>
          </div>
        )}

        <button type="button" className="enrollment-success-action" onClick={() => navigateTo('studentDashboard')}>
          Ir para meus cursos <ArrowRight size={17} aria-hidden="true" />
        </button>
      </article>
    </div>
  </section>
);

export default EnrollmentSuccessPage;
