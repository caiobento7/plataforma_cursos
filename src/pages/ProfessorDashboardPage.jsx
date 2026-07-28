import React, { useState } from 'react';
import CourseCard from '../components/CourseCard.jsx'; // Corrigido
import CreateCourseForm from '../components/CreateCourseForm.jsx'; // Corrigido

const ProfessorDashboardPage = ({ 
  navigateTo, 
  handleCreateCourse, 
  allCourses, 
  handleDeleteCourse,
  questions,
  onAnswerQuestion,
  activeTab: initialTab, 
  coursesContentDB 
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [replyText, setReplyText] = useState({}); 
  const [selectedQuestion, setSelectedQuestion] = useState(null); 

  const handleReplyChange = (questionId, text) => {
    setReplyText(prev => ({ ...prev, [questionId]: text }));
  };

  const handleReplySubmit = (questionId) => {
    if (!replyText[questionId]) return;
    onAnswerQuestion(questionId, replyText[questionId]);
    setReplyText(prev => ({ ...prev, [questionId]: '' })); 
    setSelectedQuestion(null); 
  };
  
  const myCourses = allCourses.filter(c => c.instructor === 'Professor (Logado)');
  
  const unansweredQuestions = questions.filter(q => !q.answer);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <h2>Visão Geral</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{myCourses.length}</div>
                <div className="stat-label">Meus Cursos Publicados</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">1.245</div>
                <div className="stat-label">Total de Alunos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">R$ 24.580</div>
                <div className="stat-label">Faturamento Total</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">4.7 ★</div>
                <div className="stat-label">Avaliação Média</div>
              </div>
            </div>
          </>
        );
      case 'my-courses':
        return (
          <>
            <h2>Meus Cursos</h2>
            <div className="course-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'}}>
              {myCourses.length > 0 ? (
                myCourses.map(course => (
                  <CourseCard key={course.id} course={course} navigateTo={navigateTo} />
                ))
              ) : (
                <p>Você ainda não criou nenhum curso.</p>
              )}
            </div>
          </>
        );
      case 'new-course':
        return (
          <>
            <h2>Criar Novo Curso (Etapa 1/2)</h2>
            <p>Preencha as informações básicas do seu novo curso.</p>
            <CreateCourseForm onCourseCreate={handleCreateCourse} />
          </>
        );
      case 'manage-courses':
        return (
          <>
            <h2>Gerenciar Todos os Cursos</h2>
            <p>Edite o conteúdo ou exclua cursos da plataforma.</p>
            <ul style={{listStyle: 'none', padding: 0}}>
              {allCourses.map(course => (
                <li key={course.id} className="card" style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '15px'
                }}>
                  <div>
                    <strong>{course.title}</strong>
                    <br/>
                    <small>{course.instructor}</small>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button className="btn" style={{backgroundColor: 'var(--primary-light)'}} onClick={() => navigateTo('editCourseMetadata', course.id)}>
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
          </>
        );
      case 'analytics':
        return (
          <>
            <h2>Análises</h2>
            <p>Acompanhe o desempenho de vendas e engajamento dos seus cursos.</p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">R$ 5.820</div>
                <div className="stat-label">Faturamento (Últimos 30 dias)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">152</div>
                <div className="stat-label">Novos Alunos (Últimos 30 dias)</div>
              </div>
            </div>
            <p>(Mais gráficos e relatórios detalhados apareceriam aqui)</p>
          </>
        );
      case 'questions':
        return (
          <>
            <h2>Dúvidas Pendentes</h2>
            {unansweredQuestions.length === 0 ? (
              <p>Nenhuma dúvida pendente. Ótimo trabalho!</p>
            ) : (
              <div className="card" style={{padding: '0'}}>
                {unansweredQuestions.map(q => {
                  const courseTitle = allCourses.find(c => c.id === q.courseId)?.title || 'Curso deletado';
                  const lessonTitle = Object.values(coursesContentDB).flatMap(m => m).flatMap(l => l.lessons).find(l => l.id === q.lessonId)?.title || 'Aula não encontrada';
                  
                  return (
                    <div 
                      key={q.id} 
                      className={`question-list-item ${selectedQuestion === q.id ? 'active' : ''}`}
                    >
                      <div onClick={() => setSelectedQuestion(selectedQuestion === q.id ? null : q.id)}>
                        <div className="question-header">
                          <div className="question-author">{q.author}</div>
                          <div className="question-date">{q.date}</div>
                        </div>
                        <small><strong>Curso:</strong> {courseTitle} | <strong>Aula:</strong> {lessonTitle}</small>
                        {selectedQuestion !== q.id && <p style={{marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{q.text}</p>}
                      </div>
                      
                      {selectedQuestion === q.id && (
                        <div className="question" style={{padding: '15px 0 0 0', border: 'none'}}>
                          <p style={{marginTop: '10px'}}>{q.text}</p>
                          <div className="form-group" style={{marginTop: '15px'}}>
                            <textarea 
                              rows="3" 
                              placeholder="Escreva sua resposta..."
                              value={replyText[q.id] || ''}
                              onChange={(e) => handleReplyChange(q.id, e.target.value)}
                            ></textarea>
                          </div>
                          <button className="btn btn-accent" onClick={() => handleReplySubmit(q.id)}>
                            Responder
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      case 'settings':
        return <h2>Configurações (Página Teste)</h2>;
      default:
        return <h2>Visão Geral</h2>;
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div className="sidebar">
          <h3>Painel do Instrutor</h3>
          <ul className="sidebar-menu">
            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }} className={activeTab === 'overview' ? 'active' : ''}>Visão Geral</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('my-courses'); }} className={activeTab === 'my-courses' ? 'active' : ''}>Meus Cursos</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('new-course'); }} className={activeTab === 'new-course' ? 'active' : ''}>Criar Novo Curso</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('manage-courses'); }} className={activeTab === 'manage-courses' ? 'active' : ''}>Gerenciar Cursos</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }} className={activeTab === 'analytics' ? 'active' : ''}>Análises</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('questions'); }} className={activeTab === 'questions' ? 'active' : ''}>Dúvidas</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }} className={activeTab === 'settings' ? 'active' : ''}>Configurações</a></li>
          </ul>
        </div>
        <div className="dashboard-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboardPage;