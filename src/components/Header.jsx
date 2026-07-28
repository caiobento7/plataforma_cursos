import React from 'react';

const Header = ({ navigateTo, cartItemCount, searchTerm, setSearchTerm, suggestions, onSuggestionClick }) => (
  <header>
    <div className="container header-content">
      <div className="logo" onClick={() => navigateTo('home')}>
        Plataforma de Cursos
      </div>
      
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* --- CORREÇÃO: Adiciona verificação se 'suggestions' existe --- */}
        {suggestions && suggestions.length > 0 && searchTerm && (
          <div className="autocomplete-suggestions">
            {suggestions.map(course => (
              <div 
                key={course.id} 
                className="suggestion-item"
                onClick={() => onSuggestionClick(course)}
              >
                {course.title}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="user-menu">
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('studentDashboard'); }}>
          Meus Cursos
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('dashboard'); }}>
          Painel
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('login'); }}>
          Entrar / Cadastrar
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('cart'); }} className="cart-icon" aria-label="Carrinho">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {cartItemCount > 0 && (
            <span className="cart-count">{cartItemCount}</span>
          )}
        </a>
      </div>
    </div>
  </header>
);

export default Header;