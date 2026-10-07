import { ArrowRight, Check, PlayCircle } from 'lucide-react';
import { formatPrice } from '../utils/courseUtils.js';

const methodLabel = (order) => {
  if (!order || order.method === 'free') return 'Matrícula gratuita';
  if (order.method === 'pix') return 'Pix';
  const card = [order.cardBrand || 'Cartão', order.cardLast4 ? `final ${order.cardLast4}` : ''].filter(Boolean).join(' ');
  return order.installments > 1 ? `${card} · ${order.installments}x sem juros` : card;
};

const EnrollmentSuccessPage = ({ courses, order, navigateTo }) => (
  <section className="ui-page">
    <div className="container">
      <ol className="co-steps" aria-label="Etapas da compra">
        <li className="done"><span><Check size={14} aria-hidden="true" /></span>Carrinho</li>
        <li className="done"><span><Check size={14} aria-hidden="true" /></span>Pagamento</li>
        <li className="current done"><span><Check size={14} aria-hidden="true" /></span>Confirmação</li>
      </ol>

      <div className="co-success">
        <div className="co-success-icon" aria-hidden="true"><Check size={38} strokeWidth={3} /></div>
        <h1>{order?.method === 'free' ? 'Matrícula confirmada!' : 'Pagamento aprovado!'}</h1>
        <p>Seus cursos já estão liberados. Bons estudos!</p>

        {order && (
          <dl className="co-receipt">
            <div><dt>Pedido</dt><dd>{order.orderCode}</dd></div>
            <div><dt>Pagamento</dt><dd>{methodLabel(order)}</dd></div>
            <div><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        )}

        <ul className="co-success-courses">
          {courses.map((course) => (
            <li key={course.id}>
              <img src={course.imageUrl} alt="" />
              <span><strong>{course.title}</strong><small>{course.level} · acesso liberado</small></span>
              <button type="button" className="ui-btn ui-btn-primary ui-btn-sm" onClick={() => navigateTo('player', course.id)}><PlayCircle size={16} aria-hidden="true" /> Começar agora</button>
            </li>
          ))}
        </ul>

        <div className="co-success-actions">
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => navigateTo('studentDashboard')}>Ir para meus cursos <ArrowRight size={16} aria-hidden="true" /></button>
          <button type="button" className="ui-btn ui-btn-ghost" onClick={() => navigateTo('home')}>Continuar explorando</button>
        </div>
      </div>
    </div>
  </section>
);

export default EnrollmentSuccessPage;
