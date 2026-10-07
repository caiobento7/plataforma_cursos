import { useEffect, useRef, useState } from 'react';
import { LogOut, ShoppingBag } from 'lucide-react';
import cursoLabMark from '../assets/cursolab-mark.png';

const studentLinks = [
  { page: 'studentDashboard', label: 'Meus cursos', also: ['player'] },
  { page: 'home', label: 'Catálogo', also: ['details', 'cart', 'checkout'] },
];

// Cabeçalho da área logada. Visitantes veem o cabeçalho próprio da landing.
const Header = ({ navigateTo, currentPage, cartItemCount, currentUser, onSignOut }) => {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const isAdmin = currentUser?.role === 'admin';
  const fullName = currentUser?.full_name || 'Conta';
  const initials = fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  // Fecha o menu da conta ao clicar fora dele.
  useEffect(() => {
    if (!isAccountOpen) return undefined;
    const handleClick = (event) => {
      if (!accountRef.current?.contains(event.target)) setIsAccountOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isAccountOpen]);

  return (
    <header className="site-header app-header">
      <div className="container app-header-inner">
        <button className="ui-logo" type="button" onClick={() => navigateTo(isAdmin ? 'dashboard' : 'studentDashboard')}>
          <img src={cursoLabMark} alt="" /><span>Curso<b>Lab</b></span>
        </button>

        {isAdmin ? (
          <span className="app-header-tag">Backoffice</span>
        ) : (
          <nav className="app-nav" aria-label="Navegação do aluno">
            {studentLinks.map((link) => {
              const isActive = currentPage === link.page || link.also?.includes(currentPage);
              return (
                <button key={link.page} type="button" className={isActive ? 'active' : ''} aria-current={isActive ? 'page' : undefined} onClick={() => navigateTo(link.page)}>
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}

        <div className="app-header-actions">
          {!isAdmin && (
            <button type="button" className="app-cart" onClick={() => navigateTo('cart')} aria-label={`Carrinho${cartItemCount ? ` com ${cartItemCount} item(ns)` : ''}`}>
              <ShoppingBag size={21} strokeWidth={2} aria-hidden="true" />
              {cartItemCount > 0 && <span>{cartItemCount}</span>}
            </button>
          )}
          <div className="app-account" ref={accountRef}>
            <button type="button" className="app-account-trigger" onClick={() => setIsAccountOpen((open) => !open)} aria-expanded={isAccountOpen} aria-haspopup="menu">
              <span className="app-avatar" aria-hidden="true">{initials}</span>
              <span>{fullName.split(' ')[0]}</span>
            </button>
            {isAccountOpen && (
              <div className="app-account-menu" role="menu">
                <div>
                  <strong>{fullName}</strong>
                  <span>{currentUser?.email}</span>
                  <small>{isAdmin ? 'Administrador(a)' : 'Aluno(a)'}</small>
                </div>
                <button type="button" role="menuitem" onClick={() => { setIsAccountOpen(false); onSignOut(); }}>
                  <LogOut size={16} aria-hidden="true" /> Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
