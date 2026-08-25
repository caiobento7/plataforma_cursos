const Footer = ({ onInfoOpen }) => {
  const openInfoPage = (event, page) => {
    event.preventDefault();
    onInfoOpen(page);
  };

  return (
    <footer>
      <div className="container footer-content">
        <div className="footer-section">
          <h3><a href="#inicio" onClick={(event) => openInfoPage(event, 'about')}>Plataforma de Cursos</a></h3>
          <p>Aprenda com os melhores instrutores e transforme sua carreira.</p>
        </div>
        <div className="footer-section">
          <h3>Links Rápidos</h3>
          <ul>
            <li><a href="#sobre" onClick={(event) => openInfoPage(event, 'about')}>Sobre Nós</a></li>
            <li><a href="#carreiras" onClick={(event) => openInfoPage(event, 'careers')}>Carreiras</a></li>
            <li><a href="#blog" onClick={(event) => openInfoPage(event, 'blog')}>Blog</a></li>
            <li><a href="#contato" onClick={(event) => openInfoPage(event, 'contact')}>Contato</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Suporte</h3>
          <ul>
            <li><a href="#ajuda" onClick={(event) => openInfoPage(event, 'help')}>Central de Ajuda</a></li>
            <li><a href="#privacidade" onClick={(event) => openInfoPage(event, 'privacy')}>Política de Privacidade</a></li>
            <li><a href="#termos" onClick={(event) => openInfoPage(event, 'terms')}>Termos de Uso</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
