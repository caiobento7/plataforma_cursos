# CursoLab

Plataforma de cursos online desenvolvida para a disciplina de Princípios de
Engenharia de Software. Alunos compram cursos, assistem às aulas, fazem quizzes,
tiram dúvidas e emitem certificados; administradores criam e organizam o conteúdo,
respondem aos alunos e acompanham os indicadores.

**Em produção:** https://plataforma-cursos-omega.vercel.app

## Arquitetura

```text
React + Vite   ->   API REST (Express)   ->   Supabase (PostgreSQL + Auth + Storage)
  (cliente)         (regras de negócio)          (dados, login e arquivos)
```

- O frontend nunca acessa o banco: toda leitura e gravação passa pela API.
- A API é a única camada com a chave secreta do Supabase e aplica o controle de
  acesso no servidor (`requireAuth` e `requireAdmin`).
- Na Vercel, o frontend é publicado como site estático e a API roda como função
  serverless no mesmo domínio (`api/index.js` reaproveita o app Express).

## Funcionalidades

**Visitante:** landing page com a apresentação da plataforma e os cursos em destaque.

**Aluno**
- Cadastro, login, sessão renovada automaticamente e recuperação de senha por e-mail.
- Catálogo com busca e filtros, página de detalhes com a grade do curso.
- Carrinho e checkout demonstrativo (cartão ou Pix; nenhum valor é cobrado).
- 6 cursos com conteúdo real: 3 módulos cada, vídeos do YouTube com crédito ao canal,
  quiz de 5 perguntas e apostila em PDF por módulo.
- Player com vídeo (arquivo enviado, YouTube ou Vimeo), material de apoio, quizzes
  corrigidos no servidor e módulos liberados conforme a progressão.
- "Continue de onde parou": retoma o curso na última aula acessada.
- Dúvidas em cada aula, respondidas pelo instrutor.
- Certificado em PDF, liberado ao concluir todas as aulas com nota final de pelo menos 70%
  nos quizzes (média da melhor nota de cada quiz).
- Chamados de suporte, edição do nome e troca de senha.

**Administrador**
- Backoffice com indicadores, pendências e análise por curso.
- Criação e edição de cursos; editor de módulos, aulas e quizzes salvo numa transação.
- Envio de vídeos e materiais direto para o Supabase Storage.
- Resposta às dúvidas das aulas e aos chamados de suporte.

## Tecnologias

- React 19, Vite 7 e CSS próprio (`src/styles/ui.css`, fonte Inter)
- Node.js 20+ e Express 5
- Supabase: PostgreSQL, Auth e Storage
- jsPDF para o certificado
- ESLint 9

## Como executar

Pré-requisitos: Node.js 20 ou superior e um projeto no Supabase.

### 1. Banco de dados

No SQL Editor do Supabase, execute nesta ordem:

| Arquivo | O que faz |
|---|---|
| `backend/database/schema.sql` | Perfis, cursos e matrículas |
| `backend/database/002_learning_content.sql` | Módulos, aulas, quizzes, progresso e dúvidas |
| `backend/database/seed.sql` | Cursos iniciais |
| `backend/database/005_demo_course_metrics.sql` | Indicadores de demonstração |
| `backend/database/006_demo_learning_content.sql` | Conteúdo de demonstração |
| `backend/database/007_demo_remaining_course_content.sql` | Conteúdo dos demais cursos |
| `backend/database/008_support_tickets.sql` | Chamados de suporte |
| `backend/database/009_save_course_content.sql` | Função que salva o conteúdo numa transação |
| `backend/database/010_course_materials_storage.sql` | Bucket de materiais de apoio |
| `backend/database/011_course_videos_storage.sql` | Bucket de vídeos |
| `backend/database/012_enrollment_last_access.sql` | Última aula acessada em cada matrícula |
| `backend/database/013_course_access_period.sql` | Prazo de acesso das matrículas |
| `backend/database/014_lesson_description_credit.sql` | Descrição das aulas e crédito dos vídeos |
| `backend/database/015_quiz_score.sql` | Melhor nota de cada quiz, usada no certificado |

Em um banco que já possuía o papel `teacher`, execute também `003_admin_role.sql`.
Para promover uma conta a administrador, use `004_demo_admin.sql` como modelo.

Depois, cadastre o conteúdo real dos 6 cursos (vídeos do YouTube com crédito ao canal,
quizzes e apostilas em PDF enviadas ao Storage), que substitui o conteúdo de
demonstração dos scripts 006 e 007:

```bash
npm run seed:cursos                       # grava no banco de backend/.env
npm run seed:cursos -- --pdf ./apostilas  # só gera as apostilas localmente
```

O conteúdo fica em `backend/scripts/cursos-reais/` e o script pode ser executado de novo:
aulas com o mesmo título mantêm o id e o progresso dos alunos.

### 2. Variáveis de ambiente

Crie `backend/.env` a partir de `backend/.env.example`:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_publica
SUPABASE_SECRET_KEY=sua_chave_secreta
```

Nunca versione nem exponha a chave secreta.

### 3. Iniciar

```bash
npm install
npm run server    # API em http://localhost:3001
npm run dev       # interface em http://localhost:5173
```

Em desenvolvimento, o Vite encaminha `/api` para o Express, então o frontend usa os
mesmos caminhos relativos que em produção. `GET /api/health` confirma que a API está no
ar. A referência das rotas está em [`backend/README.md`](backend/README.md).

## Testes

Os testes de integração ficam em `backend/tests/` e cobrem conteúdo, envio de arquivos,
chamados, painel do aluno, retomada de curso, dúvidas e a segurança do quiz (mais de
120 verificações). Eles chamam a API de verdade, criam usuários e cursos temporários e
apagam tudo ao final.

```bash
npm run server                                        # em outro terminal
npm run test:api                                      # API local
npm run test:api -- https://seu-projeto.vercel.app    # API publicada
```

Também rode `npm run lint` e `npm run build` antes de abrir um Pull Request.

## Deploy na Vercel

1. Importe o repositório na Vercel (o framework Vite é detectado sozinho).
2. Em **Settings → Environment Variables**, cadastre `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`.
3. No Supabase, em **Authentication → URL Configuration**, defina a URL do site e
   adicione `https://seu-projeto.vercel.app/**` às Redirect URLs (recuperação de senha).

Cada merge na branch `main` publica uma nova versão automaticamente.

## Fluxo de desenvolvimento

Cada funcionalidade é feita em uma branch própria, com commits descritivos, e integrada
à `main` por Pull Request, após lint, build e testes.

## Estrutura

```text
api/                  # função serverless da Vercel (reaproveita o app Express)
backend/
  database/           # scripts SQL de schema, migrações e dados de demonstração
  src/                # API Express, autenticação e regras de acesso
  tests/              # testes de integração da API
docs/                 # documentação de requisitos e fluxogramas
src/
  components/         # componentes React reutilizáveis
  pages/              # telas (landing, login, catálogo, player, painéis...)
  services/api.js     # cliente HTTP da API
  styles/ui.css       # linguagem visual
  utils/              # progresso, certificado em PDF, chamados
```
