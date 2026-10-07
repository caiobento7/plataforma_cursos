// Teste do prazo de acesso: expiração da matrícula, bloqueio das aulas e renovação.
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
const monthsFromNow = (expiresAt) => (new Date(expiresAt) - Date.now()) / (30.44 * 24 * 60 * 60 * 1000);

try {
  const admin = await makeUser('admin', 'admin');
  const student = await makeUser('aluno', 'student');

  const invalid = await api('POST', '/api/courses', admin.token, { title: `[TESTE] Prazo inválido ${stamp}`, price: 0, level: 'Iniciante', accessMonths: 40 });
  check('prazo acima de 36 meses é recusado (400)', invalid.status === 400, JSON.stringify(invalid.body));

  const defaultCourse = (await api('POST', '/api/courses', admin.token, { title: `[TESTE] Prazo padrão ${stamp}`, price: 0, level: 'Iniciante' })).body;
  courses.push(defaultCourse.id);
  check('curso sem prazo informado usa 6 meses', defaultCourse.access_months === 6, JSON.stringify(defaultCourse));

  const course = (await api('POST', '/api/courses', admin.token, { title: `[TESTE] Prazo 3 meses ${stamp}`, price: 0, level: 'Iniciante', accessMonths: 3 })).body;
  courses.push(course.id);
  check('curso criado com prazo de 3 meses', course.access_months === 3, JSON.stringify(course));

  const edited = await api('PUT', `/api/courses/${defaultCourse.id}`, admin.token, { title: defaultCourse.title, price: 0, level: 'Iniciante' });
  check('edição sem o campo mantém o prazo atual', edited.body.access_months === 6, JSON.stringify(edited.body));

  const saved = (await api('PUT', `/api/courses/${course.id}/content`, admin.token, { modules: [
    { id: 'm1', title: 'Módulo 1', lessons: [
      { id: 'a', title: 'Aula 1', duration: '10 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'b', title: 'Aula 2', duration: '10 min', type: 'video' },
    ] },
  ] })).body;
  const [lessonA, lessonB] = saved[0].lessons;

  const enrolled = await api('POST', '/api/enrollments', student.token, { courseId: course.id });
  check('matrícula grava a data de expiração (~3 meses)', enrolled.status === 201 && Math.abs(monthsFromNow(enrolled.body.expires_at) - 3) < 0.2, JSON.stringify(enrolled.body));
  const duplicate = await api('POST', '/api/enrollments', student.token, { courseId: course.id });
  check('matrícula ativa duplicada (409)', duplicate.status === 409);

  await api('PUT', `/api/lessons/${lessonA.id}/progress`, student.token, { completed: true });
  await api('PUT', `/api/lessons/${lessonB.id}/progress`, student.token, { completed: true });

  let mine = (await api('GET', '/api/enrollments/me', student.token)).body.find((item) => item.course.id === course.id);
  check('lista de matrículas traz expires_at e o prazo do curso', Boolean(mine.expires_at) && mine.course.access_months === 3, JSON.stringify(mine));

  // Expira a matrícula diretamente no banco.
  await supabaseAdmin.from('enrollments').update({ expires_at: new Date(Date.now() - 86400000).toISOString() }).eq('student_id', student.id).eq('course_id', course.id);

  const content = await api('GET', `/api/courses/${course.id}/content`, student.token);
  check('acesso expirado: conteúdo volta a ser só a grade', !JSON.stringify(content.body).includes('videoUrl'), JSON.stringify(content.body));
  const progress = await api('GET', `/api/courses/${course.id}/progress`, student.token);
  check('acesso expirado: progresso do player bloqueado (403)', progress.status === 403);
  const markLesson = await api('PUT', `/api/lessons/${lessonA.id}/progress`, student.token, { completed: false });
  check('acesso expirado: não altera conclusão (403)', markLesson.status === 403);
  const lastLesson = await api('PUT', `/api/courses/${course.id}/last-lesson`, student.token, { lessonId: lessonA.id });
  check('acesso expirado: não registra aula aberta (403)', lastLesson.status === 403);
  const question = await api('POST', `/api/lessons/${lessonA.id}/questions`, student.token, { text: 'Ainda posso perguntar?' });
  check('acesso expirado: não envia dúvida (403)', question.status === 403);

  const certificate = await api('GET', `/api/enrollments/${course.id}/certificate`, student.token);
  check('certificado conquistado continua disponível', certificate.status === 200, JSON.stringify(certificate.body));
  const ticket = await api('POST', '/api/support-tickets', student.token, { courseId: course.id, subject: 'Acesso expirado', message: 'Meu acesso expirou, como renovo?' });
  check('aluno com acesso expirado ainda abre chamado sobre o curso', ticket.status === 201, JSON.stringify(ticket.body));

  mine = (await api('GET', '/api/enrollments/me', student.token)).body.find((item) => item.course.id === course.id);
  check('curso expirado continua na lista do aluno', mine && new Date(mine.expires_at) < new Date());

  const renewed = await api('POST', '/api/enrollments', student.token, { courseId: course.id });
  check('renovação estende o prazo (~3 meses a partir de agora)', renewed.status === 200 && renewed.body.renewed === true && Math.abs(monthsFromNow(renewed.body.expires_at) - 3) < 0.2, JSON.stringify(renewed.body));

  const afterRenew = await api('GET', `/api/courses/${course.id}/progress`, student.token);
  check('após renovar, o progresso foi mantido', afterRenew.status === 200 && afterRenew.body.completedLessonIds.length === 2, JSON.stringify(afterRenew.body));
  const contentAfter = await api('GET', `/api/courses/${course.id}/content`, student.token);
  check('após renovar, as aulas voltam a ser entregues', JSON.stringify(contentAfter.body).includes('videoUrl'));
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  for (const id of courses) await supabaseAdmin.from('courses').delete().eq('id', id);
  for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}
