import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, CreditCard, Info, Lock, QrCode, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../utils/courseUtils.js';

// Pagamento simulado (projeto acadêmico): os dados do cartão ficam só no estado
// deste componente para validar o formulário. Nada é enviado à API nem salvo;
// a confirmação apenas cria as matrículas.

const onlyDigits = (value) => value.replace(/\D/g, '');

const formatCardNumber = (value) => onlyDigits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (value) => {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

// Algoritmo de Luhn: o mesmo dígito verificador usado pelas bandeiras reais.
const isValidCardNumber = (number) => {
  const digits = onlyDigits(number);
  if (digits.length < 13) return false;
  let sum = 0;
  digits.split('').reverse().forEach((digit, index) => {
    let value = Number(digit);
    if (index % 2 === 1) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
  });
  return sum % 10 === 0;
};

const isValidExpiry = (expiry) => {
  const [month, year] = expiry.split('/').map(Number);
  if (!month || month > 12 || year === undefined || Number.isNaN(year)) return false;
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  return year > currentYear || (year === currentYear && month >= now.getMonth() + 1);
};

const cardBrand = (number) => {
  const digits = onlyDigits(number);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(digits)) return 'Elo';
  return '';
};

// Padrão visual de QR Code gerado a partir do código do pedido (ilustrativo).
const PixPattern = ({ seed }) => {
  const size = 25;
  const cells = [];
  let state = [...seed].reduce((total, char) => total * 31 + char.charCodeAt(0), 7) >>> 0;
  const isFinder = (x, y) => [[0, 0], [size - 7, 0], [0, size - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isFinder(x, y)) continue;
      state = (state * 1103515245 + 12345) >>> 0;
      if ((state >>> 16) % 2) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  const finder = (fx, fy) => (
    <g key={`f-${fx}-${fy}`}>
      <rect x={fx} y={fy} width="7" height="7" />
      <rect x={fx + 1} y={fy + 1} width="5" height="5" fill="#fff" />
      <rect x={fx + 2} y={fy + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="co-qr" role="img" aria-label="QR Code Pix ilustrativo">
      <rect x="-1" y="-1" width={size + 2} height={size + 2} fill="#fff" />
      <g fill="#0f1f33">{cells}{finder(0, 0)}{finder(size - 7, 0)}{finder(0, size - 7)}</g>
    </svg>
  );
};

const CheckoutPage = ({ cart, navigateTo, onConfirm }) => {
  const total = cart.reduce((sum, course) => sum + course.price, 0);
  const isFree = total === 0;
  const orderCode = useMemo(() => `CL${Date.now().toString().slice(-8)}`, []);
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136cursolab-demo@pix.com.br5204000053039865406${total.toFixed(2)}5802BR5908CURSOLAB6009SAO PAULO62120508${orderCode}6304A1B2`;

  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [installments, setInstallments] = useState(1);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | processing
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);

  const brand = cardBrand(card.number);
  const maxInstallments = Math.min(6, Math.max(1, Math.floor(total / 30)));

  const updateCard = (field, value) => {
    setCard((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const validateCard = () => {
    const nextErrors = {};
    if (!isValidCardNumber(card.number)) nextErrors.number = 'Número de cartão inválido.';
    if (card.name.trim().split(/\s+/).length < 2) nextErrors.name = 'Informe o nome como está no cartão.';
    if (!isValidExpiry(card.expiry)) nextErrors.expiry = 'Validade inválida.';
    if (!/^\d{3,4}$/.test(card.cvv)) nextErrors.cvv = 'CVV inválido.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!isFree && method === 'card' && !validateCard()) return;

    setStatus('processing');
    // Simula o tempo de autorização de um gateway de pagamento.
    await new Promise((resolve) => setTimeout(resolve, 1600));
    try {
      await onConfirm({
        orderCode,
        total,
        method: isFree ? 'free' : method,
        installments: method === 'card' ? installments : 1,
        cardLast4: method === 'card' ? onlyDigits(card.number).slice(-4) : null,
        cardBrand: method === 'card' ? brand : null,
      });
    } catch (error) {
      setSubmitError(error.message || 'Não foi possível concluir a compra.');
      setStatus('idle');
    }
  };

  if (cart.length === 0) {
    return (
      <section className="ui-page">
        <div className="container">
          <div className="ui-empty">
            <h2>Nenhum curso para pagar</h2>
            <p>Seu carrinho está vazio.</p>
            <button type="button" className="ui-btn ui-btn-primary" onClick={() => navigateTo('home')}>Ver catálogo</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-page">
      <div className="container">
        <button type="button" className="ui-back" onClick={() => navigateTo('cart')}><ArrowLeft size={16} aria-hidden="true" /> Voltar ao carrinho</button>

        <ol className="co-steps" aria-label="Etapas da compra">
          <li className="done"><span><Check size={14} aria-hidden="true" /></span>Carrinho</li>
          <li className="current"><span>2</span>Pagamento</li>
          <li><span>3</span>Confirmação</li>
        </ol>

        <form className="co-layout" onSubmit={handleSubmit} noValidate>
          <div className="co-main">
            <h1>{isFree ? 'Confirmar matrícula' : 'Pagamento'}</h1>
            <p className="co-demo"><Info size={16} aria-hidden="true" /> Ambiente de demonstração: nenhum valor é cobrado e os dados do cartão não são enviados nem armazenados.</p>

            {isFree ? (
              <div className="co-panel co-free">
                <ShieldCheck size={28} aria-hidden="true" />
                <div><strong>Cursos gratuitos</strong><span>Não é preciso pagamento. Confirme para liberar o acesso agora.</span></div>
              </div>
            ) : (
              <>
                <div className="co-methods" role="radiogroup" aria-label="Forma de pagamento">
                  <button type="button" role="radio" aria-checked={method === 'card'} className={method === 'card' ? 'active' : ''} onClick={() => setMethod('card')}>
                    <CreditCard size={20} aria-hidden="true" /><span><strong>Cartão de crédito</strong><small>Em até {maxInstallments}x sem juros</small></span>
                  </button>
                  <button type="button" role="radio" aria-checked={method === 'pix'} className={method === 'pix' ? 'active' : ''} onClick={() => setMethod('pix')}>
                    <QrCode size={20} aria-hidden="true" /><span><strong>Pix</strong><small>Aprovação imediata</small></span>
                  </button>
                </div>

                {method === 'card' ? (
                  <div className="co-panel co-card-grid">
                    <div className={`co-card-preview ${brand ? brand.toLowerCase() : ''}`} aria-hidden="true">
                      <div className="co-card-top"><span className="co-chip" /><b>{brand || 'Cartão'}</b></div>
                      <div className="co-card-number">{card.number || '•••• •••• •••• ••••'}</div>
                      <div className="co-card-bottom">
                        <span><small>Titular</small>{card.name.toUpperCase() || 'NOME NO CARTÃO'}</span>
                        <span><small>Validade</small>{card.expiry || 'MM/AA'}</span>
                      </div>
                    </div>

                    <div className="co-fields">
                      <div className="ui-field">
                        <label htmlFor="card-number">Número do cartão</label>
                        <input className={`ui-input ${errors.number ? 'invalid' : ''}`} id="card-number" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" value={card.number} onChange={(event) => updateCard('number', formatCardNumber(event.target.value))} />
                        {errors.number ? <small className="co-error">{errors.number}</small> : <small className="ui-muted">Para testar, use 4242 4242 4242 4242.</small>}
                      </div>
                      <div className="ui-field">
                        <label htmlFor="card-name">Nome impresso no cartão</label>
                        <input className={`ui-input ${errors.name ? 'invalid' : ''}`} id="card-name" autoComplete="off" placeholder="Como aparece no cartão" value={card.name} onChange={(event) => updateCard('name', event.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '').slice(0, 26))} />
                        {errors.name && <small className="co-error">{errors.name}</small>}
                      </div>
                      <div className="co-row">
                        <div className="ui-field">
                          <label htmlFor="card-expiry">Validade</label>
                          <input className={`ui-input ${errors.expiry ? 'invalid' : ''}`} id="card-expiry" inputMode="numeric" autoComplete="off" placeholder="MM/AA" value={card.expiry} onChange={(event) => updateCard('expiry', formatExpiry(event.target.value))} />
                          {errors.expiry && <small className="co-error">{errors.expiry}</small>}
                        </div>
                        <div className="ui-field">
                          <label htmlFor="card-cvv">CVV</label>
                          <input className={`ui-input ${errors.cvv ? 'invalid' : ''}`} id="card-cvv" inputMode="numeric" autoComplete="off" placeholder="123" value={card.cvv} onChange={(event) => updateCard('cvv', onlyDigits(event.target.value).slice(0, 4))} />
                          {errors.cvv && <small className="co-error">{errors.cvv}</small>}
                        </div>
                      </div>
                      <div className="ui-field">
                        <label htmlFor="card-installments">Parcelamento</label>
                        <select className="ui-select" id="card-installments" value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>
                          {Array.from({ length: maxInstallments }, (_, index) => index + 1).map((count) => (
                            <option key={count} value={count}>{count}x de {formatPrice(total / count)} sem juros</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="co-panel co-pix">
                    <PixPattern seed={orderCode} />
                    <div>
                      <strong>Pague com Pix</strong>
                      <ol>
                        <li>Abra o app do seu banco e escolha pagar com Pix.</li>
                        <li>Escaneie o QR Code ou use o código copia e cola.</li>
                        <li>Depois de pagar, clique em <b>Já fiz o pagamento</b>.</li>
                      </ol>
                      <div className="co-pix-code">
                        <code>{pixCode.slice(0, 42)}…</code>
                        <button type="button" className="ui-btn ui-btn-secondary ui-btn-sm" onClick={handleCopyPix}>{copied ? <><Check size={15} aria-hidden="true" /> Copiado</> : <><Copy size={15} aria-hidden="true" /> Copiar</>}</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="co-summary">
            <h2>Resumo do pedido</h2>
            <ul>
              {cart.map((course) => (
                <li key={course.id}>
                  <img src={course.imageUrl} alt="" />
                  <span><strong>{course.title}</strong><small>{course.level}</small></span>
                  <b>{formatPrice(course.price)}</b>
                </li>
              ))}
            </ul>
            <div className="ui-summary-row"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="ui-summary-row"><span>Desconto</span><span>{formatPrice(0)}</span></div>
            <div className="ui-summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
            {!isFree && method === 'card' && installments > 1 && <p className="co-installments">{installments}x de {formatPrice(total / installments)} sem juros</p>}
            {submitError && <p className="ui-alert error" role="alert">{submitError}</p>}
            <button type="submit" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" disabled={status === 'processing'}>
              {status === 'processing'
                ? <><span className="co-spinner" aria-hidden="true" /> {isFree ? 'Confirmando...' : 'Processando pagamento...'}</>
                : isFree ? 'Confirmar matrícula' : method === 'pix' ? 'Já fiz o pagamento' : `Pagar ${formatPrice(total)}`}
            </button>
            <span className="ui-summary-note"><Lock size={13} aria-hidden="true" /> Pedido {orderCode} · acesso liberado na confirmação</span>
          </aside>
        </form>
      </div>
    </section>
  );
};

export default CheckoutPage;
