// Teste das dúvidas das aulas: aluno pergunta, admin lista e responde, aluno vê a resposta.
// Uso: npm run test:api [-- <url-da-api>]  (padrão: http://localhost:3001)
import { supabaseAdmin } from '../src/supabase.js';

const base = process.env.API_URL || 'http://localhost:3001';

const stamp = Date.now();
const users = [];
let courseId;
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${!ok && detail ? ` -> ${detail}` : ''}`);
  if (!ok) failures += 1;
};
const api = async (method, url, token, body) => {
  const r = await fetch(`${base}${url}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text.slice(0, 120); }
  return { status: r.status, body: parsed };
};
const makeUser = async (label, role) => {
  const email = `teste-${label}-${stamp}@cursolab.test`;
  const password = `Teste-${stamp}`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Teste ${label}` } });
  if (error) throw error;
  users.push(data.user.id);
  if (role === 'admin') await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
  const login = await api('POST', '/api/auth/login', null, { email, password });
  return { id: data.user.id, token: login.body.accessToken };
};

try {
  const admin = await makeUser('admin', 'admin');
  const student = await makeUser('aluno', 'student');
  const outsider = await makeUser('outro', 'student');

  courseId = (await api('POST', '/api/courses', admin.token, { title: `[TESTE] Dúvidas ${stamp}`, price: 0, level: 'Iniciante' })).body.id;
  const content = (await api('PUT', `/api/courses/${courseId}/content`, admin.token, { modules: [
    { id: 'm1', title: 'Módulo 1', lessons: [{ id: 'a', title: 'Aula com dúvida', duration: '10 min', type: 'video' }] },
  ] })).body;
  const lessonId = content[0].lessons[0].id;
  await api('POST', '/api/enrollments', student.token, { courseId });

  const empty = await api('GET', `/api/lessons/${lessonId}/questions`, student.token);
  check('aula sem dúvidas devolve lista vazia', empty.status === 200 && empty.body.length === 0, JSON.stringify(empty.body));

  const short = await api('POST', `/api/lessons/${lessonId}/questions`, student.token, { text: 'oi' });
  check('dúvida curta demais (400)', short.status === 400, JSON.stringify(short.body));
  const long = await api('POST', `/api/lessons/${lessonId}/questions`, student.token, { text: 'x'.repeat(1001) });
  check('dúvida longa demais (400)', long.status === 400);
  const outsiderAsk = await api('POST', `/api/lessons/${lessonId}/questions`, outsider.token, { text: 'Posso perguntar sem matrícula?' });
  check('aluno sem matrícula não pergunta (403)', outsiderAsk.status === 403);

  const asked = await api('POST', `/api/lessons/${lessonId}/questions`, student.token, { text: 'Qual a diferença entre lista e tupla?' });
  check('aluno envia dúvida (201)', asked.status === 201, JSON.stringify(asked.body));

  const listed = await api('GET', `/api/lessons/${lessonId}/questions`, student.token);
  check('dúvida aparece na aula com o nome do autor', listed.body.length === 1 && listed.body[0].author === 'Teste aluno' && listed.body[0].answer === null, JSON.stringify(listed.body));

  const studentAdminList = await api('GET', '/api/admin/lesson-questions', student.token);
  check('aluno não acessa a lista do backoffice (403)', studentAdminList.status === 403);
  const adminList = await api('GET', '/api/admin/lesson-questions', admin.token);
  const mine = adminList.body.find((question) => question.id === asked.body.id);
  check('admin vê a dúvida com curso, aula e autor', mine?.courseTitle?.includes('[TESTE] Dúvidas') && mine.lessonTitle === 'Aula com dúvida' && mine.author === 'Teste aluno' && mine.answer === null, JSON.stringify(mine));
  const firstAnsweredIndex = adminList.body.findIndex((question) => question.answer);
  const lastPendingIndex = adminList.body.map((question) => Boolean(question.answer)).lastIndexOf(false);
  check('sem resposta vêm antes das respondidas', firstAnsweredIndex === -1 || lastPendingIndex < firstAnsweredIndex);

  const emptyAnswer = await api('PATCH', `/api/questions/${asked.body.id}/answer`, admin.token, { answer: '  ' });
  check('resposta vazia (400)', emptyAnswer.status === 400);
  const studentAnswers = await api('PATCH', `/api/questions/${asked.body.id}/answer`, student.token, { answer: 'Eu mesmo respondo' });
  check('aluno não responde (403)', studentAnswers.status === 403);
  const answered = await api('PATCH', `/api/questions/${asked.body.id}/answer`, admin.token, { answer: 'Listas são mutáveis; tuplas, não.' });
  check('admin responde (200)', answered.status === 200, JSON.stringify(answered.body));

  const afterAnswer = await api('GET', `/api/lessons/${lessonId}/questions`, student.token);
  check('aluno vê a resposta do instrutor', afterAnswer.body[0].answer?.text === 'Listas são mutáveis; tuplas, não.' && afterAnswer.body[0].answer.author === 'Teste admin', JSON.stringify(afterAnswer.body[0]));

  const outsiderRead = await api('GET', `/api/lessons/${lessonId}/questions`, outsider.token);
  check('aluno sem matrícula não lê as dúvidas (403)', outsiderRead.status === 403);
  const noAuth = await api('GET', '/api/admin/lesson-questions');
  check('lista do backoffice sem token (401)', noAuth.status === 401);
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  if (courseId) await supabaseAdmin.from('courses').delete().eq('id', courseId);
  for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}
