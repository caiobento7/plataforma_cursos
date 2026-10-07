// Conteúdo dos 6 cursos do catálogo. Cada curso tem 3 módulos; cada módulo tem
// 3 vídeos do YouTube, um quiz de 5 perguntas e o texto da apostila em PDF.
// As perguntas guardam o índice da opção correta em "answer".
import designUxUi from './dados/design-ux-ui.mjs';
import gestaoProjetos from './dados/gestao-projetos.mjs';
import introducaoProgramacao from './dados/introducao-programacao.mjs';
import marketingDigital from './dados/marketing-digital.mjs';
import pythonAnaliseDados from './dados/python-analise-dados.mjs';
import react from './dados/react.mjs';

export const courses = [
  designUxUi,
  marketingDigital,
  react,
  pythonAnaliseDados,
  gestaoProjetos,
  introducaoProgramacao,
];
