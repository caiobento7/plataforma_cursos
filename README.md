# CursoLab

Plataforma de cursos online, no estilo Udemy/Coursera, desenvolvida como trabalho da
disciplina de **Princípios de Engenharia de Software**.

O sistema atende dois perfis de usuário — **aluno** e **professor** — cobrindo o ciclo
completo de um curso: da criação do conteúdo pelo instrutor até a conclusão das aulas,
os quizzes e o acompanhamento de progresso pelo aluno.

## Funcionalidades

### Aluno

- **Catálogo de cursos** com busca por título ou instrutor, autocomplete e filtros
  combináveis de nível, faixa de preço e avaliação.
- **Carrinho de compras** e fluxo de compra simulado.
- **Player de aulas** com vídeo, material de apoio em PDF e área de dúvidas por aula.
- **Progressão sequencial**: os módulos começam bloqueados e são liberados
  automaticamente conforme o anterior é concluído — por todas as aulas ou pelo quiz,
  quando o módulo tiver um.
- **Quizzes** com nota mínima de aprovação definida pelo professor (padrão: 70%).
- **Painel do aluno** com os cursos adquiridos e o percentual concluído de cada um.

### Professor

- **Painel do instrutor** com visão geral, análises e gestão dos cursos.
- **Criação de cursos em duas etapas**: primeiro os metadados (título, preço, nível,
  descrição), depois o conteúdo.
- **Editor de conteúdo** para montar módulos e aulas, definindo tipo (vídeo ou quiz),
  duração, URL do vídeo e material de apoio.
- **Editor de quizzes** para cadastrar perguntas, alternativas e a resposta correta.
- **Área de dúvidas** para responder às perguntas enviadas pelos alunos nas aulas.

## Tecnologias

- **React 19** — biblioteca de interface
- **Vite 7** — servidor de desenvolvimento e empacotamento
- **ESLint 9** — análise estática
- **CSS puro** — sem framework de estilo, centralizado em `src/index.css`

## Como executar

Requer [Node.js](https://nodejs.org/) 20 ou superior.

```bash
npm install     # instala as dependências
npm run dev     # inicia em http://localhost:5173
```

Outros comandos disponíveis:

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve localmente a versão de produção
npm run lint      # executa a análise estática
```

## Estrutura do projeto

```
src/
├── components/    # Componentes reutilizáveis (cabeçalho, card de curso, quiz...)
├── pages/         # Telas da aplicação, uma por rota lógica
├── hooks/         # Hooks customizados
├── data/          # Dados iniciais que populam a aplicação
├── utils/         # Funções auxiliares (cálculo de progresso)
├── App.jsx        # Componente raiz: estado global e roteamento
└── index.css      # Estilos da aplicação
```

## Decisões de arquitetura

### Estado centralizado no componente raiz

Todo o estado compartilhado vive no `App.jsx` e desce para as telas por props. Não foi
usado Context API nem biblioteca de gerenciamento de estado: para a quantidade de telas
deste projeto, o fluxo explícito de dados é mais legível e torna as dependências entre
componentes visíveis no próprio código.

### Persistência no navegador

Como não há back-end, os dados são gravados no `localStorage` através do hook
customizado `usePersistedState`, que se comporta como o `useState` mas espelha o valor
no navegador. Isso permite que cursos criados, compras e progresso sobrevivam ao
recarregamento da página.

Um detalhe relevante: o progresso do aluno usa `Set` para as aulas concluídas e os
módulos liberados, e `JSON.stringify` não representa `Set` — serializa como `{}`,
perdendo os dados silenciosamente. Por isso o hook aceita conversores opcionais de
serialização, usados para converter `Set ⇄ Array` na gravação e na leitura.

O estado de navegação e de interface (página atual, busca, filtros) foi deixado fora da
persistência de propósito, para que a aplicação sempre reabra na home, sem filtros ou
buscas residuais de uma sessão anterior.

### Roteamento por estado

A navegação é controlada por uma variável de estado no `App.jsx`, sem biblioteca de
rotas. A consequência é que a aplicação tem uma URL única e o botão "voltar" do
navegador não percorre o histórico interno. A troca foi consciente: manteve o projeto
sem dependências além do React e simplificou a hospedagem, ao custo de URLs não
compartilháveis.

## Limitações conhecidas

Por se tratar de um trabalho acadêmico focado na interface e na modelagem do domínio,
os seguintes pontos foram deliberadamente simplificados:

- **Não há back-end nem banco de dados.** Os dados ficam no navegador de cada usuário,
  ou seja, não são compartilhados entre pessoas ou dispositivos. Limpar os dados do
  navegador reinicia a aplicação.
- **Autenticação é simulada.** As telas de login e cadastro não validam credenciais, e
  os painéis de aluno e professor ficam acessíveis sem autenticação.
- **Pagamento é simulado.** A finalização da compra apenas move os cursos do carrinho
  para a lista de adquiridos, sem qualquer integração financeira.
- **Vídeos e PDFs são de exemplo**, apontando para arquivos públicos de demonstração.
