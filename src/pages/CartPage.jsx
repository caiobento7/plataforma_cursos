import { ArrowLeft, ArrowRight, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import { formatPrice } from '../utils/courseUtils.js';

const CartPage = ({ cart, navigateTo, removeFromCart, onCheckout }) => {
  const total = cart.reduce((sum, course) => sum + course.price, 0);

  return (
    <section className="ui-page">
      <div className="container">
        <button type="button" className="ui-back" onClick={() => navigateTo('home')}><ArrowLeft size={16} aria-hidden="true" /> Continuar explorando</button>
        <div className="ui-page-head">
          <div>
            <h1>Carrinho</h1>
            <p>{cart.length === 0 ? 'Nenhum curso selecionado.' : `${cart.length} ${cart.length === 1 ? 'curso selecionado' : 'cursos selecionados'}.`}</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="ui-empty">
            <ShoppingBag size={32} color="var(--ui-blue)" aria-hidden="true" />
            <h2>Seu carrinho está vazio</h2>
            <p>Explore o catálogo e adicione os cursos que você quer fazer.</p>
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => navigateTo('home')}>Ver catálogo</button>
          </div>
        ) : (
          <div className="ui-cart">
            <ul className="ui-cart-list">
              {cart.map((course) => (
                <li key={course.id}>
                  <img src={course.imageUrl} alt="" />
                  <div>
                    <h3>{course.title}</h3>
                    <small>{course.level}</small>
                    <br />
                    <button type="button" className="ui-cart-remove" onClick={() => removeFromCart(course.id)}><Trash2 size={14} aria-hidden="true" /> Remover</button>
                  </div>
                  <span className={`ui-price ${course.price === 0 ? 'free' : ''}`}>{formatPrice(course.price)}</span>
                </li>
              ))}
            </ul>

            <aside className="ui-summary">
              <h2>Resumo</h2>
              <div className="ui-summary-row"><span>Cursos</span><span>{cart.length}</span></div>
              <div className="ui-summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
              <button type="button" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" onClick={onCheckout}>
                {total === 0 ? 'Continuar' : 'Ir para o pagamento'} <ArrowRight size={18} aria-hidden="true" />
              </button>
              <span className="ui-summary-note"><Lock size={13} aria-hidden="true" /> Acesso liberado logo após a confirmação.</span>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPage;
