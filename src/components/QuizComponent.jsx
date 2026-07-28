import React, { useState, useEffect } from 'react';

const QuizComponent = ({ quizData, onQuizPass, onProceed }) => {
    const quiz = quizData; // Recebe o objeto quizData diretamente
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
  
    useEffect(() => {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
    }, [quizData]);
  
    const handleOptionSelect = (questionId, option) => {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: option
      }));
    };
  
    const handleSubmit = () => {
      setShowResults(true);
      
      let correctAnswers = 0;
      quiz.questions.forEach(q => {
        if (selectedAnswers[q.id] === q.correct) {
          correctAnswers++;
        }
      });
      
      const score = (correctAnswers / quiz.questions.length) * 100;
      
      if (score >= quiz.passMark) {
        onQuizPass();
      }
    };
  
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return <div className="quiz-container"><h2>Professor ainda não adicionou perguntas a este quiz.</h2></div>;
    }
  
    if (showResults) {
      const correctAnswers = quiz.questions.reduce((count, q) => {
        return selectedAnswers[q.id] === q.correct ? count + 1 : count;
      }, 0);
      const score = (correctAnswers / quiz.questions.length) * 100;
      const passed = score >= quiz.passMark;
  
      return (
        <div className="quiz-results">
          <h2>Quiz Finalizado!</h2>
          <p>Você acertou {correctAnswers} de {quiz.questions.length} questões.</p>
          <p style={{ fontWeight: 700, color: passed ? 'var(--success)' : 'var(--danger)' }}>
            Sua pontuação: {score.toFixed(0)}%
          </p>
          {passed ? (
            <>
              <p>Parabéns, você foi aprovado e desbloqueou o próximo módulo!</p>
              <button className="btn btn-success" onClick={onProceed} style={{marginRight: '10px'}}>
                Prosseguir para Próximo Módulo
              </button>
            </>
          ) : (
            <p>Você não atingiu a nota mínima (70%). Por favor, revise o conteúdo e tente novamente.</p>
          )}
          <button className="btn" onClick={() => {
            setShowResults(false);
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
          }}>
            Tentar Novamente
          </button>
        </div>
      );
    }
  
    const currentQuestion = quiz.questions[currentQuestionIndex];
  
    return (
      <div className="quiz-container">
        <p>Pergunta {currentQuestionIndex + 1} de {quiz.questions.length}</p>
        <div className="quiz-question">{currentQuestion.text}</div>
        <div className="quiz-options">
          {currentQuestion.options.map(option => (
            <label 
              key={option} 
              className={`quiz-option ${selectedAnswers[currentQuestion.id] === option ? 'selected' : ''}`}
            >
              <input 
                type="radio" 
                name={currentQuestion.id} 
                value={option}
                checked={selectedAnswers[currentQuestion.id] === option}
                onChange={() => handleOptionSelect(currentQuestion.id, option)}
                style={{ display: 'none' }} 
              />
              {option}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button 
            className="btn" 
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Anterior
          </button>
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button 
              className="btn btn-accent" 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Próxima
            </button>
          ) : (
            <button 
              className="btn btn-success" 
              onClick={handleSubmit}
            >
              Finalizar Quiz
            </button>
          )}
        </div>
      </div>
    );
  };

  export default QuizComponent;