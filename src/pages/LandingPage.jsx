import { useEffect, useState } from 'react';
import {
  ArrowRight, Award, BarChart3, CheckCircle2, FileVideo, LayoutDashboard, LifeBuoy, ListChecks,
  MonitorSmartphone, Play, PlayCircle, Plus, TrendingUp,
} from 'lucide-react';
import cursoLabMark from '../assets/cursolab-mark.png';
import heroCourseImage from '../assets/CursoLab_Fotos_Cursos/06_Introducao_a_Programacao.png';

const features = [
  { icon: PlayCircle, title: 'Vídeo-aulas e materiais', text: 'Assista no player integrado e baixe o material de apoio de cada aula.' },
  { icon: ListChecks, title: 'Quizzes com nota mínima', text: 'Teste o que aprendeu. A aprovação libera o próximo módulo da trilha.' },
  { icon: TrendingUp, title: 'Progresso em tempo real', text: 'Veja quanto falta para concluir e continue exatamente de onde parou.' },
  { icon: Award, title: 'Certificado verificável', text: 'Concluiu a meta do curso? Emita o certificado em PDF com código de verificação.' },
  { icon: LifeBuoy, title: 'Suporte pelo painel', text: 'Abra um chamado e acompanhe a resposta da equipe na sua área do aluno.' },
  { icon: MonitorSmartphone, title: 'Estude em qualquer tela', text: 'Interface pensada para o computador, o tablet e o celular.' },
];

const steps = [
  { title: 'Crie sua conta', text: 'Cadastro rápido com e-mail e senha. Seu progresso fica salvo e acompanha você.' },
  { title: 'Escolha sua trilha', text: 'Explore cursos por nível, preço e avaliação e matricule-se em poucos cliques.' },
  { title: 'Estude e conquiste', text: 'Assista às aulas, passe nos quizzes e emita seu certificado ao atingir a meta.' },
];

const faq = [
  { question: 'Preciso pagar para começar?', answer: 'Não. Criar a conta é gratuito e o catálogo tem cursos gratuitos. Nos cursos pagos, você paga apenas pelo curso que escolher.' },
  { question: 'Como funciona o certificado?', answer: 'Ele é liberado quando você conclui todas as aulas do curso com nota final de pelo menos 70% nos quizzes. O PDF traz seu nome, a carga horária, a nota final, a data de conclusão e um código de verificação.' },
  { question: 'Por quanto tempo tenho acesso ao curso?', answer: 'Cada curso fica disponível pelo prazo informado na sua página, em geral 6 meses a partir da matrícula. Se o prazo terminar, você pode renovar o acesso e continuar de onde parou.' },
  { question: 'Posso estudar no meu ritmo?', answer: 'Sim. As aulas ficam disponíveis a qualquer hora e o progresso é salvo automaticamente. Ao voltar, você continua de onde parou.' },
  { question: 'Como tiro dúvidas?', answer: 'Pelo painel do aluno você abre um chamado para a equipe e acompanha a resposta no mesmo lugar.' },
];

const LandingPage = ({ courses, onLogin, onRegister, onInfoOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const featuredCourses = courses.slice(0, 4);

  return (
    <div className="lp">
      <nav className={`lp-nav ${isScrolled ? 'scrolled' : ''}`} aria-label="Navegação principal">
        <div className="container lp-nav-inner">
          <button type="button" className="ui-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={cursoLabMark} alt="" /><span>Curso<b>Lab</b></span>
          </button>
          <div className="lp-nav-links">
            <a href="#como-funciona" onClick={(event) => { event.preventDefault(); scrollTo('como-funciona'); }}>Como funciona</a>
            <a href="#recursos" onClick={(event) => { event.preventDefault(); scrollTo('recursos'); }}>Recursos</a>
            <a href="#cursos" onClick={(event) => { event.preventDefault(); scrollTo('cursos'); }}>Cursos</a>
            <a href="#duvidas" onClick={(event) => { event.preventDefault(); scrollTo('duvidas'); }}>Dúvidas</a>
          </div>
          <div className="lp-nav-actions">
            <button type="button" className="ui-btn ui-btn-ghost" onClick={onLogin}>Entrar</button>
            <button type="button" className="ui-btn ui-btn-primary" onClick={onRegister}>Começar agora</button>
          </div>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="container lp-hero-grid">
          <div>
            <span className="lp-badge"><span>Novo</span> Certificado em PDF com código de verificação</span>
            <h1>Aprenda no seu ritmo. <em>Comprove o que aprendeu.</em></h1>
            <p className="lp-hero-lead">
              Vídeo-aulas, quizzes que liberam o próximo módulo e certificado ao concluir.
              Uma plataforma simples para estudar de verdade, do primeiro clique ao certificado.
            </p>
            <div className="lp-hero-actions">
              <button type="button" className="ui-btn ui-btn-primary ui-btn-lg" onClick={onRegister}>Criar conta grátis <ArrowRight size={18} aria-hidden="true" /></button>
              <button type="button" className="ui-btn ui-btn-secondary ui-btn-lg" onClick={onLogin}>Já tenho conta</button>
            </div>
            <ul className="lp-checks">
              <li><CheckCircle2 size={17} aria-hidden="true" /> Cursos gratuitos e pagos</li>
              <li><CheckCircle2 size={17} aria-hidden="true" /> Progresso salvo automaticamente</li>
              <li><CheckCircle2 size={17} aria-hidden="true" /> Suporte direto com a equipe</li>
            </ul>
          </div>

          <div className="lp-mock" aria-hidden="true">
            <div className="lp-mock-card">
              <div className="lp-mock-bar"><i /><i /><i /></div>
              <div className="lp-mock-video">
                <img src={heroCourseImage} alt="" />
                <span className="lp-mock-play"><Play size={24} fill="currentColor" /></span>
              </div>
              <div className="lp-mock-body">
                <small>Módulo 2 · Aula 3</small>
                <strong>Estruturas de repetição na prática</strong>
                <div className="lp-mock-progress"><div><i /></div>68% concluído</div>
              </div>
            </div>
            <div className="lp-float quiz">
              <span className="lp-float-icon"><CheckCircle2 size={20} /></span>
              <div><strong>Quiz aprovado</strong><small>Nota 9,0 · módulo liberado</small></div>
            </div>
            <div className="lp-float cert">
              <span className="lp-float-icon"><Award size={20} /></span>
              <div><strong>Certificado liberado</strong><small>Pronto para baixar em PDF</small></div>
            </div>
          </div>
        </div>
      </header>

      <section className="lp-section" id="como-funciona">
        <div className="container">
          <div className="lp-head">
            <span className="lp-eyebrow">Como funciona</span>
            <h2>Do cadastro ao certificado em três passos</h2>
            <p>Sem complicação: você se concentra no conteúdo e a plataforma cuida do resto.</p>
          </div>
          <div className="lp-steps">
            {steps.map((step, index) => (
              <article key={step.title} className="lp-step">
                <b>0{index + 1}</b>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section alt" id="recursos">
        <div className="container">
          <div className="lp-head">
            <span className="lp-eyebrow">Recursos</span>
            <h2>Tudo o que você precisa para aprender</h2>
            <p>Recursos pensados para manter o ritmo de estudo e mostrar a sua evolução.</p>
          </div>
          <div className="lp-features">
            {features.map((feature) => (
              <article key={feature.title} className="lp-feature">
                <span className="lp-feature-icon"><feature.icon size={22} aria-hidden="true" /></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {featuredCourses.length > 0 && (
        <section className="lp-section" id="cursos">
          <div className="container">
            <div className="lp-courses-head">
              <div className="lp-head">
                <span className="lp-eyebrow">Cursos</span>
                <h2>Trilhas para dar o próximo passo</h2>
                <p>Do primeiro código à gestão de projetos: escolha por onde começar.</p>
              </div>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={onLogin}>Ver catálogo completo <ArrowRight size={16} aria-hidden="true" /></button>
            </div>
            <div className="lp-course-grid">
              {featuredCourses.map((course) => (
                <button key={course.id} type="button" className="lp-course" onClick={onLogin}>
                  <img src={course.imageUrl} alt="" loading="lazy" />
                  <div><small>{course.level}</small><strong>{course.title}</strong></div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="lp-section lp-split-wrap">
        <div className="container lp-split">
          <div>
            <span className="lp-eyebrow">Para a equipe</span>
            <h2>Um backoffice completo para gerenciar a plataforma</h2>
            <p>Administradores criam cursos, organizam o conteúdo e acompanham os alunos em um só lugar.</p>
          </div>
          <ul>
            <li><LayoutDashboard size={22} aria-hidden="true" /><div><strong>Editor de conteúdo</strong><span>Módulos, aulas e quizzes com reordenação e salvamento em um clique.</span></div></li>
            <li><FileVideo size={22} aria-hidden="true" /><div><strong>Vídeos e materiais na nuvem</strong><span>Envie arquivos direto do computador ou use links do YouTube.</span></div></li>
            <li><BarChart3 size={22} aria-hidden="true" /><div><strong>Chamados e indicadores</strong><span>Responda aos alunos e acompanhe matrículas e faturamento.</span></div></li>
          </ul>
        </div>
      </section>

      <section className="lp-section" id="duvidas">
        <div className="container">
          <div className="lp-head">
            <span className="lp-eyebrow">Dúvidas frequentes</span>
            <h2>Perguntas frequentes</h2>
          </div>
          <div className="lp-faq">
            {faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}<Plus size={20} aria-hidden="true" /></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="lp-cta">
            <h2>Comece hoje. Sua próxima aula está a um clique.</h2>
            <p>Crie sua conta gratuita e explore o catálogo completo da CursoLab.</p>
            <button type="button" className="ui-btn ui-btn-light ui-btn-lg" onClick={onRegister}>Criar conta grátis <ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="container">
          <div className="lp-footer-grid">
            <div>
              <span className="ui-logo"><img src={cursoLabMark} alt="" /><span>Curso<b>Lab</b></span></span>
              <p>Plataforma de cursos online com trilhas, quizzes e certificado. Projeto acadêmico de Engenharia de Software.</p>
            </div>
            <div>
              <h4>Plataforma</h4>
              <ul>
                <li><button type="button" onClick={() => scrollTo('como-funciona')}>Como funciona</button></li>
                <li><button type="button" onClick={() => scrollTo('recursos')}>Recursos</button></li>
                <li><button type="button" onClick={onLogin}>Entrar</button></li>
              </ul>
            </div>
            <div>
              <h4>Institucional</h4>
              <ul>
                <li><button type="button" onClick={() => onInfoOpen('about')}>Sobre a CursoLab</button></li>
                <li><button type="button" onClick={() => onInfoOpen('contact')}>Contato</button></li>
                <li><button type="button" onClick={() => onInfoOpen('privacy')}>Privacidade</button></li>
                <li><button type="button" onClick={() => onInfoOpen('terms')}>Termos de uso</button></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} CursoLab</span>
            <span>Feito com React, Express e Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
