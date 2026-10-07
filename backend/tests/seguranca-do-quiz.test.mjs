// Teste da proteção do conteúdo e da correção do quiz no servidor.
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
const hasAnswerKey = (content) => JSON.stringify(content).includes('"correct"');
const hasMedia = (content) => JSON.stringify(content).includes('videoUrl');

try {
  const admin = await makeUser('admin', 'admin');
  const student = await makeUser('aluno', 'student');
  const outsider = await makeUser('outro', 'student');

  courseId = (await api('POST', '/api/courses', admin.token, { title: `[TESTE] Quiz seguro ${stamp}`, price: 0, level: 'Iniciante' })).body.id;
  const saved = (await api('PUT', `/api/courses/${courseId}/content`, admin.token, { modules: [
    { id: 'm1', title: 'Módulo 1', lessons: [
      { id: 'v', title: 'Vídeo', duration: '10 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'q', title: 'Quiz', duration: '5 min', type: 'quiz', quizData: { passMark: 50, questions: [
        { text: 'Pergunta 1?', options: ['A', 'B'], correct: 'A' },
        { text: 'Pergunta 2?', options: ['C', 'D'], correct: 'D' },
      ] } },
    ] },
  ] })).body;
  const quizLesson = saved[0].lessons[1];
  const videoLesson = saved[0].lessons[0];
  await api('POST', '/api/enrollments', student.token, { courseId });

  const visitor = await api('GET', `/api/courses/${courseId}/content`);
  check('visitante vê só a grade (sem vídeo nem gabarito)', visitor.status === 200 && visitor.body[0].lessons.length === 2 && !hasMedia(visitor.body) && !hasAnswerKey(visitor.body) && !visitor.body[0].lessons[1].quizData, JSON.stringify(visitor.body));
  const notEnrolled = await api('GET', `/api/courses/${courseId}/content`, outsider.token);
  check('aluno sem matrícula vê só a grade', !hasMedia(notEnrolled.body) && !hasAnswerKey(notEnrolled.body));
  const enrolled = await api('GET', `/api/courses/${courseId}/content`, student.token);
  const studentQuiz = enrolled.body[0].lessons[1].quizData;
  check('aluno matriculado recebe vídeo e perguntas', hasMedia(enrolled.body) && studentQuiz?.questions.length === 2 && studentQuiz.questions[0].options.length === 2, JSON.stringify(enrolled.body));
  check('aluno matriculado não recebe o gabarito', !hasAnswerKey(enrolled.body), JSON.stringify(studentQuiz));
  const adminContent = await api('GET', `/api/courses/${courseId}/content`, admin.token);
  check('admin recebe o gabarito (editor)', hasAnswerKey(adminContent.body));

  const shortcut = await api('PUT', `/api/lessons/${quizLesson.id}/progress`, student.token, { completed: true });
  check('não marca quiz como concluído sem fazer (400)', shortcut.status === 400, JSON.stringify(shortcut.body));
  const videoDone = await api('PUT', `/api/lessons/${videoLesson.id}/progress`, student.token, { completed: true });
  check('vídeo continua sendo marcado normalmente', videoDone.status === 200);

  const [q1, q2] = studentQuiz.questions;
  const failed = await api('POST', `/api/lessons/${quizLesson.id}/quiz-attempt`, student.token, { answers: { [q1.id]: 'B', [q2.id]: 'C' } });
  check('tentativa com 0% reprova', failed.status === 200 && failed.body.score === 0 && failed.body.passed === false && failed.body.passMark === 50, JSON.stringify(failed.body));
  let progress = await api('GET', `/api/courses/${courseId}/progress`, student.token);
  check('reprovação não conclui o quiz', !progress.body.completedLessonIds.includes(quizLesson.id));

  const passed = await api('POST', `/api/lessons/${quizLesson.id}/quiz-attempt`, student.token, { answers: { [q1.id]: 'A', [q2.id]: 'C' } });
  check('tentativa com 50% aprova (nota mínima 50)', passed.body.score === 50 && passed.body.passed === true && passed.body.correctAnswers === 1, JSON.stringify(passed.body));
  progress = await api('GET', `/api/courses/${courseId}/progress`, student.token);
  check('aprovação conclui o quiz no servidor', progress.body.completedLessonIds.includes(quizLesson.id), JSON.stringify(progress.body));
  check('resposta da tentativa não revela o gabarito', !JSON.stringify(passed.body).includes('correct_answer') && !('correct' in passed.body));

  const outsiderAttempt = await api('POST', `/api/lessons/${quizLesson.id}/quiz-attempt`, outsider.token, { answers: {} });
  check('aluno sem matrícula não faz o quiz (403)', outsiderAttempt.status === 403);
  const videoAttempt = await api('POST', `/api/lessons/${videoLesson.id}/quiz-attempt`, student.token, { answers: {} });
  check('tentativa em aula de vídeo (400)', videoAttempt.status === 400);
  const noAnswers = await api('POST', `/api/lessons/${quizLesson.id}/quiz-attempt`, student.token, {});
  check('sem respostas (400)', noAnswers.status === 400);
  const noAuth = await api('POST', `/api/lessons/${quizLesson.id}/quiz-attempt`, null, { answers: {} });
  check('sem token (401)', noAuth.status === 401);
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  if (courseId) await supabaseAdmin.from('courses').delete().eq('id', courseId);
  for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}
