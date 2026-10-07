import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, CircleCheck, CircleDollarSign, Layers, LayoutDashboard, List, MessageSquare, MonitorCog, Pencil, Plus, RefreshCw, Send, Settings, ShieldCheck, TrendingUp, Users, X } from 'lucide-react';
import backofficeBackground from '../assets/backoffice-background.png';
import CourseCard from '../components/CourseCard.jsx'; // Corrigido
import CreateCourseForm from '../components/CreateCourseForm.jsx'; // Corrigido
import { api } from '../services/api.js';
import { formatTicketDate, ticketLimits } from '../utils/ticketUtils.js';

const adminTicketStatusLabels = { open: 'Aberto', answered: 'Respondido', closed: 'Encerrado' };

const ticketFilters = [
  { id: 'open', label: 'Abertos' },
  { id: 'answered', label: 'Respondidos' },
  { id: 'closed', label: 'Encerrados' },
  { id: 'all', label: 'Todos' },
];

const AdminSectionHeader = ({ title, description, action }) => (
  <div className="admin-section-header">
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    {action}
  </div>
);

const ProfessorDashboardPage = ({ 
  navigateTo, 
  handleCreateCourse, 
  allCourses, 
  analytics,
  handleDeleteCourse,
  activeTab: initialTab
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [isCatalogSummaryOpen, setIsCatalogSummaryOpen] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [ticketResponses, setTicketResponses] = useState({});
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState(null); // { type: 'success' | 'error', text }
  const [ticketFilter, setTicketFilter] = useState('open');
  const [sendingTicketId, setSendingTicketId] = useState(null);

  const loadSupportTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    setTicketFeedback(null);
    try {
      setSupportTickets(await api.getAdminSupportTickets());
    } catch (error) {
      setTicketFeedback({ type: 'error', text: error.message });
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  useEffect(() => { loadSupportTickets(); }, [loadSupportTickets]);

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

  const ticketCounts = {
    open: supportTickets.filter((ticket) => ticket.status === 'open').length,
    answered: supportTickets.filter((ticket) => ticket.status === 'answered').length,
    closed: supportTickets.filter((ticket) => ticket.status === 'closed').length,
    all: supportTickets.length,
  };
  const visibleTickets = ticketFilter === 'all' ? supportTickets : supportTickets.filter((ticket) => ticket.status === ticketFilter);

  const managedCourses = allCourses;
  const freeCourses = managedCourses.filter((course) => course.price === 0).length;
  const paidCourses = managedCourses.length - freeCourses;
  const courseLevels = new Set(managedCourses.map((course) => course.level)).size;
  const revenue30d = Number(analytics?.revenue30d) || 0;
  const newStudents30d = Number(analytics?.newStudents30d) || 0;
  const totalEnrollments = Number(analytics?.totalEnrollments) || 0;
  const averageRating = Number(analytics?.averageRating) || 0;
  const formattedRevenue30d = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue30d);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="admin-overview">
            <div className="admin-overview-header">
              <div>
                <h2>Visão geral</h2>
                <p>Tenha uma visão rápida do catálogo e das atividades da plataforma.</p>
              </div>
              <button type="button" className="admin-primary-action" onClick={() => setActiveTab('new-course')}><Plus size={16} aria-hidden="true" /> Novo curso</button>
            </div>
            <section className="admin-catalog-glance"><div><span>Catálogo</span><p>Uma visão rápida do conteúdo disponível na plataforma.</p></div><button type="button" onClick={() => setIsCatalogSummaryOpen(true)}>Ver resumo</button></section>
            {isCatalogSummaryOpen && <div className="admin-modal-backdrop" role="presentation" onMouseDown={() => setIsCatalogSummaryOpen(false)}><section className="admin-catalog-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="admin-modal-close" onClick={() => setIsCatalogSummaryOpen(false)} aria-label="Fechar resumo"><X size={18} aria-hidden="true" /></button><span>CATÁLOGO CURSOLAB</span><h3 id="catalog-modal-title">Organize os cursos e mantenha o catálogo em movimento.</h3><p>Crie conteúdos, revise informações e acompanhe os cursos publicados em um só lugar.</p><div className="admin-modal-metrics"><div><strong>{managedCourses.length}</strong><small>Cursos publicados</small></div><div><strong>{freeCourses}</strong><small>Gratuitos</small></div><div><strong>{paidCourses}</strong><small>Pagos</small></div></div><button type="button" className="admin-modal-action" onClick={() => { setIsCatalogSummaryOpen(false); setActiveTab('manage-courses'); }}>Gerenciar catálogo</button></section></div>}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon stat-icon-purple"><BookOpen size={16} aria-hidden="true" /></span>
                <div><div className="stat-value">{managedCourses.length}</div><div className="stat-label">Cursos cadastrados</div></div>
              </div>
              <div className="stat-card">
                <span className="stat-icon stat-icon-blue"><CircleDollarSign size={16} aria-hidden="true" /></span>
                <div><div className="stat-value">{freeCourses}</div><div className="stat-label">Cursos gratuitos</div></div>
              </div>
              <div className="stat-card">
                <span className="stat-icon stat-icon-green"><TrendingUp size={16} aria-hidden="true" /></span>
                <div><div className="stat-value">{paidCourses}</div><div className="stat-label">Cursos pagos</div></div>
              </div>
              <div className="stat-card">
                <span className="stat-icon stat-icon-orange"><Layers size={16} aria-hidden="true" /></span>
                <div><div className="stat-value">{courseLevels}</div><div className="stat-label">Níveis de formação</div></div>
              </div>
            </div>
            <div className="admin-overview-grid">
              <section className="admin-panel">
                <div className="admin-panel-heading"><div><h3>Ações rápidas</h3><p>Atalhos para administrar a plataforma.</p></div></div>
                <div className="quick-actions">
                  <button type="button" onClick={() => setActiveTab('new-course')}><span><Plus size={16} aria-hidden="true" /></span><div><strong>Criar curso</strong><small>Adicione um novo conteúdo</small></div></button>
                  <button type="button" onClick={() => setActiveTab('manage-courses')}><span><Pencil size={16} aria-hidden="true" /></span><div><strong>Gerenciar catálogo</strong><small>Edite ou exclua cursos</small></div></button>
                  <button type="button" onClick={() => setActiveTab('analytics')}><span><TrendingUp size={16} aria-hidden="true" /></span><div><strong>Ver análises</strong><small>Acompanhe os indicadores</small></div></button>
                </div>
              </section>
              <section className="admin-panel recent-courses-panel">
                <div className="admin-panel-heading"><div><h3>Cursos recentes</h3><p>Últimos cursos no catálogo.</p></div><button type="button" onClick={() => setActiveTab('my-courses')}>Ver todos</button></div>
                {managedCourses.slice(0, 3).map((course) => <div className="recent-course" key={course.id}><span>{course.title.charAt(0)}</span><div><strong>{course.title}</strong><small>{course.level} · {course.price === 0 ? 'Gratuito' : `R$ ${course.price.toFixed(2).replace('.', ',')}`}</small></div></div>)}
              </section>
            </div>
          </div>
        );
      case 'my-courses':
        return (
          <section className="admin-section">
            <AdminSectionHeader eyebrow="Catálogo" title="Todos os cursos" description="Visualize os cursos disponíveis na plataforma." action={<button type="button" className="admin-primary-action" onClick={() => setActiveTab('new-course')}><Plus size={16} aria-hidden="true" /> Novo curso</button>} />
            <div className="course-grid admin-course-grid">
              {managedCourses.length > 0 ? (
                managedCourses.map(course => (
                  <CourseCard key={course.id} course={course} navigateTo={navigateTo} />
                ))
              ) : (
                <div className="admin-empty-state"><strong>Nenhum curso cadastrado.</strong><span>Crie o primeiro curso para começar o catálogo.</span></div>
              )}
            </div>
          </section>
        );
      case 'new-course':
        return (
          <section className="admin-section">
            <AdminSectionHeader eyebrow="Catálogo" title="Criar novo curso" description="Preencha as informações iniciais. O conteúdo pode ser adicionado na próxima etapa." />
            <div className="admin-form-panel"><CreateCourseForm onCourseCreate={handleCreateCourse} /></div>
          </section>
        );
      case 'manage-courses':
        return (
          <section className="admin-section">
            <AdminSectionHeader eyebrow="Catálogo" title="Gerenciar cursos" description="Edite informações, conteúdo ou remova cursos da plataforma." />
            <ul className="admin-course-manager">
              {managedCourses.map(course => (
                <li key={course.id} className="admin-course-row">
                  <div className="admin-course-details">
                    <span>{course.title.charAt(0)}</span>
                    <div>
                    <strong>{course.title}</strong>
                    <small>{course.level} · {course.price === 0 ? 'Gratuito' : `R$ ${course.price.toFixed(2).replace('.', ',')}`}</small>
                    </div>
                  </div>
                  <div className="admin-course-actions">
                    <button className="btn admin-secondary-button" onClick={() => navigateTo('editCourseMetadata', course.id)}>
                      Editar Detalhes
                    </button>
                    <button className="btn" onClick={() => navigateTo('courseEditor', course.id)}>
                      Editar Conteúdo
                    </button>
                    <button className="btn-danger" onClick={() => handleDeleteCourse(course.id)}>
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      case 'analytics':
        return (
          <section className="admin-section">
            <AdminSectionHeader eyebrow="Indicadores" title="Análises" description="Acompanhe o desempenho de vendas e o engajamento dos cursos." />
            <div className="analytics-period"><TrendingUp size={18} aria-hidden="true" /><div><strong>Visão dos últimos 30 dias</strong><span>Indicadores consolidados da plataforma.</span></div></div>
            <div className="stats-grid admin-analytics-grid analytics-metrics">
              <div className="stat-card">
                <span className="stat-icon stat-icon-green"><TrendingUp size={16} aria-hidden="true" /></span>
                <div><div className="stat-value">{formattedRevenue30d}</div><div className="stat-label">Faturamento nos últimos 30 dias</div></div>
              </div>
              <div className="stat-card">
                <span className="stat-icon stat-icon-blue"><Users size={16} aria-hidden="true" /></span>
                <div><div className="stat-value">{newStudents30d}</div><div className="stat-label">Novos alunos nos últimos 30 dias</div></div>
              </div>
            </div>
            <div className="analytics-detail-grid">
              <article className="analytics-panel">
                <div className="analytics-panel-heading"><BookOpen size={18} aria-hidden="true" /><div><h3>Resumo do catálogo</h3><p>Dados atuais dos cursos publicados.</p></div></div>
                <dl className="analytics-list">
                  <div><dt>Cursos disponíveis</dt><dd>{managedCourses.length}</dd></div>
                  <div><dt>Matrículas acumuladas</dt><dd>{totalEnrollments}</dd></div>
                  <div><dt>Avaliação média</dt><dd>{averageRating.toFixed(1)}</dd></div>
                </dl>
              </article>
              <article className="analytics-panel analytics-next-step">
                <Layers size={20} aria-hidden="true" />
                <h3>Relatórios detalhados</h3>
                <p>A evolução por curso, matrículas e conclusão de aulas aparecerá aqui conforme novos dados forem registrados.</p>
              </article>
            </div>
          </section>
        );
      case 'support':
        return (
          <section className="admin-section">
            <AdminSectionHeader title="Chamados" description="Acompanhe e responda às solicitações enviadas pelos alunos." action={<button type="button" className="admin-secondary-button" onClick={loadSupportTickets} disabled={isLoadingTickets}><RefreshCw size={15} aria-hidden="true" className={isLoadingTickets ? 'spinning' : ''} /> Atualizar</button>} />
            <div className="ticket-filters" role="tablist" aria-label="Filtrar chamados por status">
              {ticketFilters.map((filter) => (
                <button key={filter.id} type="button" role="tab" aria-selected={ticketFilter === filter.id} className={ticketFilter === filter.id ? 'active' : ''} onClick={() => setTicketFilter(filter.id)}>
                  {filter.label} <span>{ticketCounts[filter.id]}</span>
                </button>
              ))}
            </div>
            {ticketFeedback && <p className={`admin-ticket-feedback ${ticketFeedback.type}`} role="status">{ticketFeedback.text}</p>}
            {isLoadingTickets && supportTickets.length === 0 ? (
              <p className="admin-ticket-empty">Carregando chamados...</p>
            ) : visibleTickets.length === 0 ? (
              <p className="admin-ticket-empty">{ticketFilter === 'all' ? 'Nenhum chamado recebido até agora.' : 'Nenhum chamado com este status.'}</p>
            ) : (
              <div className="admin-tickets-list">
                {visibleTickets.map((ticket) => {
                  const isSending = sendingTicketId === ticket.id;
                  const draft = ticketResponses[ticket.id] || '';
                  return (
                    <article key={ticket.id} className="admin-ticket">
                      <div className="admin-ticket-header">
                        <div>
                          <span>{ticket.studentName}</span>
                          <small>{ticket.courseTitle} · aberto em {formatTicketDate(ticket.createdAt)}</small>
                        </div>
                        <strong className={`ticket-status ${ticket.status}`}>{adminTicketStatusLabels[ticket.status]}</strong>
                      </div>
                      <h3>{ticket.subject}</h3>
                      <p>{ticket.message}</p>
                      {ticket.adminResponse && (
                        <div className="admin-ticket-existing-response">
                          <b>Resposta enviada</b>{ticket.respondedAt && <small> · {formatTicketDate(ticket.respondedAt)}</small>}
                          <p>{ticket.adminResponse}</p>
                        </div>
                      )}
                      {ticket.status !== 'closed' && (
                        <div className="admin-ticket-reply">
                          <textarea
                            aria-label={`Resposta para ${ticket.studentName}`}
                            placeholder={ticket.adminResponse ? 'Escreva uma nova resposta (substitui a anterior)' : 'Escreva uma resposta para o aluno'}
                            value={draft}
                            maxLength={ticketLimits.response.max}
                            onChange={(event) => setTicketResponses((previous) => ({ ...previous, [ticket.id]: event.target.value }))}
                            rows="3"
                            disabled={isSending}
                          />
                          <div>
                            <button type="button" className="admin-primary-action" onClick={() => updateSupportTicket(ticket.id, 'answered')} disabled={isSending || !draft.trim()}>
                              <Send size={15} aria-hidden="true" /> {isSending ? 'Enviando...' : 'Responder'}
                            </button>
                            <button type="button" className="admin-secondary-button" onClick={() => updateSupportTicket(ticket.id, 'closed')} disabled={isSending}>Encerrar</button>
                            <small className="admin-char-count">{draft.length}/{ticketLimits.response.max}</small>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      case 'settings':
        return <section className="admin-section"><AdminSectionHeader eyebrow="Sistema" title="Configurações" description="Resumo das configurações e integrações usadas pela plataforma." /><div className="settings-grid"><article className="settings-card"><span className="settings-icon settings-icon-purple"><MonitorCog size={18} aria-hidden="true" /></span><div><h3>Plataforma</h3><p>Ambiente principal de cursos</p></div><dl><div><dt>Nome</dt><dd>CursoLab</dd></div><div><dt>Catálogo</dt><dd>{managedCourses.length} cursos cadastrados</dd></div></dl></article><article className="settings-card"><span className="settings-icon settings-icon-blue"><ShieldCheck size={18} aria-hidden="true" /></span><div><h3>Acesso e segurança</h3><p>Autenticação de usuários</p></div><dl><div><dt>Login</dt><dd>E-mail e senha</dd></div><div><dt>Papel administrativo</dt><dd>Administrador</dd></div></dl></article><article className="settings-card settings-card-wide"><span className="settings-icon settings-icon-green"><CircleCheck size={18} aria-hidden="true" /></span><div><h3>Serviços conectados</h3><p>Componentes essenciais para o funcionamento da plataforma.</p></div><div className="service-status"><span><i />Banco de dados Supabase</span><span><i />API CursoLab</span><span><i />Autenticação de usuários</span></div></article></div></section>;
      default:
        return <h2>Visão Geral</h2>;
    }
  };

  return (
    <section className="admin-page" style={{ backgroundImage: `url(${backofficeBackground})` }}>
      <div className="container admin-shell">
        <div className="dashboard">
          <div className="sidebar">
          <div className="sidebar-brand"><div><small>CURSOLAB</small><h3>Administração</h3></div></div>
          <ul className="sidebar-menu">
            <li><button type="button" onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''}><span><LayoutDashboard size={16} aria-hidden="true" /></span>Visão geral</button></li>
            <li><button type="button" onClick={() => setActiveTab('my-courses')} className={activeTab === 'my-courses' ? 'active' : ''}><span><List size={16} aria-hidden="true" /></span>Todos os cursos</button></li>
            <li><button type="button" onClick={() => setActiveTab('new-course')} className={activeTab === 'new-course' ? 'active' : ''}><span><Plus size={16} aria-hidden="true" /></span>Criar curso</button></li>
            <li><button type="button" onClick={() => setActiveTab('manage-courses')} className={activeTab === 'manage-courses' ? 'active' : ''}><span><Pencil size={16} aria-hidden="true" /></span>Gerenciar cursos</button></li>
            <li><button type="button" onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'active' : ''}><span><TrendingUp size={16} aria-hidden="true" /></span>Análises</button></li>
            <li><button type="button" onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'active' : ''}><span><Settings size={16} aria-hidden="true" /></span>Configurações</button></li>
            <li><button type="button" onClick={() => setActiveTab('support')} className={activeTab === 'support' ? 'active' : ''}><span><MessageSquare size={16} aria-hidden="true" /></span>Chamados{ticketCounts.open > 0 && <em className="sidebar-badge" aria-label={`${ticketCounts.open} chamados abertos`}>{ticketCounts.open}</em>}</button></li>
          </ul>
        </div>
          <div className="dashboard-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfessorDashboardPage;
