import React, { useState } from 'react';
import CourseCard from '../components/CourseCard.jsx';
import { calculateProgress } from '../utils/courseUtils.js';

const StudentDashboardPage = ({ navigateTo, purchasedCourses, courseProgress, coursesContentDB }) => {
    const [activeTab, setActiveTab] = useState('my-courses');
    const [tickets, setTickets] = useState([]);
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [ticketCourse, setTicketCourse] = useState('geral');
  
    const handleSupportSubmit = (e) => {
      e.preventDefault();
      if (!ticketSubject || !ticketMessage) return;
      
      const newTicket = {
        id: Date.now(),
        course: ticketCourse === 'geral' ? 'Geral/Plataforma' : purchasedCourses.find(c => c.id == ticketCourse)?.title,
        subject: ticketSubject,
        date: new Date().toLocaleDateString(),
        status: 'Aguardando Resposta'
      };
      setTickets(prev => [newTicket, ...prev]);
      setTicketCourse('geral');
      setTicketSubject('');
      setTicketMessage('');
    };
    
    const handleDownloadCertificate = () => {
      alert('Baixando certificado... (simulado)');
    };
  
    const renderTabContent = () => {
      switch (activeTab) {
        case 'my-courses':
          return (
            <>
              <h2>Meus Cursos</h2>
              {purchasedCourses.length === 0 ? (
                <p>Você ainda não se inscreveu em nenhum curso.</p>
              ) : (
                <div className="course-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'}}>
                  {purchasedCourses.map(course => {
                    const progress = calculateProgress(course.id, courseProgress, coursesContentDB[course.id]);
                    return (
                      <div key={course.id} className="course-card" onClick={() => navigateTo('player', course.id)}>
                        <img src={course.imageUrl} alt={course.title} className="course-image" />
                        <div className="course-info">
                          <div className="course-title">{course.title}</div>
                          <div className="course-instructor">{course.instructor}</div>
                          <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                          </div>
                          <p>{progress}% concluído</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        case 'certificates':
          return (
            <>
              <h2>Meus Certificados</h2>
              <p>Certificados são liberados após 60% de conclusão do curso.</p>
              <ul style={{listStyle: 'none', padding: 0}}>
                {purchasedCourses.map(course => {
                  const progress = calculateProgress(course.id, courseProgress, coursesContentDB[course.id]);
                  const isEligible = progress >= 60;
                  
                  return (
                    <li key={course.id} className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <h4>{course.title}</h4>
                        {isEligible ? (
                          <p style={{color: 'var(--success)', fontWeight: 600}}>Concluído ({progress}%)</p>
                        ) : (
                          <p style={{color: 'var(--text-light)'}}>Em andamento ({progress}%)</p>
                        )}
                      </div>
                      <button 
                        className="btn btn-success" 
                        onClick={handleDownloadCertificate}
                        disabled={!isEligible}
                        style={!isEligible ? {backgroundColor: 'var(--border)', cursor: 'not-allowed'} : {}}
                      >
                        Baixar PDF
                      </button>
                    </li>
                  );
                })}
                {purchasedCourses.length === 0 && (
                  <p>Você não possui cursos para gerar certificados.</p>
                )}
              </ul>
            </>
          );
        case 'support':
          return (
            <>
              <h2>Suporte</h2>
              <div className="card">
                <h3>Criar Novo Ticket</h3>
                <form onSubmit={handleSupportSubmit}>
                  <div className="form-group">
                    <label htmlFor="support-course">Tópico</label>
                    <select 
                      id="support-course" 
                      value={ticketCourse}
                      onChange={(e) => setTicketCourse(e.target.value)}
                    >
                      <option value="geral">Geral / Plataforma</option>
                      {purchasedCourses.map(course => (
                        <option key={course.id} value={course.id}>
                          Curso: {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="support-subject">Assunto</label>
                    <input 
                      type="text" 
                      id="support-subject" 
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="support-message">Descreva seu problema</label>
                    <textarea 
                      id="support-message" 
                      rows="5" 
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-accent">
                    Enviar Ticket
                  </button>
                </form>
              </div>
              
              <div className="card">
                <h3>Meus Tickets</h3>
                {tickets.length === 0 ? (
                  <p>Nenhum ticket aberto.</p>
                ) : (
                  <ul style={{listStyle: 'none', padding: 0}}>
                    {tickets.map(ticket => (
                      <li key={ticket.id} style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 0', 
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <div>
                          <strong>{ticket.subject}</strong>
                          <br/>
                          <small>Tópico: {ticket.course} | Aberto em: {ticket.date}</small>
                        </div>
                        <span style={{color: 'var(--warning)', fontWeight: 600}}>{ticket.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          );
        default:
          return <h2>Meus Cursos</h2>;
      }
    };
  
    return (
      <div className="container">
        <div className="dashboard">
          <div className="sidebar">
            <h3>Painel do Aluno</h3>
            <ul className="sidebar-menu">
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('my-courses'); }} className={activeTab === 'my-courses' ? 'active' : ''}>Meus Cursos</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('certificates'); }} className={activeTab === 'certificates' ? 'active' : ''}>Certificados</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('support'); }} className={activeTab === 'support' ? 'active' : ''}>Suporte</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Configurações</a></li>
            </ul>
          </div>
          <div className="dashboard-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    );
  };
  
  export default StudentDashboardPage;