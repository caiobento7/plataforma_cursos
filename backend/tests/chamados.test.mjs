// Teste de ponta a ponta dos chamados de suporte (aluno abre, admin responde/encerra).
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
  const other = await makeUser('outro', 'student');

  const course = await api('POST', '/api/courses', admin.token, { title: `[TESTE] Chamados ${stamp}`, price: 0, level: 'Iniciante' });
  courseId = course.body.id;
  await api('POST', '/api/enrollments', student.token, { courseId });

  const general = await api('POST', '/api/support-tickets', student.token, { courseId: null, subject: 'Não consigo ver o certificado', message: 'O botão de baixar o certificado não faz nada.' });
  check('aluno abre chamado geral (201)', general.status === 201 && general.body.status === 'open', JSON.stringify(general.body));
  const withCourse = await api('POST', '/api/support-tickets', student.token, { courseId, subject: 'Dúvida no curso', message: 'O vídeo da aula 2 não carrega.' });
  check('aluno abre chamado de curso matriculado (201)', withCourse.status === 201 && withCourse.body.courseTitle?.includes('[TESTE]'), JSON.stringify(withCourse.body));

  const notEnrolled = await api('POST', '/api/support-tickets', other.token, { courseId, subject: 'Assunto ok', message: 'Mensagem ok aqui.' });
  check('aluno sem matrícula no curso é bloqueado (403)', notEnrolled.status === 403, JSON.stringify(notEnrolled.body));
  const adminCreates = await api('POST', '/api/support-tickets', admin.token, { courseId: null, subject: 'Assunto ok', message: 'Mensagem ok aqui.' });
  check('admin não abre chamado (403)', adminCreates.status === 403, JSON.stringify(adminCreates.body));
  const shortSubject = await api('POST', '/api/support-tickets', student.token, { courseId: null, subject: 'oi', message: 'Mensagem válida aqui.' });
  check('assunto curto demais responde 400', shortSubject.status === 400, `${shortSubject.status} ${JSON.stringify(shortSubject.body)}`);
  const longMessage = await api('POST', '/api/support-tickets', student.token, { courseId: null, subject: 'Assunto válido', message: 'x'.repeat(2001) });
  check('mensagem longa demais responde 400', longMessage.status === 400, `${longMessage.status} ${JSON.stringify(longMessage.body)}`);
  const empty = await api('POST', '/api/support-tickets', student.token, { courseId: null, subject: '', message: '' });
  check('campos vazios respondem 400', empty.status === 400, JSON.stringify(empty.body));

  const mine = await api('GET', '/api/support-tickets/me', student.token);
  check('aluno lista os próprios 2 chamados', mine.status === 200 && mine.body.length === 2, JSON.stringify(mine.body));
  const othersList = await api('GET', '/api/support-tickets/me', other.token);
  check('outro aluno não vê chamados alheios', othersList.status === 200 && othersList.body.length === 0, JSON.stringify(othersList.body));
  const studentAdminList = await api('GET', '/api/admin/support-tickets', student.token);
  check('aluno não acessa lista do admin (403)', studentAdminList.status === 403);

  const adminList = await api('GET', '/api/admin/support-tickets', admin.token);
  check('admin vê os chamados abertos', adminList.status === 200 && adminList.body.some((t) => t.id === general.body.id), `${adminList.status}`);

  const noAnswer = await api('PUT', `/api/admin/support-tickets/${general.body.id}`, admin.token, { status: 'answered', adminResponse: '  ' });
  check('responder sem texto responde 400', noAnswer.status === 400);
  const answered = await api('PUT', `/api/admin/support-tickets/${general.body.id}`, admin.token, { status: 'answered', adminResponse: 'O certificado libera com 60% do curso concluído.' });
  check('admin responde (status answered)', answered.status === 200 && answered.body.status === 'answered' && answered.body.adminResponse, JSON.stringify(answered.body));
  const studentSees = await api('GET', '/api/support-tickets/me', student.token);
  check('aluno vê a resposta', studentSees.body.find((t) => t.id === general.body.id)?.adminResponse?.includes('60%'));

  const closed = await api('PUT', `/api/admin/support-tickets/${withCourse.body.id}`, admin.token, { status: 'closed', adminResponse: '' });
  check('admin encerra sem resposta', closed.status === 200 && closed.body.status === 'closed', JSON.stringify(closed.body));
  const studentUpdates = await api('PUT', `/api/admin/support-tickets/${general.body.id}`, student.token, { status: 'closed' });
  check('aluno não usa a rota de admin (403)', studentUpdates.status === 403);
  const answerClosed = await api('PUT', `/api/admin/support-tickets/${withCourse.body.id}`, admin.token, { status: 'answered', adminResponse: 'Resposta tardia' });
  check('admin não responde chamado encerrado (409)', answerClosed.status === 409, `${answerClosed.status} ${JSON.stringify(answerClosed.body)}`);
  const otherCloses = await api('PATCH', `/api/support-tickets/${general.body.id}/close`, other.token);
  check('outro aluno não encerra chamado alheio (404)', otherCloses.status === 404, `${otherCloses.status}`);
  const studentCloses = await api('PATCH', `/api/support-tickets/${general.body.id}/close`, student.token);
  check('aluno encerra o próprio chamado', studentCloses.status === 200 && studentCloses.body.status === 'closed' && studentCloses.body.adminResponse, JSON.stringify(studentCloses.body));
  check('chamado traz updatedAt', Boolean(studentCloses.body.updatedAt));
  const tooLongAnswer = await api('PUT', `/api/admin/support-tickets/${general.body.id}`, admin.token, { status: 'answered', adminResponse: 'x'.repeat(2001) });
  check('resposta longa demais responde 400', tooLongAnswer.status === 400, `${tooLongAnswer.status}`);
  const missing = await api('PUT', '/api/admin/support-tickets/999999999', admin.token, { status: 'closed' });
  check('chamado inexistente responde 404', missing.status === 404, JSON.stringify(missing.body));
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  if (courseId) await supabaseAdmin.from('courses').delete().eq('id', courseId);
  for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}
