import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Award, CheckCircle2, Eye, EyeOff, Lock, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { downloadCertificatePdf } from '../utils/certificatePdf.js';
import { formatTicketDate, ticketLimits, ticketStatusLabels } from '../utils/ticketUtils.js';

const certificateMinProgress = 60;

const getProgress = (course) => course.progress || { completedLessons: 0, totalLessons: 0, percent: 0, certificateAvailable: false };

const initials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'A';

const Feedback = ({ feedback }) => (feedback
  ? <p className={`sp-feedback ${feedback.type}`} role="status">{feedback.text}</p>
  : null);

const ProgressBar = ({ percent }) => (
  <div className={`sp-bar ${percent >= 100 ? 'done' : ''}`} aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
);

const PasswordInput = ({ id, value, onChange, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="sp-password">
      <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>
        {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
};

const StudentDashboardPage = ({ navigateTo, purchasedCourses, currentUser, onProfileUpdated }) => {
  const [activeTab, setActiveTab] = useState('my-courses');

  // Certificados
  const [issuingCourseId, setIssuingCourseId] = useState(null);
  const [certificateError, setCertificateError] = useState('');

  // Suporte
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCourse, setTicketCourse] = useState('geral');
  const [ticketFeedback, setTicketFeedback] = useState(null); // { type: 'success' | 'error', text }
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [closingTicketId, setClosingTicketId] = useState(null);

  // Configurações
  const [profileName, setProfileName] = useState(currentUser?.full_name || '');
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fullName = currentUser?.full_name || 'Aluno';
  const firstName = fullName.split(' ')[0];

  const inProgressCourses = useMemo(() => purchasedCourses
    .filter((course) => getProgress(course).percent > 0 && getProgress(course).percent < 100)
    .sort((a, b) => String(getProgress(b).lastCompletedAt || '').localeCompare(String(getProgress(a).lastCompletedAt || ''))),
  [purchasedCourses]);
  const continueCourse = inProgressCourses[0];
  const certificatesAvailable = purchasedCourses.filter((course) => getProgress(course).certificateAvailable).length;

  const heroLine = (() => {
    if (purchasedCourses.length === 0) return 'Escolha seu primeiro curso e comece a estudar.';
    const parts = [`${purchasedCourses.length} ${purchasedCourses.length === 1 ? 'curso' : 'cursos'}`];
    if (inProgressCourses.length > 0) parts.push(`${inProgressCourses.length} em andamento`);
    if (certificatesAvailable > 0) parts.push(`${certificatesAvailable} ${certificatesAvailable === 1 ? 'certificado disponível' : 'certificados disponíveis'}`);
    return parts.join(' · ');
  })();

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

  // Carrega na abertura (para o contador da aba) e de novo sempre que a aba
  // de suporte é aberta, trazendo respostas novas da equipe.
  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => {
    if (activeTab === 'support') loadTickets();
  }, [activeTab, loadTickets]);

  const openTicketCount = tickets.filter((ticket) => ticket.status === 'open').length;

  const handleIssueCertificate = async (course) => {
    setCertificateError('');
    setIssuingCourseId(course.id);
    try {
      const certificate = await api.getCertificate(course.id);
      await downloadCertificatePdf(certificate);
    } catch (error) {
      setCertificateError(error.message || 'Não foi possível gerar o certificado.');
    } finally {
      setIssuingCourseId(null);
    }
  };

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
      setTicketFeedback({ type: 'success', text: 'Chamado enviado. A resposta da equipe aparecerá ao lado.' });
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

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const name = profileName.trim().replace(/\s+/g, ' ');
    if (name.length < 3) {
      setProfileFeedback({ type: 'error', text: 'Informe seu nome completo (mínimo de 3 caracteres).' });
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      const profile = await api.updateProfile(name);
      onProfileUpdated(profile);
      setProfileName(profile.full_name);
      setProfileFeedback({ type: 'success', text: 'Nome atualizado. Ele já aparece nos seus próximos certificados.' });
    } catch (error) {
      setProfileFeedback({ type: 'error', text: error.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwords.current) {
      setPasswordFeedback({ type: 'error', text: 'Informe a senha atual.' });
      return;
    }
    if (passwords.next.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordFeedback({ type: 'error', text: 'A confirmação não corresponde à nova senha.' });
      return;
    }

    setIsSavingPassword(true);
    setPasswordFeedback(null);
    try {
      await api.changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordFeedback({ type: 'success', text: 'Senha atualizada com sucesso.' });
    } catch (error) {
      setPasswordFeedback({ type: 'error', text: error.message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const renderEmpty = () => (
    <div className="sp-empty">
      <h3>Você ainda não tem cursos</h3>
      <p>Explore o catálogo e escolha o primeiro. Ele aparecerá aqui para você acompanhar.</p>
      <button type="button" className="sp-button primary" onClick={() => navigateTo('home')}>Explorar cursos</button>
    </div>
  );

  const renderMyCourses = () => {
    if (purchasedCourses.length === 0) return renderEmpty();

    return (
      <>
        {continueCourse && (
          <section className="sp-continue">
            <img src={continueCourse.imageUrl} alt="" />
            <div className="sp-continue-body">
              <small>Continue de onde parou</small>
              <h2>{continueCourse.title}</h2>
              <ProgressBar percent={getProgress(continueCourse).percent} />
              <span>{getProgress(continueCourse).completedLessons} de {getProgress(continueCourse).totalLessons} aulas · {getProgress(continueCourse).percent}%</span>
            </div>
            <button type="button" className="sp-button primary" onClick={() => navigateTo('player', continueCourse.id)}>Continuar</button>
          </section>
        )}

        <div className="sp-grid">
          {purchasedCourses.map((course) => {
            const progress = getProgress(course);
            const isDone = progress.percent >= 100;
            const action = isDone ? 'Revisar' : progress.percent > 0 ? 'Continuar' : 'Começar';
            return (
              <article key={course.id} className="sp-card">
                <button type="button" className="sp-card-image" onClick={() => navigateTo('player', course.id)} aria-label={`${action} ${course.title}`}>
                  <img src={course.imageUrl} alt="" />
                </button>
                <div className="sp-card-body">
                  <h3>{course.title}</h3>
                  <ProgressBar percent={progress.percent} />
                  <div className="sp-card-footer">
                    {isDone
                      ? <span className="sp-done"><CheckCircle2 size={14} aria-hidden="true" /> Concluído</span>
                      : <span>{progress.percent}% concluído</span>}
                    <button type="button" onClick={() => navigateTo('player', course.id)}>{action} <ArrowRight size={14} aria-hidden="true" /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </>
    );
  };

  const renderCertificates = () => {
    if (purchasedCourses.length === 0) return renderEmpty();

    return (
      <>
        <p className="sp-intro">Liberados ao concluir {certificateMinProgress}% das aulas. O PDF traz seu nome, a carga horária e a data de conclusão.</p>
        {certificateError && <p className="sp-feedback error" role="alert">{certificateError}</p>}
        <ul className="sp-list">
          {purchasedCourses.map((course) => {
            const progress = getProgress(course);
            const available = progress.certificateAvailable;
            const lessonsNeeded = Math.max(0, Math.ceil((progress.totalLessons * certificateMinProgress) / 100) - progress.completedLessons);
            return (
              <li key={course.id} className={available ? 'available' : ''}>
                <span className="sp-list-icon" aria-hidden="true">{available ? <Award size={18} /> : <Lock size={16} />}</span>
                <div>
                  <strong>{course.title}</strong>
                  <small>
                    {available
                      ? `Disponível · ${progress.percent}% concluído`
                      : progress.totalLessons === 0
                        ? 'O curso ainda não tem aulas publicadas'
                        : `${progress.percent}% concluído · ${lessonsNeeded === 1 ? 'falta 1 aula' : `faltam ${lessonsNeeded} aulas`}`}
                  </small>
                </div>
                {available
                  ? <button type="button" className="sp-button primary small" onClick={() => handleIssueCertificate(course)} disabled={issuingCourseId === course.id}>{issuingCourseId === course.id ? 'Gerando...' : 'Baixar PDF'}</button>
                  : <button type="button" className="sp-text-button" onClick={() => navigateTo('player', course.id)}>Estudar</button>}
              </li>
            );
          })}
        </ul>
      </>
    );
  };

  const renderTicketList = () => {
    if (ticketsError && tickets.length === 0) return <p className="sp-feedback error">{ticketsError}</p>;
    if (isLoadingTickets && tickets.length === 0) return <p className="sp-muted">Carregando chamados...</p>;
    if (tickets.length === 0) return <p className="sp-muted">Você ainda não abriu nenhum chamado.</p>;

    return (
      <>
        {ticketsError && <p className="sp-feedback error">{ticketsError}</p>}
        {tickets.map((ticket) => (
          <article key={ticket.id} className="sp-ticket">
            <div className="sp-ticket-top">
              <div>
                <strong>{ticket.subject}</strong>
                <small>{ticket.courseTitle} · {formatTicketDate(ticket.createdAt)}</small>
              </div>
              <span className={`ticket-status ${ticket.status}`}>{ticketStatusLabels[ticket.status] || ticketStatusLabels.open}</span>
            </div>
            <p className="sp-ticket-message">{ticket.message}</p>
            {ticket.adminResponse && (
              <div className="sp-ticket-answer">
                <b>Resposta da equipe</b>{ticket.respondedAt && <small> · {formatTicketDate(ticket.respondedAt)}</small>}
                <p>{ticket.adminResponse}</p>
              </div>
            )}
            {ticket.status !== 'closed' && (
              <button type="button" className="sp-text-button" onClick={() => handleCloseTicket(ticket)} disabled={closingTicketId === ticket.id}>
                {closingTicketId === ticket.id ? 'Encerrando...' : 'Marcar como resolvido'}
              </button>
            )}
          </article>
        ))}
      </>
    );
  };

  const renderSupport = () => (
    <div className="sp-columns">
      <form className="sp-panel" onSubmit={handleSupportSubmit} noValidate>
        <h3>Novo chamado</h3>
        <label htmlFor="support-course">Tópico</label>
        <select id="support-course" value={ticketCourse} onChange={(event) => setTicketCourse(event.target.value)}>
          <option value="geral">Geral / Plataforma</option>
          {purchasedCourses.map((course) => <option key={course.id} value={course.id}>Curso: {course.title}</option>)}
        </select>
        <label htmlFor="support-subject">Assunto</label>
        <input id="support-subject" value={ticketSubject} maxLength={ticketLimits.subject.max} placeholder="Ex.: O vídeo da aula 2 não carrega" onChange={(event) => setTicketSubject(event.target.value)} />
        <label htmlFor="support-message">Mensagem</label>
        <textarea id="support-message" rows="5" value={ticketMessage} maxLength={ticketLimits.message.max} placeholder="Em qual tela aconteceu e o que você esperava?" onChange={(event) => setTicketMessage(event.target.value)} />
        <small className="sp-count">{ticketMessage.length}/{ticketLimits.message.max}</small>
        <Feedback feedback={ticketFeedback} />
        <button type="submit" className="sp-button primary full" disabled={isSubmittingTicket}>{isSubmittingTicket ? 'Enviando...' : 'Enviar chamado'}</button>
      </form>
      <section className="sp-panel">
        <div className="sp-panel-title">
          <h3>Meus chamados</h3>
          <button type="button" className="sp-icon-button" onClick={loadTickets} disabled={isLoadingTickets} title="Atualizar chamados" aria-label="Atualizar chamados">
            <RefreshCw size={15} aria-hidden="true" className={isLoadingTickets ? 'spinning' : ''} />
          </button>
        </div>
        {renderTicketList()}
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="sp-columns">
      <form className="sp-panel" onSubmit={handleProfileSubmit}>
        <h3>Perfil</h3>
        <label htmlFor="profile-name">Nome completo</label>
        <input id="profile-name" value={profileName} maxLength={100} autoComplete="name" onChange={(event) => setProfileName(event.target.value)} />
        <small className="sp-hint">É o nome que aparece nos seus certificados.</small>
        <label htmlFor="profile-email">E-mail</label>
        <input id="profile-email" value={currentUser?.email || ''} disabled />
        <Feedback feedback={profileFeedback} />
        <button type="submit" className="sp-button primary full" disabled={isSavingProfile || profileName.trim() === fullName}>
          {isSavingProfile ? 'Salvando...' : 'Salvar nome'}
        </button>
      </form>
      <form className="sp-panel" onSubmit={handlePasswordSubmit}>
        <h3>Senha</h3>
        <label htmlFor="current-password">Senha atual</label>
        <PasswordInput id="current-password" value={passwords.current} autoComplete="current-password" onChange={(value) => setPasswords((previous) => ({ ...previous, current: value }))} />
        <label htmlFor="new-password">Nova senha</label>
        <PasswordInput id="new-password" value={passwords.next} autoComplete="new-password" onChange={(value) => setPasswords((previous) => ({ ...previous, next: value }))} />
        <label htmlFor="confirm-password">Confirmar nova senha</label>
        <PasswordInput id="confirm-password" value={passwords.confirm} autoComplete="new-password" onChange={(value) => setPasswords((previous) => ({ ...previous, confirm: value }))} />
        <small className="sp-hint">Mínimo de 6 caracteres.</small>
        <Feedback feedback={passwordFeedback} />
        <button type="submit" className="sp-button primary full" disabled={isSavingPassword}>{isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}</button>
      </form>
    </div>
  );

  const tabs = [
    { id: 'my-courses', label: 'Meus cursos', render: renderMyCourses },
    { id: 'certificates', label: 'Certificados', render: renderCertificates },
    { id: 'support', label: 'Suporte', badge: openTicketCount, render: renderSupport },
    { id: 'settings', label: 'Configurações', render: renderSettings },
  ];
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <section className="sp-page">
      <div className="container sp-container">
        <div className="sp-hero">
          <span className="sp-avatar" aria-hidden="true">{initials(fullName)}</span>
          <div>
            <h1>Olá, {firstName}</h1>
            <p>{heroLine}</p>
          </div>
        </div>

        <nav className="sp-tabs" aria-label="Seções do painel do aluno">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}>
              {tab.label}
              {tab.badge > 0 && <em>{tab.badge}</em>}
            </button>
          ))}
        </nav>

        <div className="sp-content">{currentTab.render()}</div>
      </div>
    </section>
  );
};

export default StudentDashboardPage;
