import { X } from 'lucide-react';

const pageContent = {
  about: {
    title: 'Sobre a CursoLab',
    text: 'A CursoLab é uma plataforma acadêmica de cursos online criada para aproximar alunos de conteúdos práticos e acessíveis.',
  },
  careers: {
    title: 'Carreiras',
    text: 'Estamos sempre construindo novas experiências de aprendizagem. Esta é uma página demonstrativa de oportunidades na CursoLab.',
  },
  blog: {
    title: 'Blog',
    text: 'Confira em breve artigos, dicas de estudo e novidades sobre tecnologia, carreira e educação online.',
  },
  contact: {
    title: 'Contato',
    text: 'Para falar com a equipe CursoLab, envie uma mensagem para contato@cursolab.com.br.',
  },
  help: {
    title: 'Central de Ajuda',
    text: 'Precisa de ajuda? Consulte os recursos da plataforma ou entre em contato com nossa equipe de suporte.',
  },
  privacy: {
    title: 'Política de Privacidade',
    text: 'Os dados cadastrados são utilizados apenas para o funcionamento da plataforma e para a identificação da conta do aluno.',
  },
  terms: {
    title: 'Termos de Uso',
    text: 'Ao utilizar a CursoLab, você concorda em usar a plataforma de forma responsável e respeitar seus conteúdos e usuários.',
  },
};

const InfoPage = ({ page, onClose }) => {
  const content = pageContent[page] || pageContent.about;

  return (
    <div className="info-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="info-modal-close" onClick={onClose} aria-label="Fechar"><X size={18} aria-hidden="true" /></button>
        <span className="section-eyebrow">CursoLab</span>
        <h1 id="info-modal-title">{content.title}</h1>
        <p>{content.text}</p>
        <button type="button" className="btn" onClick={onClose}>Fechar</button>
      </section>
    </div>
  );
};

export default InfoPage;
