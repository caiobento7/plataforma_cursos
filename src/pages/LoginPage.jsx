import React, { useState } from 'react';

const LoginPage = ({ navigateTo, initialTab = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialTab === 'login');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      alert(isLogin ? 'Login realizado com sucesso! (simulado)' : 'Cadastro realizado com sucesso! (simulado)');
      navigateTo('home');
    };
  
    return (
      <div className="container">
        <div className="card form-container">
          <div className="form-toggle">
            <button
              className={isLogin ? 'active' : ''}
              onClick={() => setIsLogin(true)}
            >
              Entrar
            </button>
            <button
              className={!isLogin ? 'active' : ''}
              onClick={() => setIsLogin(false)}
            >
              Cadastrar
            </button>
          </div>
          
          {isLogin ? (
            <form onSubmit={handleSubmit}>
              <h2>Entrar na sua conta</h2>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input type="email" id="login-email" required />
              </div>
              <div className="form-group">
                <label htmlFor="login-pass">Senha</label>
                <input type="password" id="login-pass" required />
              </div>
              <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>Entrar</button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2>Criar nova conta</h2>
              <div className="form-group">
                <label htmlFor="reg-name">Nome Completo</label>
                <input type="text" id="reg-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input type="email" id="reg-email" required />
              </div>
              <div className="form-group">
                <label htmlFor="reg-pass">Senha</label>
                <input type="password" id="reg-pass" required />
              </div>
              <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>Criar Conta</button>
            </form>
          )}
          
        </div>
      </div>
    );
  };

  export default LoginPage;