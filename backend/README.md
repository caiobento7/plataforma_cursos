# Backend CursoLab

API REST em Node.js e Express. O banco de dados e a autenticação são fornecidos pelo
PostgreSQL/Supabase. O frontend ainda não está integrado: primeiro validamos estas
rotas isoladamente.

## Configuração

1. No Supabase, abra o **SQL Editor**, copie e execute todo o conteúdo de
   `database/schema.sql`.
2. No mesmo editor, execute `database/seed.sql` para cadastrar os seis cursos
   iniciais no banco.
3. No Explorer do VS Code, dentro de `backend`, crie o arquivo `.env`.
4. Copie a estrutura de `.env.example` e preencha a URL do projeto e a nova Secret key
   do Supabase. Nunca faça commit desse arquivo.

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://seu-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_publica
SUPABASE_SECRET_KEY=sb_secret_sua_chave
```

## Executar

Na raiz do projeto:

```bash
npm run server
```

O terminal deve informar que a API está disponível em `http://localhost:3001`.
Teste a saúde do serviço em `http://localhost:3001/api/health`.

## Rotas disponíveis

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cria um aluno no Supabase Auth e em `profiles`. |
| `POST` | `/api/auth/login` | Autentica e devolve um access token. |
| `GET` | `/api/students/me` | Retorna o perfil do aluno autenticado. |
| `GET` | `/api/courses` | Lista cursos cadastrados no banco. |
| `POST` | `/api/courses` | Cria curso; exclusivo do administrador autenticado. |
| `PUT` | `/api/courses/:courseId` | Edita qualquer curso; exclusivo do administrador. |
| `DELETE` | `/api/courses/:courseId` | Exclui qualquer curso; exclusivo do administrador. |
| `GET` | `/api/courses/:courseId/content` | Retorna módulos, aulas e quizzes de um curso. |
| `POST` | `/api/courses/:courseId/modules` | Cria módulo em qualquer curso; exclusivo do administrador. |
| `POST` | `/api/modules/:moduleId/lessons` | Cria aula ou quiz no módulo; exclusivo do administrador. |
| `GET` | `/api/courses/:courseId/progress` | Retorna aulas concluídas pelo usuário autenticado. |
| `PUT` | `/api/lessons/:lessonId/progress` | Salva conclusão de aula para o usuário autenticado. |
| `GET` | `/api/lessons/:lessonId/questions` | Lista dúvidas de uma aula acessível ao usuário. |
| `POST` | `/api/lessons/:lessonId/questions` | Envia uma dúvida sobre uma aula. |
| `PATCH` | `/api/questions/:questionId/answer` | Responde uma dúvida; exclusivo do administrador. |
| `POST` | `/api/enrollments` | Cria uma matrícula para o aluno autenticado. |
| `GET` | `/api/enrollments/me` | Lista as matrículas do aluno autenticado. |

Para as rotas protegidas, envie o cabeçalho:

```text
Authorization: Bearer SEU_ACCESS_TOKEN
```

Exemplo de cadastro no Postman/Insomnia:

```json
{
  "fullName": "Maria Silva",
  "email": "maria@example.com",
  "password": "senha-segura"
}
```
