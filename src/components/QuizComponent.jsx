import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

const QuizComponent = ({ quizData, alreadyPassed = false, onQuizPass, onProceed }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const questions = quizData?.questions || [];
  const passMark = quizData?.passMark ?? 70;

  if (questions.length === 0) {
    return <div className="qz-empty">As perguntas deste quiz ainda não foram publicadas.</div>;
  }

  const correctAnswers = questions.filter((question) => selectedAnswers[question.id] === question.correct).length;
  const score = Math.round((correctAnswers / questions.length) * 100);
  const passed = score >= passMark;
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswer = Boolean(selectedAnswers[currentQuestion.id]);

  const handleSubmit = () => {
    setShowResults(true);
    if (score >= passMark) onQuizPass();
  };

  const restart = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  };

  if (showResults) {
    return (
      <div className={`qz-result ${passed ? 'passed' : 'failed'}`}>
        {passed ? <CheckCircle2 size={44} aria-hidden="true" /> : <XCircle size={44} aria-hidden="true" />}
        <span className="qz-score">{score}%</span>
        <h2>{passed ? 'Aprovado! Próximo módulo liberado.' : 'Ainda não foi desta vez'}</h2>
        <p>Você acertou {correctAnswers} de {questions.length} perguntas. A nota mínima é {passMark}%.</p>
        <div className="qz-actions">
          {passed
            ? <button type="button" className="ui-btn ui-btn-primary" onClick={onProceed}>Continuar <ArrowRight size={16} aria-hidden="true" /></button>
            : <button type="button" className="ui-btn ui-btn-primary" onClick={restart}><RotateCcw size={16} aria-hidden="true" /> Tentar novamente</button>}
          {passed && <button type="button" className="ui-btn ui-btn-secondary" onClick={restart}>Refazer quiz</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="qz">
      <div className="qz-head">
        <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
        <span>{alreadyPassed ? 'Você já foi aprovado neste quiz' : `Nota mínima: ${passMark}%`}</span>
      </div>
      <div className="qz-steps" aria-hidden="true">
        {questions.map((question, index) => (
          <i key={question.id} className={index === currentQuestionIndex ? 'current' : selectedAnswers[question.id] ? 'answered' : ''} />
        ))}
      </div>
      <h2 className="qz-question">{currentQuestion.text}</h2>
      <div className="qz-options" role="radiogroup" aria-label={currentQuestion.text}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswers[currentQuestion.id] === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`qz-option ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedAnswers((previous) => ({ ...previous, [currentQuestion.id]: option }))}
            >
              <b>{String.fromCharCode(65 + index)}</b>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      <div className="qz-actions">
        <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setCurrentQuestionIndex((index) => index - 1)} disabled={currentQuestionIndex === 0}>
          <ArrowLeft size={16} aria-hidden="true" /> Anterior
        </button>
        {isLastQuestion ? (
          <button type="button" className="ui-btn ui-btn-primary" onClick={handleSubmit} disabled={Object.keys(selectedAnswers).length < questions.length}>Finalizar quiz</button>
        ) : (
          <button type="button" className="ui-btn ui-btn-primary" onClick={() => setCurrentQuestionIndex((index) => index + 1)} disabled={!hasAnswer}>
            Próxima <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;
