import { Award, BookOpen, CircleCheck, Headphones, Play, RefreshCw, Settings, TicketPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import studentDashboardBackground from '../assets/student-dashboard-background.png';
import { api } from '../services/api.js';
import { calculateProgress } from '../utils/courseUtils.js';
import { formatTicketDate, ticketLimits, ticketStatusLabels } from '../utils/ticketUtils.js';

const StudentSectionHeader = ({ title, description }) => (
  <header className="student-section-header">
    <span>ÁREA DO ALUNO</span>
    <h2>{title}</h2>
    <p>{description}</p>
  </header>
);

const StudentDashboardPage = ({ navigateTo, purchasedCourses, courseProgress, coursesContentDB }) => {
  const [activeTab, setActiveTab] = useState('my-courses');
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCourse, setTicketCourse] = useState('geral');
  const [ticketFeedback, setTicketFeedback] = useState(null); // { type: 'success' | 'error', text }
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [closingTicketId, setClosingTicketId] = useState(null);

  const loadTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    setTicketsError('');
    try {
      setTickets(await api.getMySupportTickets());
    } catch {
      setTicketsError('Não foi possível carregar seus chamados.');
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  // Recarrega sempre que a aba é aberta, para trazer respostas novas da equipe.
  useEffect(() => {
    if (activeTab === 'support') loadTickets();
  }, [activeTab, loadTickets]);

  const handleSupportSubmit = async (event) => {
    event.preventDefault();
    const subject = ticketSubject.trim();
    const message = ticketMessage.trim();

    if (subject.length < ticketLimits.subject.min) {
      setTicketFeedback({ type: 'error', text: `O assunto deve ter pelo menos ${ticketLimits.subject.min} caracteres.` });
      return;
    }
    if (message.length < ticketLimits.message.min) {
      setTicketFeedback({ type: 'error', text: `Descreva o problema com pelo menos ${ticketLimits.message.min} caracteres.` });
      return;
    }

    setTicketFeedback(null);
    setIsSubmittingTicket(true);
    try {
      const ticket = await api.createSupportTicket({
        courseId: ticketCourse === 'geral' ? null : Number(ticketCourse),
        subject,
        message,
      });
      setTickets((previous) => [ticket, ...previous]);
      setTicketCourse('geral');
      setTicketSubject('');
      setTicketMessage('');
      setTicketFeedback({ type: 'success', text: 'Chamado enviado. A resposta da equipe aparecerá em "Meus chamados".' });
    } catch (error) {
      setTicketFeedback({ type: 'error', text: error.message });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleCloseTicket = async (ticket) => {
    if (!window.confirm(`Marcar o chamado "${ticket.subject}" como resolvido?`)) return;

    setClosingTicketId(ticket.id);
    try {
      const updated = await api.closeMySupportTicket(ticket.id);
      setTickets((previous) => previous.map((item) => (item.id === ticket.id ? updated : item)));
    } catch (error) {
      setTicketsError(error.message);
    } finally {
      setClosingTicketId(null);
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

  const openTicketCount = tickets.filter((ticket) => ticket.status === 'open').length;

  const renderTicketList = () => {
    if (ticketsError && tickets.length === 0) return <p className="student-feedback error">{ticketsError}</p>;
    if (isLoadingTickets && tickets.length === 0) return <p className="student-muted">Carregando chamados...</p>;
    if (tickets.length === 0) return <p className="student-muted">Você ainda não abriu nenhum chamado.</p>;

    return <>{ticketsError && <p className="student-feedback error">{ticketsError}</p>}{tickets.map((ticket) => (
      <article key={ticket.id} className="student-ticket">
        <div className="student-ticket-top">
          <div>
            <strong>{ticket.subject}</strong>
            <small>{ticket.courseTitle} · aberto em {formatTicketDate(ticket.createdAt)}</small>
          </div>
          <span className={`ticket-status ${ticket.status}`}>{ticketStatusLabels[ticket.status] || ticketStatusLabels.open}</span>
        </div>
        <p className="student-ticket-message">{ticket.message}</p>
        {ticket.adminResponse && (
          <div className="student-ticket-answer">
            <b>Resposta da equipe</b>
            {ticket.respondedAt && <small>{formatTicketDate(ticket.respondedAt)}</small>}
            <p>{ticket.adminResponse}</p>
          </div>
        )}
        {ticket.status !== 'closed' && (
          <button type="button" className="student-link-button" onClick={() => handleCloseTicket(ticket)} disabled={closingTicketId === ticket.id}>
            {closingTicketId === ticket.id ? 'Encerrando...' : 'Marcar como resolvido'}
          </button>
        )}
      </article>
    ))}</>;
  };

  const renderSupport = () => (
    <section className="student-section">
      <StudentSectionHeader title="Suporte" description="Envie uma dúvida para a equipe da plataforma e acompanhe as respostas." />
      <div className="student-support-grid">
        <form className="student-form-panel" onSubmit={handleSupportSubmit} noValidate>
          <div className="student-panel-heading"><TicketPlus size={18} aria-hidden="true" /><div><h3>Novo chamado</h3><p>Descreva o que aconteceu para podermos ajudar.</p></div></div>
          <label htmlFor="support-course">Tópico</label>
          <select id="support-course" value={ticketCourse} onChange={(event) => setTicketCourse(event.target.value)}><option value="geral">Geral / Plataforma</option>{purchasedCourses.map((course) => <option key={course.id} value={course.id}>Curso: {course.title}</option>)}</select>
          <label htmlFor="support-subject">Assunto</label>
          <input id="support-subject" value={ticketSubject} maxLength={ticketLimits.subject.max} placeholder="Ex.: O vídeo da aula 2 não carrega" onChange={(event) => setTicketSubject(event.target.value)} />
          <small className="student-char-count">{ticketSubject.length}/{ticketLimits.subject.max}</small>
          <label htmlFor="support-message">Mensagem</label>
          <textarea id="support-message" rows="5" value={ticketMessage} maxLength={ticketLimits.message.max} placeholder="Conte o que aconteceu, em qual tela e o que você esperava." onChange={(event) => setTicketMessage(event.target.value)} />
          <small className="student-char-count">{ticketMessage.length}/{ticketLimits.message.max}</small>
          {ticketFeedback && <p className={`student-feedback ${ticketFeedback.type}`} role="status">{ticketFeedback.text}</p>}
          <button type="submit" className="student-primary-action" disabled={isSubmittingTicket}>{isSubmittingTicket ? 'Enviando...' : 'Enviar chamado'}</button>
        </form>
        <section className="student-list-panel student-tickets">
          <div className="student-panel-heading student-tickets-heading">
            <Headphones size={18} aria-hidden="true" />
            <div><h3>Meus chamados</h3><p>{openTicketCount > 0 ? `${openTicketCount} aguardando resposta` : 'Acompanhe as solicitações enviadas.'}</p></div>
            <button type="button" className="student-icon-button" onClick={loadTickets} disabled={isLoadingTickets} title="Atualizar chamados" aria-label="Atualizar chamados">
              <RefreshCw size={15} aria-hidden="true" className={isLoadingTickets ? 'spinning' : ''} />
            </button>
          </div>
          {renderTicketList()}
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
