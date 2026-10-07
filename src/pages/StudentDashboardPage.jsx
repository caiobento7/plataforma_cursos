import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Award, BookOpen, CheckCircle2, Eye, EyeOff, GraduationCap, Headphones, KeyRound,
  Lock, PlayCircle, RefreshCw, Settings, Sparkles, TicketPlus, Trophy, UserRound,
} from 'lucide-react';
import { api } from '../services/api.js';
import { downloadCertificatePdf } from '../utils/certificatePdf.js';
import { formatTicketDate, ticketLimits, ticketStatusLabels } from '../utils/ticketUtils.js';

const certificateMinProgress = 60;

const courseFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'in-progress', label: 'Em andamento' },
  { id: 'not-started', label: 'Não iniciados' },
  { id: 'completed', label: 'Concluídos' },
];

const statusLabels = {
  'not-started': 'Não iniciado',
  'in-progress': 'Em andamento',
  completed: 'Concluído',
};

const getProgress = (course) => course.progress || { completedLessons: 0, totalLessons: 0, percent: 0, certificateAvailable: false };

const getCourseStatus = (course) => {
  const { percent } = getProgress(course);
  if (percent >= 100) return 'completed';
  return percent > 0 ? 'in-progress' : 'not-started';
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  return hour < 18 ? 'Boa tarde' : 'Boa noite';
};

const initials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'A';

const ProgressRing = ({ percent, size = 112, stroke = 10, label }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="sp-ring" style={{ width: size, height: size }} role="img" aria-label={`${percent}% concluído`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} className="sp-ring-track" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} className="sp-ring-value" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="sp-ring-label"><strong>{percent}%</strong>{label && <small>{label}</small>}</div>
    </div>
  );
};

const SectionHeader = ({ eyebrow, title, description, action }) => (
  <div className="sp-section-header">
    <div>
      <span className="sp-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
    {action}
  </div>
);

const Feedback = ({ feedback }) => (feedback
  ? <p className={`sp-feedback ${feedback.type}`} role="status">{feedback.text}</p>
  : null);

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
  const [courseFilter, setCourseFilter] = useState('all');

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

  const summary = useMemo(() => {
    const progressList = purchasedCourses.map(getProgress);
    const totalLessons = progressList.reduce((total, item) => total + item.totalLessons, 0);
    const completedLessons = progressList.reduce((total, item) => total + item.completedLessons, 0);
    return {
      courses: purchasedCourses.length,
      completedLessons,
      certificates: progressList.filter((item) => item.certificateAvailable).length,
      averagePercent: progressList.length > 0 ? Math.round(progressList.reduce((total, item) => total + item.percent, 0) / progressList.length) : 0,
      totalLessons,
      inProgress: purchasedCourses.filter((course) => getCourseStatus(course) === 'in-progress').length,
    };
  }, [purchasedCourses]);

  // Curso em destaque: o último em andamento; se não houver, o primeiro ainda não iniciado.
  const spotlight = useMemo(() => {
    const inProgress = purchasedCourses
      .filter((course) => getCourseStatus(course) === 'in-progress')
      .sort((a, b) => String(getProgress(b).lastCompletedAt || '').localeCompare(String(getProgress(a).lastCompletedAt || '')));
    return inProgress[0] || purchasedCourses.find((course) => getCourseStatus(course) === 'not-started') || null;
  }, [purchasedCourses]);

  const filteredCourses = courseFilter === 'all'
    ? purchasedCourses
    : purchasedCourses.filter((course) => getCourseStatus(course) === courseFilter);

  const filterCounts = useMemo(() => ({
    all: purchasedCourses.length,
    'in-progress': purchasedCourses.filter((course) => getCourseStatus(course) === 'in-progress').length,
    'not-started': purchasedCourses.filter((course) => getCourseStatus(course) === 'not-started').length,
    completed: purchasedCourses.filter((course) => getCourseStatus(course) === 'completed').length,
  }), [purchasedCourses]);

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

  // Carrega na abertura (para o contador do menu) e de novo sempre que a aba
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

  const renderEmptyCourses = () => (
    <div className="sp-empty">
      <GraduationCap size={34} aria-hidden="true" />
      <h3>Sua jornada começa aqui</h3>
      <p>Você ainda não está matriculado em nenhum curso. Explore o catálogo e escolha o primeiro.</p>
      <button type="button" className="sp-button primary" onClick={() => navigateTo('home')}>Explorar cursos <ArrowRight size={16} aria-hidden="true" /></button>
    </div>
  );

  const renderSpotlight = () => {
    if (!spotlight) {
      return (
        <section className="sp-spotlight done">
          <Trophy size={40} aria-hidden="true" />
          <div>
            <span className="sp-eyebrow">Parabéns</span>
            <h3>Você concluiu todos os seus cursos</h3>
            <p>Emita seus certificados e procure um novo desafio no catálogo.</p>
          </div>
          <button type="button" className="sp-button light" onClick={() => setActiveTab('certificates')}>Ver certificados</button>
        </section>
      );
    }

    const progress = getProgress(spotlight);
    const started = progress.percent > 0;
    return (
      <section className="sp-spotlight">
        <img src={spotlight.imageUrl} alt="" />
        <div className="sp-spotlight-body">
          <span className="sp-eyebrow">{started ? 'Continue de onde parou' : 'Pronto para começar'}</span>
          <h3>{spotlight.title}</h3>
          <p>
            {progress.totalLessons > 0
              ? `${progress.completedLessons} de ${progress.totalLessons} aulas concluídas · nível ${spotlight.level.toLowerCase()}`
              : 'O conteúdo deste curso está sendo preparado.'}
          </p>
          <button type="button" className="sp-button primary" onClick={() => navigateTo('player', spotlight.id)}>
            <PlayCircle size={17} aria-hidden="true" /> {started ? 'Continuar curso' : 'Começar agora'}
          </button>
        </div>
        <ProgressRing percent={progress.percent} label="concluído" />
      </section>
    );
  };

  const renderMyCourses = () => (
    <section className="sp-section">
      <div className="sp-welcome">
        <div>
          <span className="sp-eyebrow">Área do aluno</span>
          <h2>{greeting()}, {firstName}.</h2>
          <p>
            {summary.courses === 0
              ? 'Que tal escolher seu primeiro curso hoje?'
              : summary.inProgress > 0
                ? `Você tem ${summary.inProgress} ${summary.inProgress === 1 ? 'curso em andamento' : 'cursos em andamento'}. Bora continuar?`
                : 'Escolha um curso e comece a estudar.'}
          </p>
        </div>
      </div>

      {summary.courses === 0 ? renderEmptyCourses() : (
        <>
          {renderSpotlight()}

          <dl className="sp-stats">
            <div><dt>Cursos matriculados</dt><dd>{summary.courses}</dd><BookOpen size={18} aria-hidden="true" /></div>
            <div><dt>Aulas concluídas</dt><dd>{summary.completedLessons}<small>/{summary.totalLessons}</small></dd><CheckCircle2 size={18} aria-hidden="true" /></div>
            <div><dt>Progresso médio</dt><dd>{summary.averagePercent}%</dd><Sparkles size={18} aria-hidden="true" /></div>
            <div><dt>Certificados liberados</dt><dd>{summary.certificates}</dd><Award size={18} aria-hidden="true" /></div>
          </dl>

          <div className="sp-list-header">
            <h3>Meus cursos</h3>
            <div className="sp-chips" role="tablist" aria-label="Filtrar cursos">
              {courseFilters.map((filter) => (
                <button key={filter.id} type="button" role="tab" aria-selected={courseFilter === filter.id} className={courseFilter === filter.id ? 'active' : ''} onClick={() => setCourseFilter(filter.id)}>
                  {filter.label}<span>{filterCounts[filter.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <p className="sp-muted">Nenhum curso nesta situação.</p>
          ) : (
            <div className="sp-course-grid">
              {filteredCourses.map((course) => {
                const progress = getProgress(course);
                const status = getCourseStatus(course);
                const action = status === 'completed' ? 'Revisar' : status === 'in-progress' ? 'Continuar' : 'Começar';
                return (
                  <article key={course.id} className={`sp-course-card ${status}`}>
                    <button type="button" className="sp-course-cover" onClick={() => navigateTo('player', course.id)} aria-label={`${action} ${course.title}`}>
                      <img src={course.imageUrl} alt="" />
                      <span className={`sp-status ${status}`}>{statusLabels[status]}</span>
                    </button>
                    <div className="sp-course-body">
                      <span className="sp-level">{course.level}</span>
                      <h4>{course.title}</h4>
                      <div className="sp-progress" aria-hidden="true"><i style={{ width: `${progress.percent}%` }} /></div>
                      <div className="sp-course-meta">
                        <span>{progress.totalLessons > 0 ? `${progress.completedLessons}/${progress.totalLessons} aulas` : 'Sem aulas ainda'}</span>
                        <strong>{progress.percent}%</strong>
                      </div>
                      <button type="button" className="sp-course-action" onClick={() => navigateTo('player', course.id)}>
                        {action} <ArrowRight size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );

  const renderCertificates = () => (
    <section className="sp-section">
      <SectionHeader
        eyebrow="Conquistas"
        title="Certificados"
        description={`O certificado é liberado ao concluir ${certificateMinProgress}% das aulas do curso e sai em PDF com seu nome, a carga horária e a data de conclusão.`}
      />
      {certificateError && <p className="sp-feedback error" role="alert">{certificateError}</p>}
      {purchasedCourses.length === 0 ? renderEmptyCourses() : (
        <div className="sp-certificate-grid">
          {purchasedCourses.map((course) => {
            const progress = getProgress(course);
            const available = progress.certificateAvailable;
            const lessonsNeeded = Math.max(0, Math.ceil((progress.totalLessons * certificateMinProgress) / 100) - progress.completedLessons);
            return (
              <article key={course.id} className={`sp-certificate ${available ? 'available' : 'locked'}`}>
                <div className="sp-certificate-seal" aria-hidden="true">{available ? <Award size={26} /> : <Lock size={22} />}</div>
                <span className="sp-eyebrow">Certificado de conclusão</span>
                <h4>{course.title}</h4>
                {available ? (
                  <>
                    <p className="sp-certificate-status ok"><CheckCircle2 size={15} aria-hidden="true" /> Disponível · {progress.percent}% concluído</p>
                    <button type="button" className="sp-button primary" onClick={() => handleIssueCertificate(course)} disabled={issuingCourseId === course.id}>
                      <Award size={16} aria-hidden="true" /> {issuingCourseId === course.id ? 'Gerando PDF...' : 'Emitir certificado (PDF)'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="sp-certificate-track" aria-hidden="true">
                      <i style={{ width: `${progress.percent}%` }} />
                      <b style={{ left: `${certificateMinProgress}%` }} />
                    </div>
                    <p className="sp-certificate-status">
                      {progress.totalLessons === 0
                        ? 'O curso ainda não tem aulas publicadas.'
                        : `${progress.percent}% concluído · ${lessonsNeeded === 1 ? 'falta 1 aula' : `faltam ${lessonsNeeded} aulas`} para liberar`}
                    </p>
                    <button type="button" className="sp-button ghost" onClick={() => navigateTo('player', course.id)}>Continuar estudando</button>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

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
              <button type="button" className="sp-link" onClick={() => handleCloseTicket(ticket)} disabled={closingTicketId === ticket.id}>
                {closingTicketId === ticket.id ? 'Encerrando...' : 'Marcar como resolvido'}
              </button>
            )}
          </article>
        ))}
      </>
    );
  };

  const renderSupport = () => (
    <section className="sp-section">
      <SectionHeader eyebrow="Ajuda" title="Suporte" description="Envie uma dúvida para a equipe da plataforma e acompanhe as respostas por aqui." />
      <div className="sp-two-columns">
        <form className="sp-panel" onSubmit={handleSupportSubmit} noValidate>
          <div className="sp-panel-heading"><TicketPlus size={18} aria-hidden="true" /><div><h3>Novo chamado</h3><p>Conte o que aconteceu para podermos ajudar.</p></div></div>
          <label htmlFor="support-course">Tópico</label>
          <select id="support-course" value={ticketCourse} onChange={(event) => setTicketCourse(event.target.value)}>
            <option value="geral">Geral / Plataforma</option>
            {purchasedCourses.map((course) => <option key={course.id} value={course.id}>Curso: {course.title}</option>)}
          </select>
          <label htmlFor="support-subject">Assunto</label>
          <input id="support-subject" value={ticketSubject} maxLength={ticketLimits.subject.max} placeholder="Ex.: O vídeo da aula 2 não carrega" onChange={(event) => setTicketSubject(event.target.value)} />
          <small className="sp-count">{ticketSubject.length}/{ticketLimits.subject.max}</small>
          <label htmlFor="support-message">Mensagem</label>
          <textarea id="support-message" rows="5" value={ticketMessage} maxLength={ticketLimits.message.max} placeholder="Em qual tela aconteceu e o que você esperava?" onChange={(event) => setTicketMessage(event.target.value)} />
          <small className="sp-count">{ticketMessage.length}/{ticketLimits.message.max}</small>
          <Feedback feedback={ticketFeedback} />
          <button type="submit" className="sp-button primary full" disabled={isSubmittingTicket}>{isSubmittingTicket ? 'Enviando...' : 'Enviar chamado'}</button>
        </form>
        <section className="sp-panel">
          <div className="sp-panel-heading">
            <Headphones size={18} aria-hidden="true" />
            <div><h3>Meus chamados</h3><p>{openTicketCount > 0 ? `${openTicketCount} aguardando resposta` : 'Acompanhe as solicitações enviadas.'}</p></div>
            <button type="button" className="sp-icon-button" onClick={loadTickets} disabled={isLoadingTickets} title="Atualizar chamados" aria-label="Atualizar chamados">
              <RefreshCw size={15} aria-hidden="true" className={isLoadingTickets ? 'spinning' : ''} />
            </button>
          </div>
          {renderTicketList()}
        </section>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="sp-section">
      <SectionHeader eyebrow="Conta" title="Configurações" description="Mantenha seus dados atualizados. O nome cadastrado é o que aparece nos certificados." />
      <div className="sp-two-columns">
        <form className="sp-panel" onSubmit={handleProfileSubmit}>
          <div className="sp-panel-heading"><UserRound size={18} aria-hidden="true" /><div><h3>Perfil</h3><p>Como você aparece na plataforma.</p></div></div>
          <div className="sp-profile-card">
            <span className="sp-avatar large" aria-hidden="true">{initials(fullName)}</span>
            <div>
              <strong>{fullName}</strong>
              <small>{currentUser?.email}</small>
              {currentUser?.created_at && <small>Aluno desde {new Date(currentUser.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</small>}
            </div>
          </div>
          <label htmlFor="profile-name">Nome completo</label>
          <input id="profile-name" value={profileName} maxLength={100} autoComplete="name" onChange={(event) => setProfileName(event.target.value)} />
          <label htmlFor="profile-email">E-mail</label>
          <input id="profile-email" value={currentUser?.email || ''} disabled />
          <small className="sp-hint">O e-mail é usado para entrar e não pode ser alterado.</small>
          <Feedback feedback={profileFeedback} />
          <button type="submit" className="sp-button primary full" disabled={isSavingProfile || profileName.trim() === fullName}>
            {isSavingProfile ? 'Salvando...' : 'Salvar nome'}
          </button>
        </form>
        <form className="sp-panel" onSubmit={handlePasswordSubmit}>
          <div className="sp-panel-heading"><KeyRound size={18} aria-hidden="true" /><div><h3>Segurança</h3><p>Troque sua senha de acesso.</p></div></div>
          <label htmlFor="current-password">Senha atual</label>
          <PasswordInput id="current-password" value={passwords.current} autoComplete="current-password" onChange={(value) => setPasswords((previous) => ({ ...previous, current: value }))} />
          <label htmlFor="new-password">Nova senha</label>
          <PasswordInput id="new-password" value={passwords.next} autoComplete="new-password" onChange={(value) => setPasswords((previous) => ({ ...previous, next: value }))} />
          <small className="sp-hint">Mínimo de 6 caracteres.</small>
          <label htmlFor="confirm-password">Confirmar nova senha</label>
          <PasswordInput id="confirm-password" value={passwords.confirm} autoComplete="new-password" onChange={(value) => setPasswords((previous) => ({ ...previous, confirm: value }))} />
          <Feedback feedback={passwordFeedback} />
          <button type="submit" className="sp-button primary full" disabled={isSavingPassword}>{isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}</button>
        </form>
      </div>
    </section>
  );

  const tabs = [
    { id: 'my-courses', label: 'Meus cursos', icon: BookOpen, count: summary.courses, render: renderMyCourses },
    { id: 'certificates', label: 'Certificados', icon: Award, count: summary.certificates, render: renderCertificates },
    { id: 'support', label: 'Suporte', icon: Headphones, count: openTicketCount, render: renderSupport },
    { id: 'settings', label: 'Configurações', icon: Settings, render: renderSettings },
  ];
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <section className="sp-page">
      <div className="container sp-shell">
        <aside className="sp-sidebar">
          <div className="sp-user">
            <span className="sp-avatar" aria-hidden="true">{initials(fullName)}</span>
            <div>
              <strong>{fullName}</strong>
              <small>{currentUser?.email}</small>
            </div>
          </div>
          <nav className="sp-nav" aria-label="Navegação do aluno">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}>
                <tab.icon size={18} aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.count > 0 && <em>{tab.count}</em>}
              </button>
            ))}
          </nav>
          <div className="sp-sidebar-progress">
            <ProgressRing percent={summary.averagePercent} size={64} stroke={7} />
            <div><strong>Progresso geral</strong><small>{summary.completedLessons} aulas concluídas</small></div>
          </div>
        </aside>
        <main className="sp-content">{currentTab.render()}</main>
      </div>
    </section>
  );
};

export default StudentDashboardPage;
