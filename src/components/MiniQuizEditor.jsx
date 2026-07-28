import React, { useState } from 'react';

const MiniQuizEditor = ({ onSaveQuiz }) => {
    const [questions, setQuestions] = useState([]);
    const [newQText, setNewQText] = useState('');
    const [newOptions, setNewOptions] = useState(['', '', '', '']);
    const [newCorrect, setNewCorrect] = useState(0);
  
    const handleOptionChange = (index, value) => {
      const updatedOptions = [...newOptions];
      updatedOptions[index] = value;
      setNewOptions(updatedOptions);
    };
  
    const handleAddQuestion = (e) => {
      e.preventDefault();
      if (!newQText || newOptions.some(opt => !opt)) {
        alert('Preencha a pergunta e todas as 4 opções.');
        return;
      }
      
      const newQuestion = {
        id: `q-${questions.length + 1}`,
        text: newQText,
        options: newOptions,
        correct: newOptions[newCorrect] 
      };
      
      setQuestions(prev => [...prev, newQuestion]);
      setNewQText('');
      setNewOptions(['', '', '', '']);
      setNewCorrect(0);
    };
  
    const handleSaveFullQuiz = () => {
      if (questions.length === 0) {
        alert('Adicione pelo menos uma pergunta ao quiz.');
        return;
      }
      const quizData = {
        passMark: 70, 
        questions: questions
      };
      onSaveQuiz(quizData); 
    };
    
    return (
      <div className="quiz-editor-form">
        <h5>Editor de Quiz</h5>
        {questions.length > 0 && (
          <div>
            <strong>Perguntas Adicionadas:</strong>
            {questions.map((q, i) => (
              <div key={q.id} className="quiz-question-added">
                <span>{i + 1}. {q.text}</span>
                <small>Gabarito: {q.correct}</small>
              </div>
            ))}
          </div>
        )}
        
        {/* --- CORREÇÃO: Trocado <form> por <div> --- */}
        <div style={{marginTop: '15px'}}>
          <div className="form-group">
            <label>Texto da Pergunta</label>
            <input type="text" value={newQText} onChange={(e) => setNewQText(e.target.value)} />
          </div>
          
          <label>Opções (Marque a correta)</label>
          {newOptions.map((opt, i) => (
            <div key={i} className="quiz-option-input">
              <input 
                type="radio" 
                name="correct-answer" 
                checked={newCorrect === i}
                onChange={() => setNewCorrect(i)}
              />
              <input 
                type="text" 
                placeholder={`Opção ${i + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
              />
            </div>
          ))}
          <button 
            type="button" 
            onClick={handleAddQuestion} 
            className="btn" 
            style={{width: '100%', marginTop: '10px'}}
          >
            + Adicionar Pergunta ao Quiz
          </button>
        </div>
        {/* --- FIM DA CORREÇÃO --- */}
        
        <hr style={{margin: '15px 0', border: 'none', borderTop: '1px solid var(--border)'}}/>
        
        <button 
          type="button" 
          className="btn btn-success" 
          style={{width: '100%'}}
          onClick={handleSaveFullQuiz}
        >
          Salvar Aula de Quiz
        </button>
      </div>
    );
  };

  export default MiniQuizEditor;