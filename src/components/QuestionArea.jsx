import React, { useState } from 'react';

// --- CORREÇÃO: Adiciona um array vazio como valor padrão para 'questions' ---
const QuestionArea = ({ courseId, lessonId, questions = [], onAskQuestion }) => {
// --- FIM DA CORREÇÃO ---
  const [questionText, setQuestionText] = useState('');
  
  const lessonQuestions = questions
    .filter(q => q.courseId === courseId && q.lessonId === lessonId)
    .sort((a, b) => b.id - a.id); 

  const handleSubmit = (e) => {
      e.preventDefault();
      if (!questionText.trim()) return;
      
      onAskQuestion({
        courseId,
        lessonId,
        text: questionText
      });
      setQuestionText('');
    };
  
    return (
      <div className="card">
        <h2>Área de Dúvidas</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea 
              placeholder="Faça sua pergunta sobre esta aula..." 
              rows="4"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            ></textarea>
          </div>
          <button className="btn" type="submit">Enviar Pergunta</button>
        </form>
        
        <div style={{ marginTop: '30px' }}>
          <h3>Dúvidas de outros alunos</h3>
          {lessonQuestions.length === 0 ? (
            <p>Seja o primeiro a perguntar!</p>
          ) : (
            lessonQuestions.map(q => (
              <div className="question" key={q.id}>
                <div className="question-header">
                  <div className="question-author">{q.author}</div>
                  <div className="question-date">{q.date}</div>
                </div>
                <p>{q.text}</p>
                
                {q.answer && (
                  <div className="answer">
                    <div className="question-header">
                      <div className="question-author">{q.answer.author}</div>
                      <div className="question-date">{q.answer.date}</div>
                    </div>
                    <p>{q.answer.text}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  export default QuestionArea;