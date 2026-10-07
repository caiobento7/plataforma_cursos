# Backend CursoLab

API REST em Node.js e Express. O banco de dados, a autenticação e o armazenamento de
arquivos são fornecidos pelo Supabase (PostgreSQL, Auth e Storage).

- `src/app.js` monta o app Express com todas as rotas.
- `src/server.js` inicia o servidor local (`npm run server`).
- `../api/index.js` reaproveita o mesmo app como função serverless na Vercel.
- `src/middleware/` contém `requireAuth` (token válido) e `requireAdmin` (papel de gestão).

## Configuração

1. No **SQL Editor** do Supabase, execute os scripts de `database/` na ordem indicada no
   [README principal](../README.md#1-banco-de-dados).
2. Crie `backend/.env` a partir de `.env.example` com a URL do projeto e as chaves. Nunca
   faça commit desse arquivo.

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_publica
SUPABASE_SECRET_KEY=sua_chave_secreta
```

## Executar e testar

Na raiz do projeto:

```bash
npm run server      # API em http://localhost:3001 (GET /api/health)
npm run test:api    # testes de integração (com a API rodando)
npm run seed:cursos # cadastra o conteúdo real dos 6 cursos (scripts/cursos-reais/)
```

## Rotas

Para as rotas protegidas, envie o cabeçalho `Authorization: Bearer SEU_ACCESS_TOKEN`.
**Gestão** indica rotas exclusivas do administrador.

### Autenticação e conta

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Público | Verifica se a API está no ar. |
| `POST` | `/api/auth/register` | Público | Cria um aluno no Supabase Auth e em `profiles`. |
| `POST` | `/api/auth/login` | Público | Autentica e devolve os tokens de acesso e de renovação. |
| `POST` | `/api/auth/refresh` | Público | Renova a sessão com o token de renovação. |
| `POST` | `/api/auth/password-recovery` | Público | Envia o e-mail de redefinição de senha. |
| `POST` | `/api/auth/recovery-session` | Público | Troca o código do link de redefinição por uma sessão. |
| `POST` | `/api/auth/update-password` | Autenticado | Grava a nova senha (fluxo de redefinição). |
| `POST` | `/api/auth/change-password` | Autenticado | Troca a senha, confirmando a senha atual. |
| `GET` | `/api/students/me` | Autenticado | Perfil do usuário autenticado. |
| `PATCH` | `/api/students/me` | Autenticado | Atualiza o nome (3 a 100 caracteres). |

### Cursos e conteúdo

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/courses` | Público | Lista o catálogo. |
| `POST` | `/api/courses` | Gestão | Cria um curso. |
| `PUT` | `/api/courses/:courseId` | Gestão | Edita um curso. |
| `DELETE` | `/api/courses/:courseId` | Gestão | Exclui um curso. |
| `GET` | `/api/courses/:courseId/content` | Conforme o acesso | Visitante: só a grade. Aluno matriculado: aulas sem o gabarito dos quizzes. Gestão: tudo. |
| `PUT` | `/api/courses/:courseId/content` | Gestão | Salva módulos, aulas e quizzes numa transação (`save_course_content`). |
| `POST` | `/api/courses/:courseId/uploads` | Gestão | URL assinada para enviar vídeo (`kind: video`, até 50 MB) ou material (`kind: material`, até 20 MB). |
| `POST` | `/api/courses/:courseId/modules` | Gestão | Cria um módulo (rota granular; o editor usa a gravação completa). |
| `POST` | `/api/modules/:moduleId/lessons` | Gestão | Cria uma aula (rota granular; o editor usa a gravação completa). |

### Aprendizagem

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/enrollments` | Autenticado | Matricula o aluno no curso (409 se já matriculado). |
| `GET` | `/api/enrollments/me` | Autenticado | Cursos do aluno com progresso, última atividade e próxima aula. |
| `GET` | `/api/courses/:courseId/progress` | Autenticado | Aulas concluídas e a aula em que o aluno deve continuar. |
| `PUT` | `/api/courses/:courseId/last-lesson` | Autenticado | Registra a última aula aberta ("Continue de onde parou"). |
| `PUT` | `/api/lessons/:lessonId/progress` | Autenticado | Marca ou desmarca a conclusão de uma aula de vídeo. |
| `POST` | `/api/lessons/:lessonId/quiz-attempt` | Autenticado | Corrige o quiz no servidor e conclui a aula se aprovado. |
| `GET` | `/api/enrollments/:courseId/certificate` | Autenticado | Dados do certificado; liberado a partir de 60% das aulas. |

### Dúvidas e suporte

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/lessons/:lessonId/questions` | Autenticado | Dúvidas da aula com as respostas. |
| `POST` | `/api/lessons/:lessonId/questions` | Autenticado | Envia uma dúvida (5 a 1000 caracteres). |
| `GET` | `/api/admin/lesson-questions` | Gestão | Dúvidas de todos os cursos, sem resposta primeiro. |
| `PATCH` | `/api/questions/:questionId/answer` | Gestão | Responde a uma dúvida. |
| `POST` | `/api/support-tickets` | Autenticado | Aluno abre um chamado (geral ou de um curso matriculado). |
| `GET` | `/api/support-tickets/me` | Autenticado | Chamados do aluno. |
| `PATCH` | `/api/support-tickets/:ticketId/close` | Autenticado | Aluno encerra o próprio chamado. |
| `GET` | `/api/admin/support-tickets` | Gestão | Todos os chamados. |
| `PUT` | `/api/admin/support-tickets/:ticketId` | Gestão | Responde ou encerra um chamado. |
| `GET` | `/api/admin/analytics` | Gestão | Indicadores consolidados do catálogo. |

Exemplo de cadastro (Postman/Insomnia):

```json
{
  "fullName": "Maria Silva",
  "email": "maria@example.com",
  "password": "senha-segura"
}
```
