import React from 'react';

const Footer = () => (
  <footer>
    <div className="container footer-content">
      <div className="footer-section">
        <h3>Plataforma de Cursos</h3>
        <p>Aprenda com os melhores instrutores e transforme sua carreira.</p>
      </div>
      <div className="footer-section">
        <h3>Links Rápidos</h3>
        <ul>
          <li><a href="#" onClick={(e) => e.preventDefault()}>Sobre Nós</a></li>
          <li><a href="#" onClick={(e) => e.preventDefault()}>Carreiras</a></li>
          <li><a href="#" onClick={(e) => e.preventDefault()}>Blog</a></li>
          <li><a href="#" onClick={(e) => e.preventDefault()}>Contato</a></li>
        </ul>
      </div>
      <div className="footer-section">
        <h3>Suporte</h3>
        <ul>
          <li><a href="#" onClick={(e) => e.preventDefault()}>Central de Ajuda</a></li>
          <li><a href="#" onClick={(e) => e.preventDefault()}>Política de Privacidade</a></li>
          <li><a href="#" onClick={(e) => e.preventDefault()}>Termos de Uso</a></li>
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;