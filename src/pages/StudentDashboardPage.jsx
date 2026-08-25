import { Award, BookOpen, CircleCheck, Headphones, Play, Settings, TicketPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import studentDashboardBackground from '../assets/student-dashboard-background.png';
import { api } from '../services/api.js';
import { calculateProgress } from '../utils/courseUtils.js';

const StudentSectionHeader = ({ title, description }) => (
  <header className="student-section-header">
    <span>ÁREA DO ALUNO</span>
    <h2>{title}</h2>
    <p>{description}</p>
  </header>
);

const ticketStatusLabel = (status) => ({
  answered: 'Respondido',
  closed: 'Encerrado',
}[status] || 'Aguardando resposta');

const StudentDashboardPage = ({ navigateTo, purchasedCourses, courseProgress, coursesContentDB }) => {
  const [activeTab, setActiveTab] = useState('my-courses');
  const [tickets, setTickets] = useState([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCourse, setTicketCourse] = useState('geral');
  const [ticketFeedback, setTicketFeedback] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    let isActive = true;
    api.getMySupportTickets()
      .then((loadedTickets) => { if (isActive) setTickets(loadedTickets); })
      .catch(() => { if (isActive) setTicketFeedback('Não foi possível carregar seus chamados.'); });
    return () => { isActive = false; };
  }, []);

  const handleSupportSubmit = async (event) => {
    event.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setTicketFeedback('');
    setIsSubmittingTicket(true);
    try {
      const ticket = await api.createSupportTicket({
        courseId: ticketCourse === 'geral' ? null : Number(ticketCourse),
        subject: ticketSubject,
        message: ticketMessage,
      });
      setTickets((previous) => [ticket, ...previous]);
      setTicketCourse('geral');
      setTicketSubject('');
      setTicketMessage('');
      setTicketFeedback('Chamado enviado. A equipe responderá por aqui.');
    } catch (error) {
      setTicketFeedback(error.message);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleDownloadCertificate = () => {
    alert('Baixando certificado... (simulado)');
  };

  const renderMyCourses = () => (
    <section className="student-section">
      <StudentSectionHeader title="Meus cursos" description="Acesse seus conteúdos e acompanhe a evolução dos estudos." />
      {purchasedCourses.length === 0 ? (
        <div className="student-empty-state">
          <BookOpen size={26} aria-hidden="true" />
          <div><h3>Você ainda não possui cursos</h3><p>Quando se matricular em um curso, ele aparecerá aqui para você continuar de onde parou.</p></div>
          <button type="button" className="student-primary-action" onClick={() => navigateTo('home')}>Explorar cursos</button>
        </div>
      ) : (
        <div className="student-course-grid">
          {purchasedCourses.map((course) => {
            const progress = calculateProgress(course.id, courseProgress, coursesContentDB[course.id]);
            return (
              <article key={course.id} className="student-course-card" onClick={() => navigateTo('player', course.id)}>
                <img src={course.imageUrl} alt={course.title} />
                <div><span>{course.level}</span><h3>{course.title}</h3><p>{course.instructor}</p></div>
                <div className="student-course-progress"><div><i style={{ width: `${progress}%` }} /></div><small>{progress}% concluído</small></div>
                <button type="button">Continuar <Play size={14} fill="currentColor" aria-hidden="true" /></button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderCertificates = () => (
    <section className="student-section">
      <StudentSectionHeader title="Certificados" description="Os certificados ficam disponíveis ao atingir 60% de conclusão." />
      {purchasedCourses.length === 0 ? (
        <div className="student-empty-state compact"><Award size={26} aria-hidden="true" /><div><h3>Nenhum certificado disponível</h3><p>Conclua seus cursos para liberar seus certificados.</p></div></div>
      ) : (
        <div className="student-list-panel">
          {purchasedCourses.map((course) => {
            const progress = calculateProgress(course.id, courseProgress, coursesContentDB[course.id]);
            const isEligible = progress >= 60;
            return <article key={course.id} className="student-list-row"><div><strong>{course.title}</strong><small>{isEligible ? 'Certificado disponível' : `${progress}% concluído — faltam etapas para liberar`}</small></div><button type="button" className={isEligible ? 'student-secondary-action' : 'student-secondary-action disabled'} disabled={!isEligible} onClick={handleDownloadCertificate}>Baixar PDF</button></article>;
          })}
        </div>
      )}
    </section>
  );

  const renderSupport = () => (
    <section className="student-section">
      <StudentSectionHeader title="Suporte" description="Envie uma dúvida para a equipe da plataforma." />
      <div className="student-support-grid">
        <form className="student-form-panel" onSubmit={handleSupportSubmit}>
          <div className="student-panel-heading"><TicketPlus size={18} aria-hidden="true" /><div><h3>Novo chamado</h3><p>Descreva o que aconteceu para podermos ajudar.</p></div></div>
          <label htmlFor="support-course">Tópico</label>
          <select id="support-course" value={ticketCourse} onChange={(event) => setTicketCourse(event.target.value)}><option value="geral">Geral / Plataforma</option>{purchasedCourses.map((course) => <option key={course.id} value={course.id}>Curso: {course.title}</option>)}</select>
          <label htmlFor="support-subject">Assunto</label>
          <input id="support-subject" value={ticketSubject} onChange={(event) => setTicketSubject(event.target.value)} required />
          <label htmlFor="support-message">Mensagem</label>
          <textarea id="support-message" rows="5" value={ticketMessage} onChange={(event) => setTicketMessage(event.target.value)} required />
          {ticketFeedback && <p className="student-feedback">{ticketFeedback}</p>}
          <button type="submit" className="student-primary-action" disabled={isSubmittingTicket}>{isSubmittingTicket ? 'Enviando...' : 'Enviar chamado'}</button>
        </form>
        <section className="student-list-panel student-tickets">
          <div className="student-panel-heading"><Headphones size={18} aria-hidden="true" /><div><h3>Meus chamados</h3><p>Acompanhe as solicitações enviadas.</p></div></div>
          {tickets.length === 0 ? <p className="student-muted">Nenhum chamado aberto.</p> : tickets.map((ticket) => <article key={ticket.id} className="student-ticket"><div><strong>{ticket.subject}</strong><small>{ticket.courseTitle} · {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</small>{ticket.adminResponse && <p className="student-ticket-answer"><b>Resposta:</b> {ticket.adminResponse}</p>}</div><span>{ticketStatusLabel(ticket.status)}</span></article>)}
        </section>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="student-section">
      <StudentSectionHeader title="Configurações" description="Preferências gerais da sua área de estudos." />
      <div className="student-settings-grid"><article><Settings size={20} aria-hidden="true" /><div><h3>Preferências de estudo</h3><p>As preferências personalizadas estarão disponíveis em breve.</p></div></article><article><CircleCheck size={20} aria-hidden="true" /><div><h3>Conta protegida</h3><p>Seu acesso está configurado com e-mail e senha.</p></div></article></div>
    </section>
  );

  const contentByTab = {
    'my-courses': renderMyCourses,
    certificates: renderCertificates,
    support: renderSupport,
    settings: renderSettings,
  };

  return (
    <section className="student-page" style={{ backgroundImage: `url(${studentDashboardBackground})` }}>
      <div className="container student-shell">
        <div className="student-dashboard">
          <aside className="student-sidebar">
            <div className="student-sidebar-brand"><small>CURSOLAB</small><h3>Painel do aluno</h3></div>
            <nav className="student-sidebar-menu" aria-label="Navegação do aluno">
              <button type="button" className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}><BookOpen size={17} aria-hidden="true" />Meus cursos</button>
              <button type="button" className={activeTab === 'certificates' ? 'active' : ''} onClick={() => setActiveTab('certificates')}><Award size={17} aria-hidden="true" />Certificados</button>
              <button type="button" className={activeTab === 'support' ? 'active' : ''} onClick={() => setActiveTab('support')}><Headphones size={17} aria-hidden="true" />Suporte</button>
              <button type="button" className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings size={17} aria-hidden="true" />Configurações</button>
            </nav>
          </aside>
          <main className="student-dashboard-content">{contentByTab[activeTab]()}</main>
        </div>
      </div>
    </section>
  );
};

export default StudentDashboardPage;
