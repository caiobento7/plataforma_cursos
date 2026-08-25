import { useState } from 'react';
import loginBackground from '../assets/login-background.png';
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

const LoginPage = ({ initialTab = 'login', onAuthenticated, onLoginComplete }) => {
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

  const renderForm = () => {
    if (isRecovery) {
      return (
        <form onSubmit={handlePasswordUpdate}>
          <h2>Crie uma nova senha</h2>
          <p className="auth-description">Escolha uma senha segura com pelo menos 6 caracteres.</p>
          <div className="form-group"><label htmlFor="new-password">Nova senha</label><input type="password" id="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" required /></div>
          <div className="form-group"><label htmlFor="password-confirmation">Confirmar nova senha</label><input type="password" id="password-confirmation" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} minLength="6" required /></div>
          {feedback && <p className="auth-feedback">{feedback}</p>}
          <button type="submit" className="btn btn-accent" style={{ width: '100%' }} disabled={isSubmitting}>{isSubmitting ? 'Aguarde...' : 'Atualizar senha'}</button>
        </form>
      );
    }

    if (isRecoveryRequest) {
      return (
        <form onSubmit={handlePasswordRecovery}>
          <h2>Redefinir senha</h2>
          <p className="auth-description">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
          <div className="form-group"><label htmlFor="recovery-email">E-mail</label><input type="email" id="recovery-email" value={email} onChange={(event) => updateEmail(event.target.value)} required /></div>
          {feedback && <p className="auth-feedback">{feedback}</p>}
          <button type="submit" className="btn btn-accent" style={{ width: '100%' }} disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}</button>
          <button type="button" className="auth-back-link" onClick={() => changeMode('login')}>Voltar para entrar</button>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        <h2>{isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}</h2>
        {isRegister && <div className="form-group"><label htmlFor="reg-name">Nome completo</label><input id="reg-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div>}
        <div className="form-group"><label htmlFor="auth-email">E-mail</label><input type="email" id="auth-email" value={email} onChange={(event) => updateEmail(event.target.value)} required /></div>
        <div className="form-group"><label htmlFor="auth-password">Senha</label><input type="password" id="auth-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" required /></div>
        {isLogin && <button type="button" className="auth-recovery-link" onClick={() => changeMode('requestRecovery')}>Esqueci minha senha</button>}
        {feedback && <p className="auth-feedback">{feedback}</p>}
        <button type="submit" className="btn btn-accent" style={{ width: '100%' }} disabled={isSubmitting}>{isSubmitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}</button>
      </form>
    );
  };

  return (
    <section className="auth-page" style={{ backgroundImage: `url(${loginBackground})` }}>
      <div className="card form-container auth-card">
        {!isRecovery && !isRecoveryRequest && <div className="form-toggle">
          <button type="button" className={isLogin ? 'active' : ''} onClick={() => changeMode('login')}>Entrar</button>
          <button type="button" className={isRegister ? 'active' : ''} onClick={() => changeMode('register')}>Cadastrar</button>
        </div>}
        {renderForm()}
      </div>
    </section>
  );
};

export default LoginPage;
