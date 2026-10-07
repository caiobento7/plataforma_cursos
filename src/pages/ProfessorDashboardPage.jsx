import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, CircleDollarSign, Layers, MessageCircle, Pencil, Plus, RefreshCw, Search, Send, Star,
  Trash2, Users, X,
} from 'lucide-react';
import CreateCourseForm from '../components/CreateCourseForm.jsx';
import { api } from '../services/api.js';
import { formatPrice, formatRating } from '../utils/courseUtils.js';
import { formatTicketDate, ticketLimits } from '../utils/ticketUtils.js';

const tabs = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'courses', label: 'Cursos' },
  { id: 'questions', label: 'Dúvidas' },
  { id: 'support', label: 'Chamados' },
  { id: 'analytics', label: 'Análises' },
];

// Nomes antigos das abas, ainda usados por outras telas ao voltar ao painel.
const tabAliases = { 'manage-courses': 'courses', 'my-courses': 'courses', 'new-course': 'courses' };

const ticketStatusLabels = { open: 'Aberto', answered: 'Respondido', closed: 'Encerrado' };
const ticketFilters = [
  { id: 'open', label: 'Abertos' },
  { id: 'answered', label: 'Respondidos' },
  { id: 'closed', label: 'Encerrados' },
  { id: 'all', label: 'Todos' },
];
const questionFilters = [
  { id: 'pending', label: 'Sem resposta' },
  { id: 'answered', label: 'Respondidas' },
  { id: 'all', label: 'Todas' },
];

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const Chips = ({ filters, value, onChange, counts }) => (
  <div className="bo-chips" role="tablist">
    {filters.map((filter) => (
      <button key={filter.id} type="button" role="tab" aria-selected={value === filter.id} className={value === filter.id ? 'active' : ''} onClick={() => onChange(filter.id)}>
        {filter.label} <span>{counts[filter.id]}</span>
      </button>
    ))}
  </div>
);

const ProfessorDashboardPage = ({ navigateTo, handleCreateCourse, allCourses, analytics, handleDeleteCourse, activeTab: initialTab }) => {
  const [activeTab, setActiveTab] = useState(tabAliases[initialTab] || initialTab || 'overview');
  const [isCreating, setIsCreating] = useState(initialTab === 'new-course');
  const [courseSearch, setCourseSearch] = useState('');

  // Chamados
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketResponses, setTicketResponses] = useState({});
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('open');
  const [sendingTicketId, setSendingTicketId] = useState(null);

  // Dúvidas das aulas
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState(null);
  const [questionFilter, setQuestionFilter] = useState('pending');
  const [answeringId, setAnsweringId] = useState(null);

  const loadSupportTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      setSupportTickets(await api.getAdminSupportTickets());
    } catch (error) {
      setTicketFeedback({ type: 'error', text: error.message });
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);
    try {
      setQuestions(await api.getAdminLessonQuestions());
    } catch (error) {
      setQuestionFeedback({ type: 'error', text: error.message });
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    loadSupportTickets();
    loadQuestions();
  }, [loadSupportTickets, loadQuestions]);

  const ticketCounts = useMemo(() => ({
    open: supportTickets.filter((ticket) => ticket.status === 'open').length,
    answered: supportTickets.filter((ticket) => ticket.status === 'answered').length,
    closed: supportTickets.filter((ticket) => ticket.status === 'closed').length,
    all: supportTickets.length,
  }), [supportTickets]);

  const questionCounts = useMemo(() => ({
    pending: questions.filter((question) => !question.answer).length,
    answered: questions.filter((question) => question.answer).length,
    all: questions.length,
  }), [questions]);

  const visibleTickets = ticketFilter === 'all' ? supportTickets : supportTickets.filter((ticket) => ticket.status === ticketFilter);
  const visibleQuestions = questionFilter === 'all'
    ? questions
    : questions.filter((question) => (questionFilter === 'pending' ? !question.answer : question.answer));
  const filteredCourses = allCourses.filter((course) => course.title.toLowerCase().includes(courseSearch.trim().toLowerCase()));

  const updateSupportTicket = async (ticketId, status) => {
    const adminResponse = (ticketResponses[ticketId] || '').trim();
    if (status === 'answered' && !adminResponse) {
      setTicketFeedback({ type: 'error', text: 'Escreva uma resposta antes de enviar.' });
      return;
    }
    if (status === 'closed' && !window.confirm('Encerrar este chamado? Depois de encerrado, ele não pode mais ser respondido.')) return;

    setSendingTicketId(ticketId);
    setTicketFeedback(null);
    try {
      const ticket = await api.updateAdminSupportTicket(ticketId, { status, adminResponse });
      setSupportTickets((previous) => previous.map((item) => (item.id === ticketId ? ticket : item)));
      setTicketResponses((previous) => ({ ...previous, [ticketId]: '' }));
      setTicketFeedback({ type: 'success', text: status === 'closed' ? 'Chamado encerrado.' : 'Resposta enviada ao aluno.' });
    } catch (error) {
      setTicketFeedback({ type: 'error', text: error.message });
    } finally {
      setSendingTicketId(null);
    }
  };

  const answerQuestion = async (questionId) => {
    const answer = (questionAnswers[questionId] || '').trim();
    if (!answer) return;

    setAnsweringId(questionId);
    setQuestionFeedback(null);
    try {
      await api.answerLessonQuestion(questionId, answer);
      setQuestionAnswers((previous) => ({ ...previous, [questionId]: '' }));
      setQuestionFeedback({ type: 'success', text: 'Resposta publicada na aula.' });
      await loadQuestions();
    } catch (error) {
      setQuestionFeedback({ type: 'error', text: error.message });
    } finally {
      setAnsweringId(null);
    }
  };

  const goToTab = (tabId) => {
    setActiveTab(tabId);
    setIsCreating(false);
  };

  const revenue = Number(analytics?.revenue30d) || 0;
  const totalEnrollments = Number(analytics?.totalEnrollments) || 0;
  const newStudents = Number(analytics?.newStudents30d) || 0;
  const averageRating = Number(analytics?.averageRating) || 0;

  const renderKpis = () => (
    <dl className="bo-kpis">
      <div><dt><BookOpen size={16} aria-hidden="true" /> Cursos publicados</dt><dd>{allCourses.length}</dd></div>
      <div><dt><Users size={16} aria-hidden="true" /> Matrículas</dt><dd>{totalEnrollments.toLocaleString('pt-BR')}</dd><small>+{newStudents} nos últimos 30 dias</small></div>
      <div><dt><CircleDollarSign size={16} aria-hidden="true" /> Faturamento (30 dias)</dt><dd>{currency.format(revenue)}</dd></div>
      <div><dt><Star size={16} aria-hidden="true" /> Avaliação média</dt><dd>{formatRating(averageRating)}</dd><small>de 5,0</small></div>
    </dl>
  );

  const renderOverview = () => (
    <>
      {renderKpis()}
      <div className="bo-grid">
        <section className="bo-panel">
          <h2>Pendências</h2>
          <button type="button" className="bo-task" onClick={() => goToTab('questions')}>
            <MessageCircle size={20} aria-hidden="true" />
            <span><strong>{questionCounts.pending} {questionCounts.pending === 1 ? 'dúvida sem resposta' : 'dúvidas sem resposta'}</strong><small>Alunos aguardando nas aulas</small></span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="bo-task" onClick={() => goToTab('support')}>
            <Send size={20} aria-hidden="true" />
            <span><strong>{ticketCounts.open} {ticketCounts.open === 1 ? 'chamado aberto' : 'chamados abertos'}</strong><small>Solicitações de suporte</small></span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="bo-task" onClick={() => { setActiveTab('courses'); setIsCreating(true); }}>
            <Plus size={20} aria-hidden="true" />
            <span><strong>Criar um novo curso</strong><small>Título, preço e nível; o conteúdo vem em seguida</small></span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
        <section className="bo-panel">
          <div className="bo-panel-title"><h2>Cursos recentes</h2><button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => goToTab('courses')}>Ver todos</button></div>
          <ul className="bo-mini-list">
            {allCourses.slice(0, 4).map((course) => (
              <li key={course.id}>
                <img src={course.imageUrl} alt="" />
                <span><strong>{course.title}</strong><small>{course.level} · {formatPrice(course.price)}</small></span>
                <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => navigateTo('courseEditor', course.id)}>Editar</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );

  const renderCourses = () => {
    if (isCreating) {
      return (
        <section className="bo-panel bo-form">
          <div className="bo-panel-title">
            <div><h2>Novo curso</h2><p className="ui-muted">Defina as informações básicas. Módulos e aulas são adicionados na próxima etapa.</p></div>
            <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => setIsCreating(false)}><X size={16} aria-hidden="true" /> Cancelar</button>
          </div>
          <CreateCourseForm onCourseCreate={handleCreateCourse} />
        </section>
      );
    }

    return (
      <>
        <div className="ui-toolbar">
          <label className="ui-search">
            <Search size={18} aria-hidden="true" />
            <input className="ui-input" type="search" placeholder="Buscar curso pelo nome" aria-label="Buscar curso" value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} />
          </label>
          <span className="ui-toolbar-count">{filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}</span>
          <button type="button" className="ui-btn ui-btn-primary" onClick={() => setIsCreating(true)}><Plus size={16} aria-hidden="true" /> Novo curso</button>
        </div>
        {filteredCourses.length === 0 ? (
          <div className="ui-empty"><h2>Nenhum curso encontrado</h2><p>Crie um curso ou ajuste a busca.</p></div>
        ) : (
          <ul className="bo-course-list">
            {filteredCourses.map((course) => (
              <li key={course.id}>
                <img src={course.imageUrl} alt="" />
                <div className="bo-course-info">
                  <strong>{course.title}</strong>
                  <small>{course.level} · {formatPrice(course.price)} · {course.enrollmentCount.toLocaleString('pt-BR')} alunos · <Star size={12} fill="currentColor" aria-hidden="true" /> {formatRating(course.rating)}</small>
                </div>
                <div className="bo-course-actions">
                  <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => navigateTo('courseEditor', course.id)}><Layers size={15} aria-hidden="true" /> Conteúdo</button>
                  <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => navigateTo('editCourseMetadata', course.id)}><Pencil size={15} aria-hidden="true" /> Detalhes</button>
                  <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm bo-danger" onClick={() => handleDeleteCourse(course.id)} aria-label={`Excluir ${course.title}`}><Trash2 size={15} aria-hidden="true" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

  const renderQuestions = () => (
    <>
      <div className="bo-section-bar">
        <Chips filters={questionFilters} value={questionFilter} onChange={setQuestionFilter} counts={questionCounts} />
        <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={loadQuestions} disabled={isLoadingQuestions}><RefreshCw size={15} aria-hidden="true" className={isLoadingQuestions ? 'spinning' : ''} /> Atualizar</button>
      </div>
      {questionFeedback && <p className={`ui-alert ${questionFeedback.type}`} role="status">{questionFeedback.text}</p>}
      {isLoadingQuestions && questions.length === 0 ? (
        <p className="ui-muted">Carregando dúvidas...</p>
      ) : visibleQuestions.length === 0 ? (
        <div className="ui-empty"><h2>{questionFilter === 'pending' ? 'Nenhuma dúvida pendente' : 'Nenhuma dúvida aqui'}</h2><p>As perguntas feitas pelos alunos nas aulas aparecem nesta lista.</p></div>
      ) : (
        <div className="bo-cards">
          {visibleQuestions.map((question) => (
            <article key={question.id} className="bo-card">
              <div className="bo-card-head">
                <div><strong>{question.author}</strong><small>{question.courseTitle} · {question.lessonTitle}</small></div>
                <span className={`ticket-status ${question.answer ? 'answered' : 'open'}`}>{question.answer ? 'Respondida' : 'Sem resposta'}</span>
              </div>
              <p className="bo-card-text">{question.text}</p>
              <small className="bo-card-date">{formatTicketDate(question.createdAt)}</small>
              {question.answer ? (
                <div className="bo-answer"><b>Resposta de {question.answer.author}</b><p>{question.answer.text}</p></div>
              ) : (
                <div className="bo-reply">
                  <textarea className="ui-input" rows="3" maxLength={2000} placeholder="Escreva a resposta que aparecerá na aula" aria-label={`Resposta para ${question.author}`} value={questionAnswers[question.id] || ''} onChange={(event) => setQuestionAnswers((previous) => ({ ...previous, [question.id]: event.target.value }))} disabled={answeringId === question.id} />
                  <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => answerQuestion(question.id)} disabled={answeringId === question.id || !(questionAnswers[question.id] || '').trim()}>
                    <Send size={15} aria-hidden="true" /> {answeringId === question.id ? 'Publicando...' : 'Responder'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );

  const renderSupport = () => (
    <>
      <div className="bo-section-bar">
        <Chips filters={ticketFilters} value={ticketFilter} onChange={setTicketFilter} counts={ticketCounts} />
        <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={loadSupportTickets} disabled={isLoadingTickets}><RefreshCw size={15} aria-hidden="true" className={isLoadingTickets ? 'spinning' : ''} /> Atualizar</button>
      </div>
      {ticketFeedback && <p className={`ui-alert ${ticketFeedback.type}`} role="status">{ticketFeedback.text}</p>}
      {isLoadingTickets && supportTickets.length === 0 ? (
        <p className="ui-muted">Carregando chamados...</p>
      ) : visibleTickets.length === 0 ? (
        <div className="ui-empty"><h2>Nenhum chamado aqui</h2><p>{ticketFilter === 'open' ? 'Não há chamados aguardando resposta.' : 'Nenhum chamado com este status.'}</p></div>
      ) : (
        <div className="bo-cards">
          {visibleTickets.map((ticket) => {
            const isSending = sendingTicketId === ticket.id;
            const draft = ticketResponses[ticket.id] || '';
            return (
              <article key={ticket.id} className="bo-card">
                <div className="bo-card-head">
                  <div><strong>{ticket.subject}</strong><small>{ticket.studentName} · {ticket.courseTitle}</small></div>
                  <span className={`ticket-status ${ticket.status}`}>{ticketStatusLabels[ticket.status]}</span>
                </div>
                <p className="bo-card-text">{ticket.message}</p>
                <small className="bo-card-date">{formatTicketDate(ticket.createdAt)}</small>
                {ticket.adminResponse && <div className="bo-answer"><b>Resposta enviada{ticket.respondedAt ? ` · ${formatTicketDate(ticket.respondedAt)}` : ''}</b><p>{ticket.adminResponse}</p></div>}
                {ticket.status !== 'closed' && (
                  <div className="bo-reply">
                    <textarea className="ui-input" rows="3" maxLength={ticketLimits.response.max} placeholder={ticket.adminResponse ? 'Nova resposta (substitui a anterior)' : 'Escreva uma resposta para o aluno'} aria-label={`Resposta para ${ticket.studentName}`} value={draft} onChange={(event) => setTicketResponses((previous) => ({ ...previous, [ticket.id]: event.target.value }))} disabled={isSending} />
                    <div className="bo-reply-actions">
                      <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => updateSupportTicket(ticket.id, 'answered')} disabled={isSending || !draft.trim()}><Send size={15} aria-hidden="true" /> {isSending ? 'Enviando...' : 'Responder'}</button>
                      <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={() => updateSupportTicket(ticket.id, 'closed')} disabled={isSending}>Encerrar</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );

  const renderAnalytics = () => {
    const rows = [...(analytics?.courses || [])].sort((a, b) => (Number(b.enrollment_count) || 0) - (Number(a.enrollment_count) || 0));
    const maxEnrollments = Math.max(1, ...rows.map((row) => Number(row.enrollment_count) || 0));
    return (
      <>
        {renderKpis()}
        <section className="bo-panel">
          <h2>Desempenho por curso</h2>
          <p className="ui-muted">Matrículas acumuladas, novos alunos e faturamento dos últimos 30 dias.</p>
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead><tr><th>Curso</th><th>Matrículas</th><th>Novos (30d)</th><th>Faturamento (30d)</th><th>Avaliação</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td><div className="bo-bar"><i style={{ width: `${((Number(row.enrollment_count) || 0) / maxEnrollments) * 100}%` }} /><span>{(Number(row.enrollment_count) || 0).toLocaleString('pt-BR')}</span></div></td>
                    <td>{Number(row.new_students_30d) || 0}</td>
                    <td>{currency.format(Number(row.revenue_30d) || 0)}</td>
                    <td><Star size={13} fill="currentColor" className="bo-star" aria-hidden="true" /> {formatRating(row.rating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  const content = { overview: renderOverview, courses: renderCourses, questions: renderQuestions, support: renderSupport, analytics: renderAnalytics }[activeTab] || renderOverview;

  return (
    <section className="ui-page">
      <div className="container">
        <div className="ui-page-head">
          <div>
            <h1>Backoffice</h1>
            <p>Gerencie o catálogo, acompanhe os indicadores e responda aos alunos.</p>
          </div>
          <button type="button" className="ui-btn ui-btn-primary" onClick={() => { setActiveTab('courses'); setIsCreating(true); }}><Plus size={16} aria-hidden="true" /> Novo curso</button>
        </div>

        <nav className="st-tabs" aria-label="Seções do backoffice">
          {tabs.map((tab) => {
            const badge = tab.id === 'questions' ? questionCounts.pending : tab.id === 'support' ? ticketCounts.open : 0;
            return (
              <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => goToTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}>
                {tab.label}{badge > 0 && <em>{badge}</em>}
              </button>
            );
          })}
        </nav>

        {content()}
      </div>
    </section>
  );
};

export default ProfessorDashboardPage;
