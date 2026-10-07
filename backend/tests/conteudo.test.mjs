// Teste de ponta a ponta da rota PUT /api/courses/:id/content.
// Uso: npm run test:api [-- <url-da-api>]  (padrão: http://localhost:3001)
import { supabaseAdmin } from '../src/supabase.js';

const base = process.env.API_URL || 'http://localhost:3001';

const stamp = Date.now();
const email = `teste-editor-${stamp}@cursolab.test`;
const password = `Teste-${stamp}`;
let userId;
let courseId;
let failures = 0;

const check = (label, condition, detail = '') => {
  console.log(`${condition ? 'OK  ' : 'FAIL'} ${label}${!condition && detail ? ` -> ${detail}` : ''}`);
  if (!condition) failures += 1;
};

const call = async (method, url, token, body) => {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
};

try {
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: 'Teste Editor' },
  });
  if (createError) throw createError;
  userId = created.user.id;
  await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', userId);

  const login = await call('POST', '/api/auth/login', null, { email, password });
  const token = login.body.accessToken;
  check('login admin temporário', Boolean(token), JSON.stringify(login.body));

  const course = await call('POST', '/api/courses', token, { title: `[TESTE] Editor ${stamp}`, price: 0, level: 'Iniciante' });
  courseId = course.body.id;
  check('curso temporário criado', course.status === 201, JSON.stringify(course.body));

  // 1) Conteúdo inicial com ids temporários
  const first = await call('PUT', `/api/courses/${courseId}/content`, token, { modules: [
    { id: 'modulo-a', title: 'Módulo A', lessons: [
      { id: 'aula-1', title: 'Vídeo 1', duration: '10 min', type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', documentUrl: null, description: '  Primeira aula do módulo.  ', videoCredit: 'Canal Exemplo (YouTube)' },
      { id: 'aula-2', title: 'Vídeo 2', duration: '12 min', type: 'video', videoUrl: '', documentUrl: '' },
      { id: 'aula-3', title: 'Quiz A', duration: '5 min', type: 'quiz', quizData: { passMark: 60, questions: [
        { id: 'q1', text: 'Pergunta 1?', options: ['Sim', 'Não'], correct: 'Sim' },
        { id: 'q2', text: 'Pergunta 2?', options: ['A', 'B', 'C'], correct: 'C' },
      ] } },
    ] },
    { id: 'modulo-b', title: 'Módulo B', lessons: [] },
  ] });
  check('primeiro save responde 200', first.status === 200, JSON.stringify(first.body));
  const [moduleA, moduleB] = first.body;
  check('2 módulos com ids numéricos', first.body.length === 2 && Number.isInteger(moduleA.id) && Number.isInteger(moduleB.id));
  check('3 aulas no módulo A, na ordem', moduleA.lessons.map((l) => l.title).join('|') === 'Vídeo 1|Vídeo 2|Quiz A');
  check('URL vazia vira null', moduleA.lessons[1].videoUrl === null);
  check('descrição e crédito do vídeo salvos', moduleA.lessons[0].description === 'Primeira aula do módulo.' && moduleA.lessons[0].videoCredit === 'Canal Exemplo (YouTube)');
  check('aula sem descrição fica null', moduleA.lessons[1].description === null && moduleA.lessons[1].videoCredit === null);
  const quizA = moduleA.lessons[2];
  check('quiz salvo com nota e 2 perguntas', quizA.quizData?.passMark === 60 && quizA.quizData.questions.length === 2);

  // Progresso de aluno numa aula que será mantida
  const video1 = moduleA.lessons[0];
  await supabaseAdmin.from('lesson_progress').insert({ student_id: userId, lesson_id: video1.id, completed: true, completed_at: new Date().toISOString() });

  // 2) Reordena, renomeia, edita, exclui e troca o quiz
  const second = await call('PUT', `/api/courses/${courseId}/content`, token, { modules: [
    { id: moduleB.id, title: 'Módulo B (renomeado)', lessons: [
      { id: 'aula-nova', title: 'Vídeo novo', duration: '7 min', type: 'video', videoUrl: null, documentUrl: 'https://example.com/apoio.pdf' },
    ] },
    { id: moduleA.id, title: 'Módulo A', lessons: [
      { id: quizA.id, title: 'Quiz A editado', duration: '6 min', type: 'quiz', quizData: { passMark: 80, questions: [
        { text: 'Só uma pergunta?', options: ['Sim', 'Não'], correct: 'Não' },
      ] } },
      { ...video1, title: 'Vídeo 1 editado' },
    ] },
  ] });
  check('segundo save responde 200', second.status === 200, JSON.stringify(second.body));
  const [newFirst, newSecond] = second.body;
  check('módulos reordenados e renomeados', newFirst.id === moduleB.id && newFirst.title === 'Módulo B (renomeado)' && newSecond.id === moduleA.id);
  check('aulas reordenadas mantendo ids', newSecond.lessons[0].id === quizA.id && newSecond.lessons[1].id === video1.id);
  check('título editado', newSecond.lessons[1].title === 'Vídeo 1 editado');
  check('Vídeo 2 excluído', !newSecond.lessons.some((l) => l.title === 'Vídeo 2'));
  check('quiz atualizado (nota 80, 1 pergunta)', newSecond.lessons[0].quizData?.passMark === 80 && newSecond.lessons[0].quizData.questions.length === 1);

  const { data: progress } = await supabaseAdmin.from('lesson_progress').select('id').eq('lesson_id', video1.id).eq('student_id', userId);
  check('progresso do aluno preservado', progress?.length === 1);

  // 3) Quiz vira vídeo: o quiz antigo deve sumir
  const third = await call('PUT', `/api/courses/${courseId}/content`, token, { modules: [
    { id: moduleA.id, title: 'Módulo A', lessons: [
      { id: quizA.id, title: 'Agora é vídeo', duration: '6 min', type: 'video', videoUrl: null, documentUrl: null },
    ] },
  ] });
  check('terceiro save responde 200', third.status === 200, JSON.stringify(third.body));
  const { data: leftoverQuiz } = await supabaseAdmin.from('quizzes').select('id').eq('lesson_id', quizA.id);
  check('quiz removido ao virar vídeo', leftoverQuiz?.length === 0);
  check('módulo B excluído', third.body.length === 1);

  // 4) Validações
  const invalids = [
    ['módulo sem título', { modules: [{ id: 'x', title: ' ', lessons: [] }] }],
    ['aula sem duração', { modules: [{ id: 'x', title: 'M', lessons: [{ id: 'a', title: 'A', duration: '', type: 'video' }] }] }],
    ['URL inválida', { modules: [{ id: 'x', title: 'M', lessons: [{ id: 'a', title: 'A', duration: '1', type: 'video', videoUrl: 'javascript:alert(1)' }] }] }],
    ['quiz sem perguntas', { modules: [{ id: 'x', title: 'M', lessons: [{ id: 'a', title: 'Q', duration: '1', type: 'quiz', quizData: { passMark: 70, questions: [] } }] }] }],
    ['resposta fora das opções', { modules: [{ id: 'x', title: 'M', lessons: [{ id: 'a', title: 'Q', duration: '1', type: 'quiz', quizData: { passMark: 70, questions: [{ text: 'P', options: ['A', 'B'], correct: 'C' }] } }] }] }],
    ['nota acima de 100', { modules: [{ id: 'x', title: 'M', lessons: [{ id: 'a', title: 'Q', duration: '1', type: 'quiz', quizData: { passMark: 150, questions: [{ text: 'P', options: ['A', 'B'], correct: 'A' }] } }] }] }],
    ['descrição longa demais', { modules: [{ id: 'x', title: 'M', lessons: [{ id: 'a', title: 'A', duration: '1', type: 'video', description: 'x'.repeat(1001) }] }] }],
    ['crédito longo demais', { modules: [{ id: 'x', title: 'M', lessons: [{ id: 'a', title: 'A', duration: '1', type: 'video', videoCredit: 'x'.repeat(121) }] }] }],
    ['modules ausente', {}],
  ];
  for (const [label, payload] of invalids) {
    const result = await call('PUT', `/api/courses/${courseId}/content`, token, payload);
    check(`rejeita ${label} (400)`, result.status === 400, `${result.status} ${JSON.stringify(result.body)}`);
  }

  const afterInvalid = await call('GET', `/api/courses/${courseId}/content`);
  check('conteúdo intacto após payloads inválidos', afterInvalid.body.length === 1 && afterInvalid.body[0].lessons[0].title === 'Agora é vídeo');

  const missing = await call('PUT', '/api/courses/999999999/content', token, { modules: [] });
  check('curso inexistente responde 404', missing.status === 404, `${missing.status} ${JSON.stringify(missing.body)}`);

  const noAuth = await call('PUT', `/api/courses/${courseId}/content`, null, { modules: [] });
  check('sem token responde 401', noAuth.status === 401);

  // 5) Esvaziar o curso
  const emptied = await call('PUT', `/api/courses/${courseId}/content`, token, { modules: [] });
  check('save vazio remove tudo', emptied.status === 200 && emptied.body.length === 0);
} catch (error) {
  failures += 1;
  console.error('ERRO', error);
} finally {
  if (courseId) await supabaseAdmin.from('courses').delete().eq('id', courseId);
  if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
  console.log(`\nLimpeza feita. ${failures === 0 ? 'Todos os testes passaram.' : `${failures} falha(s).`}`);
  process.exit(failures === 0 ? 0 : 1);
}
