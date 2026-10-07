import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const emptyOptions = ['', '', '', ''];

const MiniQuizEditor = ({ initialQuiz, submitLabel = 'Salvar Aula de Quiz', onSaveQuiz }) => {
  const [questions, setQuestions] = useState(() => initialQuiz?.questions?.map((question) => ({ ...question })) || []);
  const [passMark, setPassMark] = useState(() => String(initialQuiz?.passMark ?? 70));
  const [newQText, setNewQText] = useState('');
  const [newOptions, setNewOptions] = useState(emptyOptions);
  const [newCorrect, setNewCorrect] = useState(0);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newOptions];
    updatedOptions[index] = value;
    setNewOptions(updatedOptions);
  };

  const handleAddQuestion = (event) => {
    event.preventDefault();
    const options = newOptions.map((option) => option.trim());
    if (!newQText.trim() || options.some((option) => !option)) {
      alert('Preencha a pergunta e todas as 4 opções.');
      return;
    }
    if (new Set(options).size !== options.length) {
      alert('As opções de uma pergunta precisam ser diferentes entre si.');
      return;
    }

    setQuestions((previous) => [...previous, {
      id: `nova-${Date.now()}`,
      text: newQText.trim(),
      options,
      correct: options[newCorrect],
    }]);
    setNewQText('');
    setNewOptions(emptyOptions);
    setNewCorrect(0);
  };

  const handleRemoveQuestion = (questionId) => {
    setQuestions((previous) => previous.filter((question) => question.id !== questionId));
  };

  const handleSaveFullQuiz = () => {
    const numericPassMark = Number(passMark);
    if (questions.length === 0) {
      alert('Adicione pelo menos uma pergunta ao quiz.');
      return;
    }
    if (!Number.isInteger(numericPassMark) || numericPassMark < 0 || numericPassMark > 100) {
      alert('A nota mínima deve ser um número inteiro entre 0 e 100.');
      return;
    }
    onSaveQuiz({ passMark: numericPassMark, questions });
  };

  return (
    <div className="quiz-editor-form">
      <h5>Editor de Quiz</h5>

      <div className="form-group">
        <label>Nota mínima para aprovação (%)</label>
        <input type="number" min="0" max="100" step="1" value={passMark} onChange={(event) => setPassMark(event.target.value)} />
      </div>

      {questions.length > 0 && (
        <div>
          <strong>Perguntas do quiz:</strong>
          {questions.map((question, index) => (
            <div key={question.id} className="quiz-question-added">
              <div>
                <span>{index + 1}. {question.text}</span>
                <small>Gabarito: {question.correct}</small>
              </div>
              <button type="button" className="quiz-question-remove" title="Remover pergunta" onClick={() => handleRemoveQuestion(question.id)}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '15px' }}>
        <div className="form-group">
          <label>Texto da Pergunta</label>
          <input type="text" value={newQText} onChange={(event) => setNewQText(event.target.value)} />
        </div>

        <label>Opções (Marque a correta)</label>
        {newOptions.map((option, index) => (
          <div key={index} className="quiz-option-input">
            <input type="radio" name="correct-answer" checked={newCorrect === index} onChange={() => setNewCorrect(index)} />
            <input type="text" placeholder={`Opção ${index + 1}`} value={option} onChange={(event) => handleOptionChange(index, event.target.value)} />
          </div>
        ))}
        <button type="button" onClick={handleAddQuestion} className="btn" style={{ width: '100%', marginTop: '10px' }}>
          + Adicionar Pergunta ao Quiz
        </button>
      </div>

      <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

      <button type="button" className="btn btn-success" style={{ width: '100%' }} onClick={handleSaveFullQuiz}>
        {submitLabel}
      </button>
    </div>
  );
};

export default MiniQuizEditor;
