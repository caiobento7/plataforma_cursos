import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, GraduationCap, Lock, PlayCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { downloadCertificatePdf } from '../utils/certificatePdf.js';
import { formatTicketDate, ticketLimits, ticketStatusLabels } from '../utils/ticketUtils.js';

const certificateMinProgress = 60;

const tabs = [
  { id: 'courses', label: 'Cursos' },
  { id: 'certificates', label: 'Certificados' },
  { id: 'support', label: 'Suporte' },
  { id: 'account', label: 'Conta' },
];

const getProgress = (course) => course.progress || { completedLessons: 0, totalLessons: 0, percent: 0, certificateAvailable: false, nextLesson: null };

const courseAction = (percent) => (percent >= 100 ? 'Revisar' : percent > 0 ? 'Continuar' : 'Começar');

const Feedback = ({ feedback }) => (feedback
  ? <p className={`ui-alert ${feedback.type}`} role="status">{feedback.text}</p>
  : null);

const ProgressBar = ({ percent }) => (
  <div className={`st-bar ${percent >= 100 ? 'done' : ''}`} aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
);

const PasswordInput = ({ id, value, onChange, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="st-password">
      <input className="ui-input" id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>
        {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
};

// Miniatura do certificado, no mesmo desenho do PDF emitido.
const CertificatePaper = ({ courseTitle, studentName, locked }) => (
  <div className={`st-paper ${locked ? 'locked' : ''}`} aria-hidden="true">
    <small>CursoLab</small>
    <b>Certificado de conclusão</b>
    <span className="st-paper-name">{studentName}</span>
    <span className="st-paper-course">{courseTitle}</span>
    <span className="st-paper-sign">Caio Bento</span>
    <span className="st-paper-seal">CL</span>
    {locked && <span className="st-paper-lock"><Lock size={20} /></span>}
  </div>
);

const StudentDashboardPage = ({ navigateTo, purchasedCourses, currentUser, onProfileUpdated }) => {
  const [activeTab, setActiveTab] = useState('courses');

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
  const [ticketFeedback, setTicketFeedback] = useState(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [closingTicketId, setClosingTicketId] = useState(null);

  // Conta
  const [profileName, setProfileName] = useState(currentUser?.full_name || '');
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fullName = currentUser?.full_name || 'Aluno';
  const firstName = fullName.split(' ')[0];

  // Destaque: o curso não concluído com a atividade mais recente (última aula
  // aberta ou concluída). Sem atividade, o curso matriculado mais recentemente
  // que ainda não foi iniciado.
  const { spotlight, inProgressCount } = useMemo(() => {
    const lastActivity = (course) => {
      const { lastAccessedAt, lastCompletedAt } = getProgress(course);
      return [lastAccessedAt, lastCompletedAt].filter(Boolean).sort().pop() || '';
    };
    const active = purchasedCourses
      .filter((course) => getProgress(course).percent < 100 && lastActivity(course))
      .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
    return {
      spotlight: active[0] || purchasedCourses.find((course) => getProgress(course).percent === 0) || null,
      inProgressCount: purchasedCourses.filter((course) => getProgress(course).percent > 0 && getProgress(course).percent < 100).length,
    };
  }, [purchasedCourses]);
  const certificatesAvailable = purchasedCourses.filter((course) => getProgress(course).certificateAvailable).length;

  const subtitle = purchasedCourses.length === 0
    ? 'Escolha seu primeiro curso no catálogo e comece hoje.'
    : inProgressCount > 0
      ? `Você tem ${inProgressCount} ${inProgressCount === 1 ? 'curso em andamento' : 'cursos em andamento'}${certificatesAvailable > 0 ? ` e ${certificatesAvailable} ${certificatesAvailable === 1 ? 'certificado disponível' : 'certificados disponíveis'}` : ''}.`
      : 'Bons estudos! Seus cursos estão logo abaixo.';

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

  // Carrega na abertura (para o contador da aba) e sempre que a aba de suporte
  // é aberta, trazendo respostas novas da equipe.
  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => {
    if (activeTab === 'support') loadTickets();
  }, [activeTab, loadTickets]);

  const openTicketCount = tickets.filter((ticket) => ticket.status === 'open').length;

  const handleIssueCertificate = async (course) => {
    setCertificateError('');
    setIssuingCourseId(course.id);
    try {
      await downloadCertificatePdf(await api.getCertificate(course.id));
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
    <div className="ui-empty">
      <GraduationCap size={34} color="var(--ui-blue)" aria-hidden="true" />
      <h2>Sua jornada começa aqui</h2>
      <p>Você ainda não está matriculado em nenhum curso. Escolha o primeiro no catálogo.</p>
      <button type="button" className="ui-btn ui-btn-primary" onClick={() => navigateTo('home')}>Explorar catálogo</button>
    </div>
  );

  const renderSpotlight = () => {
    if (!spotlight) return null;
    const progress = getProgress(spotlight);
    const started = progress.percent > 0 || Boolean(progress.lastAccessedAt);
    const next = progress.nextLesson;

    return (
      <section className="st-spotlight">
        <button type="button" className="st-spotlight-media" onClick={() => navigateTo('player', spotlight.id)} aria-label={`${courseAction(progress.percent)} ${spotlight.title}`}>
          <img src={spotlight.imageUrl} alt="" />
          <span><PlayCircle size={30} aria-hidden="true" /></span>
        </button>
        <div className="st-spotlight-body">
          <span className="st-eyebrow">{started ? 'Continue de onde parou' : 'Comece seu próximo curso'}</span>
          <h2>{spotlight.title}</h2>
          {next && (
            <p className="st-next">
              <PlayCircle size={17} aria-hidden="true" />
              <span><small>Próxima aula · Módulo {next.moduleNumber}, aula {next.lessonNumber}</small>{next.title}</span>
            </p>
          )}
          <div className="st-spotlight-progress">
            <ProgressBar percent={progress.percent} />
            <span>{progress.completedLessons} de {progress.totalLessons} aulas · <b>{progress.percent}%</b></span>
          </div>
          <button type="button" className="ui-btn ui-btn-primary ui-btn-lg" onClick={() => navigateTo('player', spotlight.id)}>
            {started ? 'Continuar curso' : 'Começar agora'} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    );
  };

  const renderCourses = () => {
    if (purchasedCourses.length === 0) return renderEmpty();

    return (
      <>
        {renderSpotlight()}
        <div className="st-section-title"><h2>Seus cursos</h2><span>{purchasedCourses.length}</span></div>
        <div className="ui-course-grid">
          {purchasedCourses.map((course) => {
            const progress = getProgress(course);
            const isDone = progress.percent >= 100;
            return (
              <article key={course.id} className="ui-course">
                <button type="button" className="ui-course-media" onClick={() => navigateTo('player', course.id)} aria-label={`${courseAction(progress.percent)} ${course.title}`}>
                  <img src={course.imageUrl} alt="" loading="lazy" />
                </button>
                <div className="ui-course-body">
                  <div className="ui-course-meta">
                    <span>{course.level}</span>
                    <span>{progress.totalLessons > 0 ? `${progress.completedLessons}/${progress.totalLessons} aulas` : 'Em preparação'}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <ProgressBar percent={progress.percent} />
                  <div className="ui-course-footer">
                    {isDone
                      ? <span className="st-done"><CheckCircle2 size={15} aria-hidden="true" /> Concluído</span>
                      : <span className="st-percent">{progress.percent}% concluído</span>}
                    <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => navigateTo('player', course.id)}>{courseAction(progress.percent)}</button>
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
        <p className="st-intro">O certificado é liberado ao concluir {certificateMinProgress}% das aulas e sai em PDF com seu nome, a carga horária, a data de conclusão e um código de verificação.</p>
        {certificateError && <p className="ui-alert error" role="alert">{certificateError}</p>}
        <div className="st-cert-grid">
          {purchasedCourses.map((course) => {
            const progress = getProgress(course);
            const available = progress.certificateAvailable;
            const lessonsNeeded = Math.max(0, Math.ceil((progress.totalLessons * certificateMinProgress) / 100) - progress.completedLessons);
            return (
              <article key={course.id} className="st-cert">
                <CertificatePaper courseTitle={course.title} studentName={fullName} locked={!available} />
                <div className="st-cert-body">
                  <h3>{course.title}</h3>
                  {available ? (
                    <>
                      <span className="st-done"><CheckCircle2 size={15} aria-hidden="true" /> Disponível para download</span>
                      <button type="button" className="ui-btn ui-btn-primary ui-btn-block" onClick={() => handleIssueCertificate(course)} disabled={issuingCourseId === course.id}>
                        {issuingCourseId === course.id ? 'Gerando PDF...' : 'Baixar certificado'}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="st-percent">
                        {progress.totalLessons === 0
                          ? 'O curso ainda não tem aulas publicadas'
                          : `${progress.percent}% concluído · ${lessonsNeeded === 1 ? 'falta 1 aula' : `faltam ${lessonsNeeded} aulas`}`}
                      </span>
                      <button type="button" className="ui-btn ui-btn-secondary ui-btn-block" onClick={() => navigateTo('player', course.id)}>Continuar estudando</button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </>
    );
  };

  const renderTicketList = () => {
    if (ticketsError && tickets.length === 0) return <p className="ui-alert error">{ticketsError}</p>;
    if (isLoadingTickets && tickets.length === 0) return <p className="ui-muted">Carregando chamados...</p>;
    if (tickets.length === 0) return <p className="ui-muted">Você ainda não abriu nenhum chamado.</p>;

    return (
      <>
        {ticketsError && <p className="ui-alert error">{ticketsError}</p>}
        {tickets.map((ticket) => (
          <article key={ticket.id} className="st-ticket">
            <div className="st-ticket-top">
              <div>
                <strong>{ticket.subject}</strong>
                <small>{ticket.courseTitle} · {formatTicketDate(ticket.createdAt)}</small>
              </div>
              <span className={`ticket-status ${ticket.status}`}>{ticketStatusLabels[ticket.status] || ticketStatusLabels.open}</span>
            </div>
            <p className="st-ticket-message">{ticket.message}</p>
            {ticket.adminResponse && (
              <div className="st-ticket-answer">
                <b>Resposta da equipe</b>{ticket.respondedAt && <small> · {formatTicketDate(ticket.respondedAt)}</small>}
                <p>{ticket.adminResponse}</p>
              </div>
            )}
            {ticket.status !== 'closed' && (
              <button type="button" className="st-link" onClick={() => handleCloseTicket(ticket)} disabled={closingTicketId === ticket.id}>
                {closingTicketId === ticket.id ? 'Encerrando...' : 'Marcar como resolvido'}
              </button>
            )}
          </article>
        ))}
      </>
    );
  };

  const renderSupport = () => (
    <div className="st-columns">
      <form className="st-panel" onSubmit={handleSupportSubmit} noValidate>
        <h2>Novo chamado</h2>
        <p className="ui-muted">Conte o que aconteceu e a equipe responde por aqui.</p>
        <div className="ui-field">
          <label htmlFor="support-course">Tópico</label>
          <select className="ui-select" id="support-course" value={ticketCourse} onChange={(event) => setTicketCourse(event.target.value)}>
            <option value="geral">Geral / Plataforma</option>
            {purchasedCourses.map((course) => <option key={course.id} value={course.id}>Curso: {course.title}</option>)}
          </select>
        </div>
        <div className="ui-field">
          <label htmlFor="support-subject">Assunto</label>
          <input className="ui-input" id="support-subject" value={ticketSubject} maxLength={ticketLimits.subject.max} placeholder="Ex.: O vídeo da aula 2 não carrega" onChange={(event) => setTicketSubject(event.target.value)} />
        </div>
        <div className="ui-field">
          <label htmlFor="support-message">Mensagem</label>
          <textarea className="ui-input st-textarea" id="support-message" rows="5" value={ticketMessage} maxLength={ticketLimits.message.max} placeholder="Em qual tela aconteceu e o que você esperava?" onChange={(event) => setTicketMessage(event.target.value)} />
          <small className="st-count">{ticketMessage.length}/{ticketLimits.message.max}</small>
        </div>
        <Feedback feedback={ticketFeedback} />
        <button type="submit" className="ui-btn ui-btn-primary ui-btn-block" disabled={isSubmittingTicket}>{isSubmittingTicket ? 'Enviando...' : 'Enviar chamado'}</button>
      </form>
      <section className="st-panel">
        <div className="st-panel-title">
          <h2>Meus chamados</h2>
          <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={loadTickets} disabled={isLoadingTickets} aria-label="Atualizar chamados">
            <RefreshCw size={15} aria-hidden="true" className={isLoadingTickets ? 'spinning' : ''} /> Atualizar
          </button>
        </div>
        {renderTicketList()}
      </section>
    </div>
  );

  const renderAccount = () => (
    <div className="st-columns">
      <form className="st-panel" onSubmit={handleProfileSubmit}>
        <h2>Perfil</h2>
        <p className="ui-muted">Seu nome aparece nos certificados emitidos.</p>
        <div className="ui-field">
          <label htmlFor="profile-name">Nome completo</label>
          <input className="ui-input" id="profile-name" value={profileName} maxLength={100} autoComplete="name" onChange={(event) => setProfileName(event.target.value)} />
        </div>
        <div className="ui-field">
          <label htmlFor="profile-email">E-mail</label>
          <input className="ui-input" id="profile-email" value={currentUser?.email || ''} disabled />
        </div>
        <Feedback feedback={profileFeedback} />
        <button type="submit" className="ui-btn ui-btn-primary ui-btn-block" disabled={isSavingProfile || profileName.trim() === fullName}>
          {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
      <form className="st-panel" onSubmit={handlePasswordSubmit}>
        <h2>Senha</h2>
        <p className="ui-muted">Use pelo menos 6 caracteres.</p>
        <div className="ui-field">
          <label htmlFor="current-password">Senha atual</label>
          <PasswordInput id="current-password" value={passwords.current} autoComplete="current-password" onChange={(value) => setPasswords((previous) => ({ ...previous, current: value }))} />
        </div>
        <div className="ui-field">
          <label htmlFor="new-password">Nova senha</label>
          <PasswordInput id="new-password" value={passwords.next} autoComplete="new-password" onChange={(value) => setPasswords((previous) => ({ ...previous, next: value }))} />
        </div>
        <div className="ui-field">
          <label htmlFor="confirm-password">Confirmar nova senha</label>
          <PasswordInput id="confirm-password" value={passwords.confirm} autoComplete="new-password" onChange={(value) => setPasswords((previous) => ({ ...previous, confirm: value }))} />
        </div>
        <Feedback feedback={passwordFeedback} />
        <button type="submit" className="ui-btn ui-btn-primary ui-btn-block" disabled={isSavingPassword}>{isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}</button>
      </form>
    </div>
  );

  const renderTab = { courses: renderCourses, certificates: renderCertificates, support: renderSupport, account: renderAccount }[activeTab];

  return (
    <section className="ui-page">
      <div className="container">
        <div className="ui-page-head">
          <div>
            <h1>Olá, {firstName}</h1>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => navigateTo('home')}>Explorar catálogo <ArrowRight size={16} aria-hidden="true" /></button>
        </div>

        <nav className="st-tabs" aria-label="Seções do painel do aluno">
          {tabs.map((tab) => {
            const badge = tab.id === 'support' ? openTicketCount : tab.id === 'certificates' ? certificatesAvailable : 0;
            return (
              <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}>
                {tab.label}{badge > 0 && <em>{badge}</em>}
              </button>
            );
          })}
        </nav>

        {renderTab()}
      </div>
    </section>
  );
};

export default StudentDashboardPage;
