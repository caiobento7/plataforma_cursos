// Teste do "Continue de onde parou": última aula acessada, próxima aula e módulos bloqueados.
// Uso: npm run test:api [-- <url-da-api>]  (padrão: http://localhost:3001)
import { supabaseAdmin } from '../src/supabase.js';

const base = process.env.API_URL || 'http://localhost:3001';

const stamp = Date.now();
const users = [];
const courses = [];
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
const video = (id, title) => ({ id, title, duration: '10 min', type: 'video' });

try {
  const admin = await makeUser('admin', 'admin');
  const student = await makeUser('aluno', 'student');
  const outsider = await makeUser('outro', 'student');

  const createCourse = async (title, modules) => {
    const id = (await api('POST', '/api/courses', admin.token, { title, price: 0, level: 'Iniciante' })).body.id;
    courses.push(id);
    const content = (await api('PUT', `/api/courses/${id}/content`, admin.token, { modules })).body;
    return { id, lessons: Object.fromEntries(content.flatMap((module) => module.lessons).map((lesson) => [lesson.title, lesson.id])) };
  };

  const courseA = await createCourse(`[TESTE] Retomar A ${stamp}`, [
    { id: 'm1', title: 'Módulo 1', lessons: [video('a', 'A'), video('b', 'B'), video('c', 'C')] },
    { id: 'm2', title: 'Módulo 2', lessons: [video('d', 'D'), video('e', 'E')] },
  ]);
  const courseB = await createCourse(`[TESTE] Retomar B ${stamp}`, [
    { id: 'm1', title: 'Módulo 1', lessons: [video('x', 'X'), video('y', 'Y')] },
  ]);
  await api('POST', '/api/enrollments', student.token, { courseId: courseA.id });
  await api('POST', '/api/enrollments', student.token, { courseId: courseB.id });

  const L = courseA.lessons;
  const progressOf = async (courseId) => (await api('GET', '/api/enrollments/me', student.token)).body.find((item) => item.course.id === courseId).progress;
  const access = (courseId, lessonId) => api('PUT', `/api/courses/${courseId}/last-lesson`, student.token, { lessonId });
  const complete = (lessonId, completed = true) => api('PUT', `/api/lessons/${lessonId}/progress`, student.token, { completed });

  let p = await progressOf(courseA.id);
  check('sem acesso: próxima é a primeira aula (A, 1/1)', p.nextLesson?.id === L.A && p.nextLesson.moduleNumber === 1 && p.nextLesson.lessonNumber === 1 && p.lastAccessedAt === null, JSON.stringify(p));

  const opened = await access(courseA.id, L.B);
  check('registrar aula aberta responde 204', opened.status === 204, JSON.stringify(opened));
  p = await progressOf(courseA.id);
  check('abriu B sem concluir: continua em B', p.nextLesson?.id === L.B && Boolean(p.lastAccessedAt), JSON.stringify(p.nextLesson));

  await complete(L.B);
  p = await progressOf(courseA.id);
  check('concluiu B: próxima é a seguinte (C), não a A pendente', p.nextLesson?.id === L.C, JSON.stringify(p.nextLesson));

  await complete(L.A);
  await access(courseA.id, L.D);
  p = await progressOf(courseA.id);
  check('abriu D com módulo 2 bloqueado (C pendente): sugere C', p.nextLesson?.id === L.C, JSON.stringify(p.nextLesson));

  await complete(L.C);
  p = await progressOf(courseA.id);
  check('módulo 2 liberado: volta para D, a última aberta', p.nextLesson?.id === L.D && p.nextLesson.moduleNumber === 2 && p.nextLesson.lessonNumber === 1, JSON.stringify(p.nextLesson));

  const playerProgress = await api('GET', `/api/courses/${courseA.id}/progress`, student.token);
  check('player recebe a mesma aula (nextLessonId = D)', playerProgress.body.nextLessonId === L.D && playerProgress.body.completedLessonIds.length === 3, JSON.stringify(playerProgress.body));

  await complete(L.D);
  p = await progressOf(courseA.id);
  check('concluiu D (última aberta): próxima é E', p.nextLesson?.id === L.E, JSON.stringify(p.nextLesson));

  await complete(L.B, false);
  p = await progressOf(courseA.id);
  check('desmarcou B: B volta a ser pendente e o módulo 2 bloqueia, sugere B', p.nextLesson?.id === L.B, JSON.stringify(p.nextLesson));
  await complete(L.B);

  await complete(L.E);
  p = await progressOf(courseA.id);
  check('tudo concluído: sem próxima aula', p.nextLesson === null && p.percent === 100, JSON.stringify(p));

  const before = (await progressOf(courseA.id)).lastAccessedAt;
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await access(courseB.id, courseB.lessons.Y);
  const pB = await progressOf(courseB.id);
  check('curso B acessado depois tem lastAccessedAt mais recente', pB.lastAccessedAt > before && pB.nextLesson?.id === courseB.lessons.Y, JSON.stringify(pB));

  const wrongCourse = await access(courseB.id, L.A);
  check('aula de outro curso (404)', wrongCourse.status === 404, JSON.stringify(wrongCourse));
  const notEnrolled = await api('PUT', `/api/courses/${courseA.id}/last-lesson`, outsider.token, { lessonId: L.A });
  check('aluno sem matrícula (404)', notEnrolled.status === 404, JSON.stringify(notEnrolled));
  const invalid = await access(courseA.id, 'abc');
  check('aula inválida (400)', invalid.status === 400);
  const noAuth = await api('PUT', `/api/courses/${courseA.id}/last-lesson`, null, { lessonId: L.A });
  check('sem token (401)', noAuth.status === 401);

  const certificate = await api('GET', `/api/enrollments/${courseA.id}/certificate`, student.token);
  check('certificado continua funcionando', certificate.status === 200, JSON.stringify(certificate.body));
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  for (const id of courses) await supabaseAdmin.from('courses').delete().eq('id', id);
  for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}
