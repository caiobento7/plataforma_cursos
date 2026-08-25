import { useState } from 'react';
import { Search, ShoppingBag, X } from 'lucide-react';
import cursoLabMark from '../assets/cursolab-mark.png';

const Header = ({ navigateTo, cartItemCount, searchTerm, setSearchTerm, suggestions, onSuggestionClick, currentUser, onSignOut }) => {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRole = currentUser?.role === 'admin' ? 'Administrador(a)' : 'Aluno(a)';
  const firstName = currentUser?.full_name?.split(' ')[0] || 'Conta';

  return (
    <header>
      <div className="container header-content">
        <button className="logo" type="button" onClick={() => navigateTo(currentUser?.role === 'admin' ? 'dashboard' : 'home')}>
          <span className="logo-mark"><img src={cursoLabMark} alt="" /></span>
          <span>Curso<span>Lab</span></span>
        </button>

        <div className="search-bar">
          <Search className="search-icon" size={18} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar cursos..."
            aria-label="Buscar cursos"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {suggestions && suggestions.length > 0 && searchTerm && (
            <div className="autocomplete-suggestions">
              {suggestions.map((course) => (
                <button key={course.id} type="button" className="suggestion-item" onClick={() => onSuggestionClick(course)}>
                  {course.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="user-menu" aria-label="Navegação principal">
          {currentUser?.role === 'student' && <button type="button" onClick={() => navigateTo('studentDashboard')}>Painel do aluno</button>}
          {currentUser ? (
            <div className="account-menu">
              <button
                type="button"
                className="header-user"
                onClick={() => setIsAccountOpen((isOpen) => !isOpen)}
                aria-expanded={isAccountOpen}
                aria-haspopup="dialog"
                aria-label="Abrir dados da conta"
              >
                <span className="account-trigger-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
                <span>{firstName}</span>
              </button>
              {isAccountOpen && (
                <div className="account-preview" role="dialog" aria-label="Dados da conta">
                  <span className="account-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
                  <div className="account-preview-details">
                    <strong>{currentUser.full_name}</strong>
                    <span>{currentUser.email || 'E-mail não disponível'}</span>
                    <small>{accountRole}</small>
                  </div>
                  <button type="button" className="account-close" onClick={() => setIsAccountOpen(false)} aria-label="Fechar dados da conta"><X size={16} aria-hidden="true" /></button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => navigateTo('login')} className="header-login">Entrar</button>
          )}
          {currentUser && <button type="button" onClick={onSignOut} className="header-logout">Sair</button>}
          {currentUser?.role === 'student' && <button type="button" onClick={() => navigateTo('cart')} className="cart-icon" aria-label="Carrinho">
            <ShoppingBag size={21} strokeWidth={2} aria-hidden="true" />
            {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
          </button>}
        </nav>
      </div>
    </header>
  );
};

export default Header;
