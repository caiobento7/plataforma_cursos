// Teste das rotas do painel do aluno: progresso, certificado, perfil e senha.
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
  return { id: data.user.id, email, password, token: login.body.accessToken };
};

try {
  const admin = await makeUser('admin', 'admin');
  const student = await makeUser('aluno', 'student');

  courseId = (await api('POST', '/api/courses', admin.token, { title: `[TESTE] Painel ${stamp}`, price: 0, level: 'Iniciante' })).body.id;
  const content = await api('PUT', `/api/courses/${courseId}/content`, admin.token, { modules: [
    { id: 'm1', title: 'Módulo 1', lessons: [
      { id: 'a', title: 'Aula 1', duration: '30 min', type: 'video' },
      { id: 'b', title: 'Aula 2', duration: '1h 15min', type: 'video' },
      { id: 'c', title: 'Aula 3', duration: '45', type: 'video' },
    ] },
    { id: 'm2', title: 'Módulo 2', lessons: [
      { id: 'd', title: 'Aula 4', duration: '2h', type: 'video' },
      { id: 'e', title: 'Quiz', duration: '10 min', type: 'quiz', quizData: { passMark: 70, questions: [{ text: 'P?', options: ['A', 'B'], correct: 'A' }] } },
    ] },
  ] });
  const lessonIds = content.body.flatMap((module) => module.lessons.map((lesson) => lesson.id));
  check('curso de teste com 5 aulas', lessonIds.length === 5);

  await api('POST', '/api/enrollments', student.token, { courseId });

  let enrollments = await api('GET', '/api/enrollments/me', student.token);
  let mine = enrollments.body.find((item) => item.course.id === courseId);
  check('matrícula traz progresso 0/5', mine?.progress?.totalLessons === 5 && mine.progress.completedLessons === 0 && mine.progress.percent === 0, JSON.stringify(mine?.progress));
  check('próxima aula: módulo 1, aula 1', mine.progress.nextLesson?.title === 'Aula 1' && mine.progress.nextLesson.moduleNumber === 1 && mine.progress.nextLesson.lessonNumber === 1, JSON.stringify(mine.progress.nextLesson));

  for (const id of lessonIds.slice(0, 2)) await api('PUT', `/api/lessons/${id}/progress`, student.token, { completed: true });
  enrollments = await api('GET', '/api/enrollments/me', student.token);
  mine = enrollments.body.find((item) => item.course.id === courseId);
  check('2/5 aulas = 40%, certificado indisponível', mine.progress.percent === 40 && mine.progress.certificateAvailable === false, JSON.stringify(mine.progress));
  check('próxima aula após 2 concluídas: Aula 3', mine.progress.nextLesson?.title === 'Aula 3' && mine.progress.nextLesson.lessonNumber === 3, JSON.stringify(mine.progress.nextLesson));

  const blocked = await api('GET', `/api/enrollments/${courseId}/certificate`, student.token);
  check('certificado bloqueado com aulas pendentes (403)', blocked.status === 403 && blocked.body.error.includes('40%'), JSON.stringify(blocked.body));

  await api('PUT', `/api/lessons/${lessonIds[2]}/progress`, student.token, { completed: true });
  enrollments = await api('GET', '/api/enrollments/me', student.token);
  mine = enrollments.body.find((item) => item.course.id === courseId);
  check('3/5 aulas = 60%, certificado ainda indisponível', mine.progress.percent === 60 && mine.progress.certificateAvailable === false && mine.progress.lastCompletedAt, JSON.stringify(mine.progress));
  check('próxima aula passa para o módulo 2', mine.progress.nextLesson?.title === 'Aula 4' && mine.progress.nextLesson.moduleNumber === 2 && mine.progress.nextLesson.lessonNumber === 1, JSON.stringify(mine.progress.nextLesson));

  // Certificado: todas as aulas concluídas e nota final de pelo menos 70%.
  await api('PUT', `/api/lessons/${lessonIds[3]}/progress`, student.token, { completed: true });
  const quizQuestion = content.body[1].lessons[1].quizData.questions[0];
  await api('POST', `/api/lessons/${lessonIds[4]}/quiz-attempt`, student.token, { answers: { [quizQuestion.id]: 'A' } });
  enrollments = await api('GET', '/api/enrollments/me', student.token);
  mine = enrollments.body.find((item) => item.course.id === courseId);
  check('5/5 aulas com nota 100%: certificado disponível', mine.progress.percent === 100 && mine.progress.quizScore === 100 && mine.progress.certificateAvailable === true, JSON.stringify(mine.progress));

  const certificate = await api('GET', `/api/enrollments/${courseId}/certificate`, student.token);
  check('certificado liberado (200)', certificate.status === 200, JSON.stringify(certificate.body));
  check('certificado traz a nota final', certificate.body.quizScore === 100, JSON.stringify(certificate.body));
  check('certificado com nome, curso e data', certificate.body.studentName === 'Teste aluno' && certificate.body.courseTitle.includes('[TESTE] Painel') && certificate.body.completedAt, JSON.stringify(certificate.body));
  // 30 + 75 + 45 + 120 + 10 = 280 min -> 5 h
  check('carga horária somada (280 min = 5 h)', certificate.body.workloadHours === 5, String(certificate.body.workloadHours));
  check('código de verificação estável', /^CL-[0-9A-F]{10}$/.test(certificate.body.code)
    && (await api('GET', `/api/enrollments/${courseId}/certificate`, student.token)).body.code === certificate.body.code, certificate.body.code);

  const notEnrolled = await api('GET', '/api/enrollments/999999999/certificate', student.token);
  check('certificado de curso sem matrícula (404)', notEnrolled.status === 404);
  const noAuth = await api('GET', `/api/enrollments/${courseId}/certificate`);
  check('certificado sem token (401)', noAuth.status === 401);

  const renamed = await api('PATCH', '/api/students/me', student.token, { fullName: '  Maria   da Silva  ' });
  check('nome atualizado e normalizado', renamed.status === 200 && renamed.body.full_name === 'Maria da Silva', JSON.stringify(renamed.body));
  const shortName = await api('PATCH', '/api/students/me', student.token, { fullName: 'Al' });
  check('nome curto demais (400)', shortName.status === 400);
  const certAfterRename = await api('GET', `/api/enrollments/${courseId}/certificate`, student.token);
  check('certificado usa o nome atualizado', certAfterRename.body.studentName === 'Maria da Silva');

  const wrongCurrent = await api('POST', '/api/auth/change-password', student.token, { currentPassword: 'errada', newPassword: 'NovaSenha123' });
  check('senha atual incorreta (400)', wrongCurrent.status === 400 && wrongCurrent.body.error.includes('incorreta'), JSON.stringify(wrongCurrent.body));
  const shortNew = await api('POST', '/api/auth/change-password', student.token, { currentPassword: student.password, newPassword: '123' });
  check('nova senha curta (400)', shortNew.status === 400);
  const sameNew = await api('POST', '/api/auth/change-password', student.token, { currentPassword: student.password, newPassword: student.password });
  check('nova senha igual à atual (400)', sameNew.status === 400);
  const changed = await api('POST', '/api/auth/change-password', student.token, { currentPassword: student.password, newPassword: 'NovaSenha123' });
  check('senha trocada (200)', changed.status === 200, JSON.stringify(changed.body));
  const oldLogin = await api('POST', '/api/auth/login', null, { email: student.email, password: student.password });
  check('senha antiga deixa de funcionar', oldLogin.status === 401);
  const newLogin = await api('POST', '/api/auth/login', null, { email: student.email, password: 'NovaSenha123' });
  check('login com a nova senha', newLogin.status === 200 && newLogin.body.accessToken);
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  if (courseId) await supabaseAdmin.from('courses').delete().eq('id', courseId);
  for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}
