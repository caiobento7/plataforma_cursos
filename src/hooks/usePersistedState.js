import { useState, useEffect } from 'react';

/**
 * Funciona como o useState, mas mantém o valor salvo no localStorage do
 * navegador, de forma que os dados sobrevivam ao recarregamento da página.
 *
 * @param {string} key Chave usada para guardar o valor no localStorage.
 * @param {*} initialValue Valor inicial. Pode ser uma função (lazy initializer),
 *   assim como no useState, para casos em que criar o valor é custoso.
 * @param {object} [options] Conversores opcionais, necessários para estruturas
 *   que o JSON não representa sozinho (Set, Map, Date...).
 * @param {function} [options.serialize] Converte o state para algo serializável.
 * @param {function} [options.deserialize] Reconstrói o state a partir do JSON.
 *
 * Importante: se forem informados, `serialize` e `deserialize` devem ser
 * referências estáveis (definidas fora do componente), e não funções criadas
 * a cada renderização.
 */
const usePersistedState = (key, initialValue, { serialize, deserialize } = {}) => {
  const resolveInitialValue = () =>
    typeof initialValue === 'function' ? initialValue() : initialValue;

  const [state, setState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) return resolveInitialValue();

      const parsed = JSON.parse(stored);
      return deserialize ? deserialize(parsed) : parsed;
    } catch {
      // Dado corrompido ou localStorage indisponível: volta ao valor inicial
      // em vez de derrubar a aplicação.
      return resolveInitialValue();
    }
  });

  useEffect(() => {
    try {
      const toStore = serialize ? serialize(state) : state;
      window.localStorage.setItem(key, JSON.stringify(toStore));
    } catch {
      // Sem espaço ou navegação anônima: a aplicação segue funcionando
      // normalmente, apenas sem persistir.
    }
  }, [key, state, serialize]);

  return [state, setState];
};

export default usePersistedState;
