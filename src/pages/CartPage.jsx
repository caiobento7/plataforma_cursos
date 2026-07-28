import React from 'react';

const CartPage = ({ cart, navigateTo, removeFromCart, handlePurchase }) => {
    const total = cart.reduce((sum, course) => sum + course.price, 0);
  
    return (
      <div className="container">
        <h2>Meu Carrinho</h2>
        {cart.length === 0 ? (
          <div className="card">
            <p>Seu carrinho está vazio.</p>
            <button className="btn" style={{marginTop: '20px'}} onClick={() => navigateTo('home')}>Voltar à navegação</button>
          </div>
        ) : (
          <div className="cart-page">
            <div className="cart-items">
              <div className="card">
                {cart.map(course => (
                  <div key={course.id} className="cart-item">
                    <img src={course.imageUrl} alt={course.title} className="cart-item-image" />
                    <div className="cart-item-info">
                      <h4>{course.title}</h4>
                      <p>{course.instructor}</p>
                      <button className="cart-item-remove" onClick={() => removeFromCart(course.id)}>Remover</button>
                    </div>
                    <div className="cart-item-price">
                      {course.price === 0 ? 'Gratuito' : `R$ ${course.price.toFixed(2)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="cart-summary">
              <h3>Resumo da Compra</h3>
              <div className="form-group">
                <label htmlFor="coupon">Cupom de Desconto</label>
                <input type="text" id="coupon" placeholder="Insira seu cupom" />
              </div>
              <button className="btn" style={{width: '100%', marginBottom: '20px'}}>Aplicar</button>
              
              <div className="cart-total">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              
              <button 
                className="btn btn-accent" 
                style={{width: '100%'}} 
                onClick={handlePurchase} 
              >
                Finalizar Compra
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default CartPage;