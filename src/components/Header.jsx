const Header = ({ navigateTo, cartItemCount, searchTerm, setSearchTerm, suggestions, onSuggestionClick }) => (
  <header>
    <div className="container header-content">
      <button className="logo" type="button" onClick={() => navigateTo('home')}>
        <span className="logo-mark" aria-hidden="true">&lt;/&gt;</span>
        <span>Curso<span>Lab</span></span>
      </button>

      <div className="search-bar">
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
              <button
                key={course.id}
                type="button"
                className="suggestion-item"
                onClick={() => onSuggestionClick(course)}
              >
                {course.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="user-menu" aria-label="Navegação principal">
        <button type="button" onClick={() => navigateTo('studentDashboard')}>Meus Cursos</button>
        <button type="button" onClick={() => navigateTo('dashboard')}>Painel</button>
        <button type="button" onClick={() => navigateTo('login')} className="header-login">Entrar</button>
        <button type="button" onClick={() => navigateTo('cart')} className="cart-icon" aria-label="Carrinho">
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>}
        </button>
      </nav>
    </div>
  </header>
);

export default Header;
