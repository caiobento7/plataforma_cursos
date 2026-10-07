import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import cursoLabMark from '../assets/cursolab-mark.png';
import { api } from '../services/api.js';

const getRecoveryLinkData = () => {
  const query = new URLSearchParams(window.location.search);
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  return {
    accessToken: fragment.get('access_token'),
    code: query.get('code'),
    error: fragment.get('error_description') || query.get('error_description'),
  };
};

const LoginPage = ({ navigateTo, initialTab = 'login', onAuthenticated, onLoginComplete }) => {
  const initialMode = initialTab === 'recovery' ? 'recovery' : initialTab === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [feedback, setFeedback] = useState(() => {
    const { error } = getRecoveryLinkData();
    return error ? `Não foi possível validar este link: ${error}` : '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isRecoveryRequest = mode === 'requestRecovery';
  const isRecovery = mode === 'recovery';

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setFeedback('');
    setPassword('');
    setPasswordConfirmation('');
  };

  const updateEmail = (value) => {
    setEmail(value);
    setFeedback('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const session = await api.login(email, password);
        const profile = await onAuthenticated(session);
        onLoginComplete(profile);
      } else {
        await api.register(fullName, email, password);
        setMode('login');
        setPassword('');
        setFeedback('Cadastro concluído. Entre com seu e-mail e senha.');
      }
    } catch (requestError) {
      setFeedback(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordRecovery = async (event) => {
    event.preventDefault();
    setFeedback('');
    setIsSubmitting(true);

    try {
      const response = await api.requestPasswordRecovery(email);
      setFeedback(response.message);
    } catch (requestError) {
      setFeedback(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setFeedback('');

    if (password !== passwordConfirmation) {
      setFeedback('As senhas não coincidem.');
      return;
    }

    const recoveryLink = getRecoveryLinkData();
    if (recoveryLink.error) {
      setFeedback('Este link de recuperação é inválido ou expirou. Solicite um novo link.');
      return;
    }

    if (!recoveryLink.accessToken && !recoveryLink.code) {
      setFeedback('Este link de recuperação é inválido ou expirou. Solicite um novo link.');
      return;
    }

    setIsSubmitting(true);
    try {
      const recoveryToken = recoveryLink.accessToken || (await api.exchangeRecoveryCode(recoveryLink.code)).accessToken;
      await api.updatePassword(password, recoveryToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      setMode('login');
      setPassword('');
      setPasswordConfirmation('');
      setFeedback('Senha atualizada. Agora entre com sua nova senha.');
    } catch (requestError) {
      setFeedback(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // As mensagens de sucesso e de erro compartilham o mesmo estado; o tom da
  // caixa é escolhido pelo conteúdo.
  const feedbackTone = /concluído|atualizada|receberá/i.test(feedback) ? 'success' : 'error';
  const renderFeedback = () => (feedback ? <p className={`ui-alert ${feedbackTone}`} role="status">{feedback}</p> : null);

  const renderForm = () => {
    if (isRecovery) {
      return (
        <form onSubmit={handlePasswordUpdate}>
          <h1>Crie uma nova senha</h1>
          <p>Escolha uma senha segura com pelo menos 6 caracteres.</p>
          <div className="ui-field"><label htmlFor="new-password">Nova senha</label><input className="ui-input" type="password" id="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" autoComplete="new-password" required /></div>
          <div className="ui-field"><label htmlFor="password-confirmation">Confirmar nova senha</label><input className="ui-input" type="password" id="password-confirmation" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} minLength="6" autoComplete="new-password" required /></div>
          {renderFeedback()}
          <button type="submit" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" disabled={isSubmitting}>{isSubmitting ? 'Aguarde...' : 'Atualizar senha'}</button>
        </form>
      );
    }

    if (isRecoveryRequest) {
      return (
        <form onSubmit={handlePasswordRecovery}>
          <h1>Redefinir senha</h1>
          <p>Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
          <div className="ui-field"><label htmlFor="recovery-email">E-mail</label><input className="ui-input" type="email" id="recovery-email" value={email} onChange={(event) => updateEmail(event.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></div>
          {renderFeedback()}
          <button type="submit" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}</button>
          <p className="ui-auth-switch"><button type="button" className="ui-auth-link" onClick={() => changeMode('login')}>Voltar para entrar</button></p>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        <div className="ui-auth-tabs" role="tablist" aria-label="Entrar ou criar conta">
          <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'active' : ''} onClick={() => changeMode('login')}>Entrar</button>
          <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'active' : ''} onClick={() => changeMode('register')}>Criar conta</button>
        </div>
        <h1>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h1>
        <p>{isLogin ? 'Entre para continuar seus estudos.' : 'Leva menos de um minuto e é gratuito.'}</p>
        {isRegister && <div className="ui-field"><label htmlFor="reg-name">Nome completo</label><input className="ui-input" id="reg-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Como deve aparecer no certificado" autoComplete="name" required /></div>}
        <div className="ui-field"><label htmlFor="auth-email">E-mail</label><input className="ui-input" type="email" id="auth-email" value={email} onChange={(event) => updateEmail(event.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></div>
        <div className="ui-field"><label htmlFor="auth-password">Senha</label><input className="ui-input" type="password" id="auth-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" placeholder={isRegister ? 'Mínimo de 6 caracteres' : ''} autoComplete={isLogin ? 'current-password' : 'new-password'} required /></div>
        {isLogin && <div className="ui-auth-row"><button type="button" className="ui-auth-link" onClick={() => changeMode('requestRecovery')}>Esqueci minha senha</button></div>}
        {renderFeedback()}
        <button type="submit" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" disabled={isSubmitting}>{isSubmitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}</button>
        <p className="ui-auth-switch">
          {isLogin ? 'Ainda não tem conta? ' : 'Já tem uma conta? '}
          <button type="button" className="ui-auth-link" onClick={() => changeMode(isLogin ? 'register' : 'login')}>{isLogin ? 'Criar conta grátis' : 'Entrar'}</button>
        </p>
      </form>
    );
  };

  return (
    <section className="ui-auth">
      <aside className="ui-auth-brand">
        <button type="button" className="ui-logo" onClick={() => navigateTo('landing')}><img src={cursoLabMark} alt="" /><span>Curso<b>Lab</b></span></button>
        <div>
          <h2>Sua próxima aula começa aqui.</h2>
          <p>Entre para continuar seus cursos, acompanhar o progresso e emitir seus certificados.</p>
          <ul>
            <li><CheckCircle2 size={18} aria-hidden="true" /> Aulas em vídeo e material de apoio</li>
            <li><CheckCircle2 size={18} aria-hidden="true" /> Quizzes que liberam o próximo módulo</li>
            <li><CheckCircle2 size={18} aria-hidden="true" /> Certificado em PDF ao concluir</li>
          </ul>
        </div>
        <small>© {new Date().getFullYear()} CursoLab</small>
      </aside>
      <div className="ui-auth-main">
        <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm ui-auth-back" onClick={() => navigateTo('landing')}><ArrowLeft size={16} aria-hidden="true" /> Voltar ao início</button>
        <div className="ui-auth-form">{renderForm()}</div>
      </div>
    </section>
  );
};

export default LoginPage;
