import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { api } from '../services/api.js';

// As respostas são corrigidas pela API (POST /api/lessons/:id/quiz-attempt):
// o gabarito não chega ao navegador.
const QuizComponent = ({ lessonId, quizData, alreadyPassed = false, onQuizPass, onProceed }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const questions = quizData?.questions || [];
  const passMark = quizData?.passMark ?? 70;

  if (questions.length === 0) {
    return <div className="qz-empty">As perguntas deste quiz ainda não foram publicadas.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswer = Boolean(selectedAnswers[currentQuestion.id]);
  const allAnswered = questions.every((question) => selectedAnswers[question.id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const attempt = await api.submitQuiz(lessonId, selectedAnswers);
      setResult(attempt);
      if (attempt.passed) onQuizPass();
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível enviar suas respostas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const restart = () => {
    setResult(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  };

  if (result) {
    return (
      <div className={`qz-result ${result.passed ? 'passed' : 'failed'}`}>
        {result.passed ? <CheckCircle2 size={44} aria-hidden="true" /> : <XCircle size={44} aria-hidden="true" />}
        <span className="qz-score">{result.score}%</span>
        <h2>{result.passed ? 'Aprovado! Próximo módulo liberado.' : 'Ainda não foi desta vez'}</h2>
        <p>Você acertou {result.correctAnswers} de {result.totalQuestions} perguntas. A nota mínima é {result.passMark}%.</p>
        <div className="qz-actions">
          {result.passed
            ? <button type="button" className="ui-btn ui-btn-primary" onClick={onProceed}>Continuar <ArrowRight size={16} aria-hidden="true" /></button>
            : <button type="button" className="ui-btn ui-btn-primary" onClick={restart}><RotateCcw size={16} aria-hidden="true" /> Tentar novamente</button>}
          {result.passed && <button type="button" className="ui-btn ui-btn-secondary" onClick={restart}>Refazer quiz</button>}
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
      {error && <p className="ui-alert error" role="alert" style={{ marginTop: 16 }}>{error}</p>}
      <div className="qz-actions">
        <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setCurrentQuestionIndex((index) => index - 1)} disabled={currentQuestionIndex === 0}>
          <ArrowLeft size={16} aria-hidden="true" /> Anterior
        </button>
        {isLastQuestion ? (
          <button type="button" className="ui-btn ui-btn-primary" onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>{isSubmitting ? 'Corrigindo...' : 'Finalizar quiz'}</button>
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
