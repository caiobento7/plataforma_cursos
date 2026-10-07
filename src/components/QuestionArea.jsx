import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { api } from '../services/api.js';

const maxQuestionLength = 1000;

const formatDate = (value) => (value
  ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  : '');

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';

// Dúvidas da aula: o aluno pergunta e vê as perguntas da turma com as respostas
// do instrutor. Os dados vêm de GET/POST /api/lessons/:lessonId/questions.
const QuestionArea = ({ lessonId }) => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      setQuestions(await api.getLessonQuestions(lessonId));
    } catch (error) {
      setLoadError(error.message || 'Não foi possível carregar as dúvidas.');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const question = text.trim();
    if (question.length < 5) {
      setFeedback({ type: 'error', text: 'Escreva sua dúvida com pelo menos 5 caracteres.' });
      return;
    }

    setIsSending(true);
    setFeedback(null);
    try {
      await api.askLessonQuestion(lessonId, question);
      setText('');
      setFeedback({ type: 'success', text: 'Dúvida enviada. O instrutor responderá por aqui.' });
      await loadQuestions();
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="qa">
      <div className="qa-head">
        <h2>Dúvidas da aula</h2>
        {!isLoading && questions.length > 0 && <span>{questions.length}</span>}
      </div>

      <form className="qa-form" onSubmit={handleSubmit}>
        <label htmlFor={`qa-${lessonId}`} className="sr-only">Sua dúvida sobre esta aula</label>
        <textarea
          id={`qa-${lessonId}`}
          className="ui-input"
          rows="3"
          maxLength={maxQuestionLength}
          placeholder="Ficou com alguma dúvida sobre esta aula? Pergunte aqui."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="qa-form-footer">
          <small>{text.length}/{maxQuestionLength}</small>
          <button type="submit" className="ui-btn ui-btn-primary ui-btn-sm" disabled={isSending || !text.trim()}>{isSending ? 'Enviando...' : 'Enviar dúvida'}</button>
        </div>
        {feedback && <p className={`ui-alert ${feedback.type}`} role="status">{feedback.text}</p>}
      </form>

      {loadError && <p className="ui-alert error">{loadError}</p>}
      {isLoading ? (
        <p className="ui-muted">Carregando dúvidas...</p>
      ) : questions.length === 0 && !loadError ? (
        <div className="qa-empty"><MessageCircle size={22} aria-hidden="true" /><span>Nenhuma dúvida ainda. Seja o primeiro a perguntar.</span></div>
      ) : (
        <ul className="qa-list">
          {questions.map((question) => (
            <li key={question.id}>
              <span className="qa-avatar" aria-hidden="true">{initials(question.author)}</span>
              <div>
                <div className="qa-meta"><strong>{question.author}</strong><small>{formatDate(question.date)}</small></div>
                <p>{question.text}</p>
                {question.answer ? (
                  <div className="qa-answer">
                    <div className="qa-meta"><strong>{question.answer.author}</strong><span className="qa-badge">Instrutor</span><small>{formatDate(question.answer.date)}</small></div>
                    <p>{question.answer.text}</p>
                  </div>
                ) : (
                  <small className="qa-waiting">Aguardando resposta do instrutor</small>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default QuestionArea;
