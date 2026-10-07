// Regras e rótulos dos chamados compartilhados entre a área do aluno e o
// backoffice. Os limites repetem os da API e da tabela support_tickets.
export const ticketLimits = {
  subject: { min: 3, max: 120 },
  message: { min: 5, max: 2000 },
  response: { max: 2000 },
};

export const ticketStatusLabels = {
  open: 'Aguardando resposta',
  answered: 'Respondido',
  closed: 'Encerrado',
};

export const formatTicketDate = (value) => (value
  ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  : '');
