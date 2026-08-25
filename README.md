# CursoLab

Plataforma de cursos online desenvolvida para a disciplina de Princípios de
Engenharia de Software. O projeto possui uma interface React e uma API REST
própria, conectada a um banco PostgreSQL hospedado no Supabase.

## Arquitetura

```text
React + Vite (frontend) -> Express (API REST) -> Supabase PostgreSQL + Auth
```

O Express concentra as regras de negócio e acessa o Supabase por uma chave
secreta mantida apenas no ambiente do servidor. O frontend nunca acessa essa
chave ou o banco diretamente.

## Tecnologias

- React 19 e Vite 7
- Node.js e Express 5
- Supabase Auth e PostgreSQL
- ESLint 9 e CSS puro

## Funcionalidades do backend

- Cadastro e login de alunos por e-mail e senha.
- Perfis com papéis `student` e `admin`.
- Backoffice administrativo protegido: o administrador pode criar, editar e
  excluir qualquer curso cadastrado.
- Matrículas vinculando aluno e curso.
- Módulos, aulas em vídeo e quizzes com perguntas e nota mínima.
- Registro de progresso por aula para cada aluno matriculado.
- Área de dúvidas, com envio pelo aluno e resposta pelo administrador.

## Como executar

Pré-requisito: Node.js 20 ou superior e um projeto Supabase configurado.

### 1. Banco de dados

No SQL Editor do Supabase, execute nesta ordem:

1. `backend/database/schema.sql`
2. `backend/database/002_learning_content.sql`
3. `backend/database/seed.sql` (cursos iniciais)

Em um banco que já possuía o papel `teacher`, execute também
`backend/database/003_admin_role.sql` para convertê-lo em `admin`.

### 2. Configurar o backend

Crie `backend/.env` a partir de `backend/.env.example`:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_publica
SUPABASE_SECRET_KEY=sb_secret_sua_chave_secreta
```

Nunca versione ou exponha a chave secreta.

### 3. Iniciar os serviços

Na raiz do projeto:

```bash
npm install
npm run server    # API: http://localhost:3001
npm run dev       # frontend: http://localhost:5173
```

As dependências da API são instaladas em `backend/` e já estão registradas no
seu próprio `package.json`.

O endpoint `GET /api/health` confirma que o servidor está ativo. A referência
completa das rotas está em [`backend/README.md`](backend/README.md).

## Estrutura

```text
backend/
  database/       # scripts SQL de schema, migração e carga inicial
  src/            # API Express, autenticação e regras de acesso
src/
  components/     # componentes React
  pages/          # telas do sistema
  data/           # dados temporários do frontend durante a migração
```

## Estado atual

O backend e o banco foram validados isoladamente com cadastro, login, perfil,
CRUD de cursos, matrícula, conteúdo, quiz, progresso e dúvidas. A próxima fase
é substituir gradualmente os dados temporários e o `localStorage` do React por
chamadas à API REST.
