import { createHash } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { requireAuth } from './middleware/requireAuth.js';
import { requireAdmin } from './middleware/requireAdmin.js';
import { supabaseAdmin, supabaseAuth } from './supabase.js';

const app = express();

// Em produção na Vercel, frontend e API ficam no mesmo domínio. A variável
// VERCEL_PROJECT_PRODUCTION_URL é definida automaticamente pela plataforma.
const productionOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : null;
const clientOrigin = (process.env.CLIENT_ORIGIN || productionOrigin || 'http://localhost:5173').replace(/\/$/, '');

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const validLevels = new Map([
  ['iniciante', 'Iniciante'],
  ['intermediario', 'Intermediário'],
  ['avancado', 'Avançado'],
]);

const normalizeLevel = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const parseCoursePayload = (body) => {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const price = Number(body.price);
  const requestedLevel = typeof body.level === 'string' ? body.level.trim() : '';
  const level = requestedLevel ? validLevels.get(normalizeLevel(requestedLevel)) : null;
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : null;

  if (!title || !Number.isFinite(price) || price < 0 || !level) {
    return null;
  }

  return {
    title,
    price,
    level,
    image_url: imageUrl || null,
  };
};

const parseCourseId = (value) => {
  const courseId = Number(value);
  return Number.isInteger(courseId) && courseId > 0 ? courseId : null;
};

const parseLessonId = (value) => {
  const lessonId = Number(value);
  return Number.isInteger(lessonId) && lessonId > 0 ? lessonId : null;
};

const isValidQuizQuestion = (question) => (
  isNonEmptyString(question?.text)
  && Array.isArray(question.options)
  && question.options.length >= 2
  && question.options.every(isNonEmptyString)
  && question.options.includes(question.correct)
);

const ticketStatuses = new Set(['open', 'answered', 'closed']);

const enrichSupportTickets = async (tickets) => {
  const studentIds = [...new Set(tickets.map((ticket) => ticket.student_id).filter(Boolean))];
  const courseIds = [...new Set(tickets.map((ticket) => ticket.course_id).filter(Boolean))];
  const [profilesResult, coursesResult] = await Promise.all([
    studentIds.length > 0
      ? supabaseAdmin.from('profiles').select('id, full_name').in('id', studentIds)
      : Promise.resolve({ data: [], error: null }),
    courseIds.length > 0
      ? supabaseAdmin.from('courses').select('id, title').in('id', courseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error || coursesResult.error) return null;

  const names = new Map((profilesResult.data || []).map((profile) => [profile.id, profile.full_name]));
  const courses = new Map((coursesResult.data || []).map((course) => [course.id, course.title]));

  return tickets.map((ticket) => ({
    id: ticket.id,
    studentId: ticket.student_id,
    studentName: names.get(ticket.student_id) || 'Aluno',
    courseId: ticket.course_id,
    courseTitle: ticket.course_id ? courses.get(ticket.course_id) || 'Curso removido' : 'Geral / Plataforma',
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    adminResponse: ticket.admin_response,
    respondedAt: ticket.responded_at,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  }));
};

const canManageCourse = async (courseId, userId) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role !== 'admin') return false;

  const { data } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  return Boolean(data);
};

const getLessonContext = async (lessonId) => {
  const { data: lesson, error: lessonError } = await supabaseAdmin
    .from('lessons')
    .select('id, module_id')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonError || !lesson) return null;

  const { data: module, error: moduleError } = await supabaseAdmin
    .from('course_modules')
    .select('id, course_id')
    .eq('id', lesson.module_id)
    .maybeSingle();

  if (moduleError || !module) return null;
  return { lessonId: lesson.id, moduleId: module.id, courseId: module.course_id };
};

const hasCourseAccess = async (courseId, userId) => {
  if (await canManageCourse(courseId, userId)) return true;

  const { data } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', userId)
    .maybeSingle();

  return Boolean(data);
};

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'cursolab-api' });
});

app.post('/api/auth/register', async (request, response) => {
  const { fullName, email, password } = request.body;

  if (!isNonEmptyString(fullName) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return response.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  if (password.length < 6) {
    return response.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), role: 'student' },
  });

  if (error) {
    console.error('Erro ao cadastrar aluno no Supabase:', error.message);
    return response.status(400).json({ error: error.message });
  }

  return response.status(201).json({
    message: 'Aluno cadastrado com sucesso.',
    student: { id: data.user.id, email: data.user.email, fullName: fullName.trim() },
  });
});

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return response.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.session) {
    console.error('Erro de login no Supabase:', error?.message || 'Sessão não retornada');
    return response.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  return response.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

app.post('/api/auth/refresh', async (request, response) => {
  const { refreshToken } = request.body;

  if (!isNonEmptyString(refreshToken)) {
    return response.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }

  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return response.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
  }

  return response.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

app.post('/api/auth/password-recovery', async (request, response) => {
  const { email } = request.body;

  if (!isNonEmptyString(email)) {
    return response.status(400).json({ error: 'Informe um e-mail válido.' });
  }

  const redirectTo = process.env.PASSWORD_RESET_REDIRECT_URL || `${clientOrigin}/?mode=recovery`;
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });

  if (error) {
    console.error('Erro ao solicitar recuperação de senha no Supabase:', error.message);
    const errorMessage = error.message.toLowerCase();
    const message = errorMessage.includes('redirect') || errorMessage.includes('url')
      ? 'A URL de retorno ainda não está liberada no Supabase.'
      : errorMessage.includes('rate limit') || errorMessage.includes('too many')
        ? 'Aguarde alguns minutos antes de solicitar outro e-mail.'
        : 'O Supabase não conseguiu enviar o e-mail de recuperação. Confira a configuração de e-mail do projeto.';
    return response.status(500).json({ error: message });
  }

  return response.json({
    message: 'Se houver uma conta com este e-mail, você receberá um link para redefinir a senha.',
  });
});

app.post('/api/auth/recovery-session', async (request, response) => {
  const { code } = request.body;

  if (!isNonEmptyString(code)) {
    return response.status(400).json({ error: 'Link de recuperação inválido.' });
  }

  const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return response.status(401).json({ error: 'Este link de recuperação é inválido ou expirou. Solicite um novo link.' });
  }

  return response.json({ accessToken: data.session.access_token });
});

app.post('/api/auth/update-password', requireAuth, async (request, response) => {
  const { password } = request.body;

  if (!isNonEmptyString(password) || password.length < 6) {
    return response.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(request.user.id, { password });

  if (error) {
    console.error('Erro ao atualizar senha no Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível atualizar a senha.' });
  }

  return response.json({ message: 'Senha atualizada com sucesso.' });
});

app.get('/api/students/me', requireAuth, async (request, response) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', request.user.id)
    .single();

  if (error) {
    return response.status(404).json({ error: 'Perfil do aluno não encontrado.' });
  }

  return response.json({ ...data, email: request.user.email });
});

app.patch('/api/students/me', requireAuth, async (request, response) => {
  const fullName = typeof request.body.fullName === 'string' ? request.body.fullName.trim().replace(/\s+/g, ' ') : '';

  if (fullName.length < 3 || fullName.length > 100) {
    return response.status(400).json({ error: 'O nome deve ter entre 3 e 100 caracteres.' });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', request.user.id)
    .select('id, full_name, role, created_at')
    .single();

  if (error) {
    console.error('Erro ao atualizar perfil no Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível atualizar o perfil.' });
  }

  return response.json({ ...data, email: request.user.email });
});

// Troca de senha com a sessão ativa: confirma a senha atual antes de gravar a
// nova, para que um token esquecido aberto não baste para trocar a senha.
app.post('/api/auth/change-password', requireAuth, async (request, response) => {
  const { currentPassword, newPassword } = request.body;

  if (!isNonEmptyString(currentPassword)) {
    return response.status(400).json({ error: 'Informe a senha atual.' });
  }
  if (!isNonEmptyString(newPassword) || newPassword.length < 6) {
    return response.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }
  if (newPassword === currentPassword) {
    return response.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
  }

  const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
    email: request.user.email,
    password: currentPassword,
  });

  if (signInError) {
    return response.status(400).json({ error: 'A senha atual está incorreta.' });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(request.user.id, { password: newPassword });

  if (error) {
    console.error('Erro ao trocar senha no Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível atualizar a senha.' });
  }

  return response.json({ message: 'Senha atualizada com sucesso.' });
});

app.get('/api/courses', async (_request, response) => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, price, level, image_url, instructor_id, rating, review_count, enrollment_count, revenue_30d, new_students_30d, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return response.status(500).json({ error: 'Não foi possível carregar os cursos.' });
  }

  return response.json(data);
});

app.get('/api/admin/analytics', requireAuth, requireAdmin, async (_request, response) => {
  const { data: courses, error } = await supabaseAdmin
    .from('courses')
    .select('id, title, rating, review_count, enrollment_count, revenue_30d, new_students_30d');

  if (error) {
    console.error('Erro ao carregar indicadores do Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível carregar os indicadores.' });
  }

  const totals = (courses || []).reduce((summary, course) => {
    const reviewCount = Number(course.review_count) || 0;
    const rating = Number(course.rating) || 0;
    summary.revenue30d += Number(course.revenue_30d) || 0;
    summary.newStudents30d += Number(course.new_students_30d) || 0;
    summary.totalEnrollments += Number(course.enrollment_count) || 0;
    summary.totalReviews += reviewCount;
    summary.ratingPoints += rating * reviewCount;
    return summary;
  }, {
    revenue30d: 0,
    newStudents30d: 0,
    totalEnrollments: 0,
    totalReviews: 0,
    ratingPoints: 0,
  });

  return response.json({
    revenue30d: totals.revenue30d,
    newStudents30d: totals.newStudents30d,
    totalEnrollments: totals.totalEnrollments,
    totalReviews: totals.totalReviews,
    averageRating: totals.totalReviews > 0 ? totals.ratingPoints / totals.totalReviews : 0,
    courses: courses || [],
  });
});

// Os limites repetem as restrições da tabela support_tickets (008), para a API
// responder com uma mensagem clara em vez de um erro do banco.
const ticketLimits = { subject: [3, 120], message: [5, 2000], response: 2000 };
const ticketColumns = 'id, student_id, course_id, subject, message, status, admin_response, responded_at, created_at, updated_at';

const sendTicket = async (response, row, status = 200) => {
  const tickets = await enrichSupportTickets([row]);
  if (!tickets) return response.status(500).json({ error: 'Não foi possível carregar os dados do chamado.' });
  return response.status(status).json(tickets[0]);
};

app.post('/api/support-tickets', requireAuth, async (request, response) => {
  const { courseId, subject, message } = request.body;
  const normalizedCourseId = courseId === null || courseId === undefined ? null : parseCourseId(courseId);
  const normalizedSubject = typeof subject === 'string' ? subject.trim() : '';
  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  const [minSubject, maxSubject] = ticketLimits.subject;
  const [minMessage, maxMessage] = ticketLimits.message;

  if (!normalizedSubject || !normalizedMessage || (courseId !== null && courseId !== undefined && !normalizedCourseId)) {
    return response.status(400).json({ error: 'Preencha o assunto, a mensagem e o curso corretamente.' });
  }
  if (normalizedSubject.length < minSubject || normalizedSubject.length > maxSubject) {
    return response.status(400).json({ error: `O assunto deve ter entre ${minSubject} e ${maxSubject} caracteres.` });
  }
  if (normalizedMessage.length < minMessage || normalizedMessage.length > maxMessage) {
    return response.status(400).json({ error: `A mensagem deve ter entre ${minMessage} e ${maxMessage} caracteres.` });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', request.user.id)
    .maybeSingle();

  if (profile?.role !== 'student') {
    return response.status(403).json({ error: 'Apenas alunos podem abrir chamados.' });
  }

  if (normalizedCourseId && !await hasCourseAccess(normalizedCourseId, request.user.id)) {
    return response.status(403).json({ error: 'Você não possui matrícula neste curso.' });
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      student_id: request.user.id,
      course_id: normalizedCourseId,
      subject: normalizedSubject,
      message: normalizedMessage,
    })
    .select(ticketColumns)
    .single();

  if (error) {
    console.error('Erro ao criar chamado no Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível abrir o chamado.' });
  }

  return sendTicket(response, data, 201);
});

app.get('/api/support-tickets/me', requireAuth, async (request, response) => {
  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select(ticketColumns)
    .eq('student_id', request.user.id)
    .order('created_at', { ascending: false });

  if (error) return response.status(500).json({ error: 'Não foi possível carregar seus chamados.' });

  const tickets = await enrichSupportTickets(data || []);
  if (!tickets) return response.status(500).json({ error: 'Não foi possível carregar os dados dos chamados.' });
  return response.json(tickets);
});

// O aluno pode encerrar o próprio chamado quando o problema foi resolvido.
app.patch('/api/support-tickets/:ticketId/close', requireAuth, async (request, response) => {
  const ticketId = parseCourseId(request.params.ticketId);
  if (!ticketId) return response.status(400).json({ error: 'Chamado inválido.' });

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('student_id', request.user.id)
    .select(ticketColumns)
    .maybeSingle();

  if (error) {
    console.error('Erro ao encerrar chamado no Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível encerrar o chamado.' });
  }
  if (!data) return response.status(404).json({ error: 'Chamado não encontrado.' });

  return sendTicket(response, data);
});

app.get('/api/admin/support-tickets', requireAuth, requireAdmin, async (_request, response) => {
  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select(ticketColumns)
    .order('created_at', { ascending: false });

  if (error) return response.status(500).json({ error: 'Não foi possível carregar os chamados.' });

  const tickets = await enrichSupportTickets(data || []);
  if (!tickets) return response.status(500).json({ error: 'Não foi possível carregar os dados dos chamados.' });
  return response.json(tickets);
});

app.put('/api/admin/support-tickets/:ticketId', requireAuth, requireAdmin, async (request, response) => {
  const ticketId = parseCourseId(request.params.ticketId);
  const status = typeof request.body.status === 'string' ? request.body.status : '';
  const adminResponse = typeof request.body.adminResponse === 'string' ? request.body.adminResponse.trim() : '';

  if (!ticketId || !ticketStatuses.has(status)) {
    return response.status(400).json({ error: 'Status do chamado inválido.' });
  }
  if (status === 'answered' && !adminResponse) {
    return response.status(400).json({ error: 'Escreva uma resposta antes de enviar.' });
  }
  if (adminResponse.length > ticketLimits.response) {
    return response.status(400).json({ error: `A resposta deve ter no máximo ${ticketLimits.response} caracteres.` });
  }

  const { data: current } = await supabaseAdmin
    .from('support_tickets')
    .select('status')
    .eq('id', ticketId)
    .maybeSingle();

  if (!current) return response.status(404).json({ error: 'Chamado não encontrado.' });
  if (current.status === 'closed' && status !== 'open') {
    return response.status(409).json({ error: 'Este chamado já foi encerrado.' });
  }

  const updates = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminResponse) {
    updates.admin_response = adminResponse;
    updates.responded_by = request.user.id;
    updates.responded_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select(ticketColumns)
    .single();

  if (error) {
    console.error('Erro ao atualizar chamado no Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível atualizar o chamado.' });
  }

  return sendTicket(response, data);
});

app.post('/api/courses', requireAuth, requireAdmin, async (request, response) => {
  const course = parseCoursePayload(request.body);

  if (!course) {
    return response.status(400).json({
      error: 'Informe título, preço não negativo e nível (Iniciante, Intermediário ou Avançado).',
    });
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({ ...course, instructor_id: request.user.id })
    .select('id, title, price, level, image_url, instructor_id, rating, review_count, enrollment_count, revenue_30d, new_students_30d, created_at')
    .single();

  if (error) {
    console.error('Erro ao criar curso no Supabase:', error.message);
    return response.status(400).json({ error: 'Não foi possível criar o curso.' });
  }

  return response.status(201).json(data);
});

app.put('/api/courses/:courseId', requireAuth, requireAdmin, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);
  const course = parseCoursePayload(request.body);

  if (!courseId || !course) {
    return response.status(400).json({ error: 'Dados do curso inválidos.' });
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(course)
    .eq('id', courseId)
    .select('id, title, price, level, image_url, instructor_id, rating, review_count, enrollment_count, revenue_30d, new_students_30d, created_at')
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar curso no Supabase:', error.message);
    return response.status(400).json({ error: 'Não foi possível atualizar o curso.' });
  }

  if (!data) {
    return response.status(404).json({ error: 'Curso não encontrado ou não pertence a este professor.' });
  }

  return response.json(data);
});

app.delete('/api/courses/:courseId', requireAuth, requireAdmin, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);

  if (!courseId) {
    return response.status(400).json({ error: 'Identificador de curso inválido.' });
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .delete()
    .eq('id', courseId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Erro ao excluir curso no Supabase:', error.message);
    return response.status(400).json({ error: 'Não foi possível excluir o curso.' });
  }

  if (!data) {
    return response.status(404).json({ error: 'Curso não encontrado ou não pertence a este professor.' });
  }

  return response.status(204).send();
});

// Monta a árvore módulos → aulas → quiz de um curso. Devolve { data } ou
// { error } com a mensagem para o cliente.
const fetchCourseContent = async (courseId) => {
  const { data: modules, error: modulesError } = await supabaseAdmin
    .from('course_modules')
    .select('id, title, sort_order')
    .eq('course_id', courseId)
    .order('sort_order');

  if (modulesError) return { error: 'Não foi possível carregar o conteúdo.' };
  if (modules.length === 0) return { data: [] };

  const moduleIds = modules.map((module) => module.id);
  const { data: lessons, error: lessonsError } = await supabaseAdmin
    .from('lessons')
    .select('id, module_id, title, duration, content_type, video_url, document_url, sort_order')
    .in('module_id', moduleIds)
    .order('sort_order');

  if (lessonsError) return { error: 'Não foi possível carregar as aulas.' };

  const quizLessonIds = lessons.filter((lesson) => lesson.content_type === 'quiz').map((lesson) => lesson.id);
  let quizzes = [];
  let quizQuestions = [];

  if (quizLessonIds.length > 0) {
    const quizzesResult = await supabaseAdmin
      .from('quizzes')
      .select('id, lesson_id, pass_mark')
      .in('lesson_id', quizLessonIds);
    quizzes = quizzesResult.data || [];

    if (quizzesResult.error) return { error: 'Não foi possível carregar os quizzes.' };

    if (quizzes.length > 0) {
      const questionsResult = await supabaseAdmin
        .from('quiz_questions')
        .select('id, quiz_id, question_text, options, correct_answer, sort_order')
        .in('quiz_id', quizzes.map((quiz) => quiz.id))
        .order('sort_order');
      quizQuestions = questionsResult.data || [];

      if (questionsResult.error) return { error: 'Não foi possível carregar as perguntas.' };
    }
  }

  const quizzesByLesson = new Map(quizzes.map((quiz) => [quiz.lesson_id, quiz]));
  const questionsByQuiz = new Map();
  quizQuestions.forEach((question) => {
    const questions = questionsByQuiz.get(question.quiz_id) || [];
    questions.push({
      id: question.id,
      text: question.question_text,
      options: question.options,
      correct: question.correct_answer,
    });
    questionsByQuiz.set(question.quiz_id, questions);
  });

  const lessonsByModule = new Map();
  lessons.forEach((lesson) => {
    const quiz = quizzesByLesson.get(lesson.id);
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      duration: lesson.duration,
      type: lesson.content_type,
      videoUrl: lesson.video_url,
      documentUrl: lesson.document_url,
      quizData: quiz ? { passMark: quiz.pass_mark, questions: questionsByQuiz.get(quiz.id) || [] } : undefined,
    };
    const moduleLessons = lessonsByModule.get(lesson.module_id) || [];
    moduleLessons.push(formattedLesson);
    lessonsByModule.set(lesson.module_id, moduleLessons);
  });

  return {
    data: modules.map((module) => ({
      id: module.id,
      title: module.title,
      lessons: lessonsByModule.get(module.id) || [],
    })),
  };
};

const isOptionalUrl = (value) => {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
};

// Valida e normaliza o conteúdo enviado pelo editor. Ids numéricos indicam
// itens já salvos; qualquer outro valor (ids temporários do editor) indica um
// item novo. Devolve { modules } ou { error }.
const parseCourseContentPayload = (modules) => {
  if (!Array.isArray(modules)) return { error: 'Conteúdo do curso inválido.' };

  const seenModuleIds = new Set();
  const seenLessonIds = new Set();
  const normalizedModules = [];

  for (const [moduleIndex, module] of modules.entries()) {
    const moduleTitle = typeof module?.title === 'string' ? module.title.trim() : '';
    if (!moduleTitle) return { error: `O módulo ${moduleIndex + 1} precisa de um título.` };
    if (!Array.isArray(module.lessons)) return { error: `As aulas do módulo "${moduleTitle}" são inválidas.` };

    const moduleId = Number.isInteger(module.id) && module.id > 0 ? module.id : null;
    if (moduleId && seenModuleIds.has(moduleId)) return { error: 'Há módulos duplicados no conteúdo.' };
    if (moduleId) seenModuleIds.add(moduleId);

    const lessons = [];
    for (const lesson of module.lessons) {
      const title = typeof lesson?.title === 'string' ? lesson.title.trim() : '';
      const duration = typeof lesson?.duration === 'string' ? lesson.duration.trim() : '';
      const type = lesson?.type;

      if (!title) return { error: `Há uma aula sem título no módulo "${moduleTitle}".` };
      if (!duration) return { error: `A aula "${title}" precisa de uma duração.` };
      if (!['video', 'quiz'].includes(type)) return { error: `A aula "${title}" tem um tipo inválido.` };

      const lessonId = Number.isInteger(lesson.id) && lesson.id > 0 ? lesson.id : null;
      if (lessonId && seenLessonIds.has(lessonId)) return { error: 'Há aulas duplicadas no conteúdo.' };
      if (lessonId) seenLessonIds.add(lessonId);

      if (type === 'video') {
        if (!isOptionalUrl(lesson.videoUrl) || !isOptionalUrl(lesson.documentUrl)) {
          return { error: `Os links da aula "${title}" devem começar com http:// ou https://.` };
        }
        lessons.push({
          id: lessonId,
          title,
          duration,
          type,
          videoUrl: lesson.videoUrl?.trim() || null,
          documentUrl: lesson.documentUrl?.trim() || null,
        });
        continue;
      }

      const passMark = Number(lesson.quizData?.passMark);
      const questions = lesson.quizData?.questions;
      if (!Number.isInteger(passMark) || passMark < 0 || passMark > 100) {
        return { error: `A nota mínima do quiz "${title}" deve ser um número entre 0 e 100.` };
      }
      if (!Array.isArray(questions) || questions.length === 0 || !questions.every(isValidQuizQuestion)) {
        return { error: `O quiz "${title}" precisa de perguntas com ao menos duas opções e uma resposta correta.` };
      }
      lessons.push({
        id: lessonId,
        title,
        duration,
        type,
        videoUrl: null,
        documentUrl: null,
        quizData: {
          passMark,
          questions: questions.map((question) => ({
            text: question.text.trim(),
            options: question.options.map((option) => option.trim()),
            correct: question.correct.trim(),
          })),
        },
      });
    }

    normalizedModules.push({ id: moduleId, title: moduleTitle, lessons });
  }

  return { modules: normalizedModules };
};

app.get('/api/courses/:courseId/content', async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);
  if (!courseId) return response.status(400).json({ error: 'Identificador de curso inválido.' });

  const { data, error } = await fetchCourseContent(courseId);
  if (error) return response.status(500).json({ error });
  return response.json(data);
});

// Salva o conteúdo completo do curso de uma vez. A gravação acontece numa
// função do banco (009_save_course_content.sql) para ser atômica: se algo
// falhar no meio, nada é alterado.
app.put('/api/courses/:courseId/content', requireAuth, requireAdmin, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);
  if (!courseId) return response.status(400).json({ error: 'Identificador de curso inválido.' });

  const parsed = parseCourseContentPayload(request.body.modules);
  if (parsed.error) return response.status(400).json({ error: parsed.error });

  const { error: saveError } = await supabaseAdmin.rpc('save_course_content', {
    p_course_id: courseId,
    p_content: parsed.modules,
  });

  if (saveError) {
    console.error('Erro ao salvar conteúdo no Supabase:', saveError.message, saveError.code || '');
    if (saveError.code === 'P0002') return response.status(404).json({ error: 'Curso não encontrado.' });
    return response.status(500).json({ error: 'Não foi possível salvar o conteúdo do curso.' });
  }

  const { data, error } = await fetchCourseContent(courseId);
  if (error) return response.status(500).json({ error });
  return response.json(data);
});

// Tipos de arquivo que o editor de conteúdo pode enviar ao Supabase Storage.
// Os limites repetem os configurados nos buckets (010 e 011), para a API
// recusar o envio antes de gerar a URL assinada.
const uploadKinds = {
  material: {
    bucket: 'course-materials',
    maxSize: 20 * 1024 * 1024,
    types: new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'image/png',
      'image/jpeg',
    ]),
    typeError: 'Formato não permitido. Envie PDF, Word, PowerPoint, Excel, ZIP, TXT, PNG ou JPG.',
    sizeError: 'O material deve ter no máximo 20 MB.',
  },
  video: {
    bucket: 'course-videos',
    maxSize: 50 * 1024 * 1024,
    types: new Set(['video/mp4', 'video/webm']),
    typeError: 'Formato não permitido. Envie um vídeo MP4 ou WebM.',
    sizeError: 'O vídeo deve ter no máximo 50 MB. Para vídeos maiores, use um link do YouTube.',
  },
};

const sanitizeFileName = (fileName) => fileName
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9._-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(-80) || 'arquivo';

// Gera uma URL assinada para o navegador enviar o arquivo direto ao Supabase
// Storage. O arquivo não passa pela API, que na Vercel tem limite de 4,5 MB
// por requisição.
app.post('/api/courses/:courseId/uploads', requireAuth, requireAdmin, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);
  const { kind, fileName, contentType, size } = request.body;
  const config = uploadKinds[kind];

  if (!courseId || !config || !isNonEmptyString(fileName)) {
    return response.status(400).json({ error: 'Arquivo inválido.' });
  }
  if (!config.types.has(contentType)) {
    return response.status(400).json({ error: config.typeError });
  }
  if (!Number.isFinite(size) || size <= 0 || size > config.maxSize) {
    return response.status(400).json({ error: config.sizeError });
  }

  const { data: course } = await supabaseAdmin.from('courses').select('id').eq('id', courseId).maybeSingle();
  if (!course) return response.status(404).json({ error: 'Curso não encontrado.' });

  const path = `cursos/${courseId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
  const storage = supabaseAdmin.storage.from(config.bucket);
  const { data, error } = await storage.createSignedUploadUrl(path);

  if (error) {
    console.error('Erro ao gerar URL de upload no Supabase:', error.message);
    return response.status(500).json({ error: 'Não foi possível preparar o envio do arquivo.' });
  }

  return response.json({
    signedUrl: data.signedUrl,
    publicUrl: storage.getPublicUrl(path).data.publicUrl,
  });
});

app.post('/api/courses/:courseId/modules', requireAuth, requireAdmin, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);
  const title = typeof request.body.title === 'string' ? request.body.title.trim() : '';

  if (!courseId || !title) return response.status(400).json({ error: 'Título do módulo inválido.' });
  if (!await canManageCourse(courseId, request.user.id)) {
    return response.status(404).json({ error: 'Curso não encontrado ou não pertence a este professor.' });
  }

  const { count, error: countError } = await supabaseAdmin
    .from('course_modules')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  if (countError) return response.status(500).json({ error: 'Não foi possível preparar o módulo.' });

  const { data, error } = await supabaseAdmin
    .from('course_modules')
    .insert({ course_id: courseId, title, sort_order: count || 0 })
    .select('id, course_id, title, sort_order')
    .single();

  if (error) return response.status(400).json({ error: 'Não foi possível criar o módulo.' });
  return response.status(201).json(data);
});

app.post('/api/modules/:moduleId/lessons', requireAuth, requireAdmin, async (request, response) => {
  const moduleId = Number(request.params.moduleId);
  const title = typeof request.body.title === 'string' ? request.body.title.trim() : '';
  const duration = typeof request.body.duration === 'string' ? request.body.duration.trim() : '';
  const type = request.body.type;

  if (!Number.isInteger(moduleId) || moduleId <= 0 || !title || !duration || !['video', 'quiz'].includes(type)) {
    return response.status(400).json({ error: 'Dados da aula inválidos.' });
  }

  const { data: module, error: moduleError } = await supabaseAdmin
    .from('course_modules')
    .select('course_id')
    .eq('id', moduleId)
    .maybeSingle();

  if (moduleError || !module || !await canManageCourse(module.course_id, request.user.id)) {
    return response.status(404).json({ error: 'Módulo não encontrado ou não pertence a este professor.' });
  }

  const { count, error: countError } = await supabaseAdmin
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('module_id', moduleId);
  if (countError) return response.status(500).json({ error: 'Não foi possível preparar a aula.' });

  const { data: lesson, error: lessonError } = await supabaseAdmin
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      duration,
      content_type: type,
      video_url: type === 'video' ? request.body.videoUrl || null : null,
      document_url: type === 'video' ? request.body.documentUrl || null : null,
      sort_order: count || 0,
    })
    .select('id, module_id, title, duration, content_type, video_url, document_url, sort_order')
    .single();

  if (lessonError) return response.status(400).json({ error: 'Não foi possível criar a aula.' });

  if (type === 'quiz') {
    const quizData = request.body.quizData;
    const passMark = Number(quizData?.passMark);
    const questions = quizData?.questions;
    const validQuestions = Array.isArray(questions) && questions.length > 0 && questions.every(isValidQuizQuestion);

    if (!Number.isInteger(passMark) || passMark < 0 || passMark > 100 || !validQuestions) {
      await supabaseAdmin.from('lessons').delete().eq('id', lesson.id);
      return response.status(400).json({ error: 'Dados do quiz inválidos.' });
    }

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({ lesson_id: lesson.id, pass_mark: passMark })
      .select('id, pass_mark')
      .single();

    if (quizError) return response.status(400).json({ error: 'Não foi possível criar o quiz.' });

    const { error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .insert(questions.map((question, index) => ({
        quiz_id: quiz.id,
        question_text: question.text.trim(),
        options: question.options,
        correct_answer: question.correct,
        sort_order: index,
      })));

    if (questionsError) return response.status(400).json({ error: 'Não foi possível salvar as perguntas do quiz.' });
  }

  return response.status(201).json(lesson);
});

app.get('/api/courses/:courseId/progress', requireAuth, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);
  if (!courseId) return response.status(400).json({ error: 'Identificador de curso inválido.' });
  if (!await hasCourseAccess(courseId, request.user.id)) {
    return response.status(403).json({ error: 'Você não possui acesso a este curso.' });
  }

  const { data: modules, error: modulesError } = await supabaseAdmin
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId);
  if (modulesError) return response.status(500).json({ error: 'Não foi possível carregar o progresso.' });
  if (modules.length === 0) return response.json({ completedLessonIds: [] });

  const { data: lessons, error: lessonsError } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .in('module_id', modules.map((module) => module.id));
  if (lessonsError || lessons.length === 0) return response.json({ completedLessonIds: [] });

  const { data, error } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id')
    .eq('student_id', request.user.id)
    .eq('completed', true)
    .in('lesson_id', lessons.map((lesson) => lesson.id));

  if (error) return response.status(500).json({ error: 'Não foi possível carregar o progresso.' });
  return response.json({ completedLessonIds: data.map((progress) => progress.lesson_id) });
});

app.put('/api/lessons/:lessonId/progress', requireAuth, async (request, response) => {
  const lessonId = parseLessonId(request.params.lessonId);
  const completed = request.body.completed;

  if (!lessonId || typeof completed !== 'boolean') {
    return response.status(400).json({ error: 'Informe uma aula válida e o campo completed como booleano.' });
  }

  const context = await getLessonContext(lessonId);
  if (!context) return response.status(404).json({ error: 'Aula não encontrada.' });
  if (!await hasCourseAccess(context.courseId, request.user.id)) {
    return response.status(403).json({ error: 'Você não possui acesso a esta aula.' });
  }

  const { data, error } = await supabaseAdmin
    .from('lesson_progress')
    .upsert({
      student_id: request.user.id,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'student_id,lesson_id' })
    .select('lesson_id, completed, completed_at')
    .single();

  if (error) return response.status(400).json({ error: 'Não foi possível atualizar o progresso.' });
  return response.json(data);
});

app.get('/api/lessons/:lessonId/questions', requireAuth, async (request, response) => {
  const lessonId = parseLessonId(request.params.lessonId);
  if (!lessonId) return response.status(400).json({ error: 'Identificador de aula inválido.' });

  const context = await getLessonContext(lessonId);
  if (!context) return response.status(404).json({ error: 'Aula não encontrada.' });
  if (!await hasCourseAccess(context.courseId, request.user.id)) {
    return response.status(403).json({ error: 'Você não possui acesso a esta aula.' });
  }

  const { data: questions, error } = await supabaseAdmin
    .from('lesson_questions')
    .select('id, author_id, question_text, answer_text, answered_by, answered_at, created_at')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  if (error) return response.status(500).json({ error: 'Não foi possível carregar as dúvidas.' });

  const profileIds = [...new Set(questions.flatMap((question) => [question.author_id, question.answered_by]).filter(Boolean))];
  const { data: profiles } = profileIds.length > 0
    ? await supabaseAdmin.from('profiles').select('id, full_name').in('id', profileIds)
    : { data: [] };
  const names = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]));

  return response.json(questions.map((question) => ({
    id: question.id,
    lessonId,
    author: names.get(question.author_id) || 'Aluno',
    date: question.created_at,
    text: question.question_text,
    answer: question.answer_text ? {
      author: names.get(question.answered_by) || 'Professor',
      date: question.answered_at,
      text: question.answer_text,
    } : null,
  })));
});

app.post('/api/lessons/:lessonId/questions', requireAuth, async (request, response) => {
  const lessonId = parseLessonId(request.params.lessonId);
  const text = typeof request.body.text === 'string' ? request.body.text.trim() : '';

  if (!lessonId || !text) return response.status(400).json({ error: 'Pergunta inválida.' });
  const context = await getLessonContext(lessonId);
  if (!context) return response.status(404).json({ error: 'Aula não encontrada.' });
  if (!await hasCourseAccess(context.courseId, request.user.id)) {
    return response.status(403).json({ error: 'Você não possui acesso a esta aula.' });
  }

  const { data, error } = await supabaseAdmin
    .from('lesson_questions')
    .insert({ lesson_id: lessonId, author_id: request.user.id, question_text: text })
    .select('id, lesson_id, question_text, created_at')
    .single();

  if (error) return response.status(400).json({ error: 'Não foi possível enviar a pergunta.' });
  return response.status(201).json(data);
});

app.patch('/api/questions/:questionId/answer', requireAuth, requireAdmin, async (request, response) => {
  const questionId = Number(request.params.questionId);
  const answer = typeof request.body.answer === 'string' ? request.body.answer.trim() : '';
  if (!Number.isInteger(questionId) || questionId <= 0 || !answer) {
    return response.status(400).json({ error: 'Resposta inválida.' });
  }

  const { data: question, error: questionError } = await supabaseAdmin
    .from('lesson_questions')
    .select('lesson_id')
    .eq('id', questionId)
    .maybeSingle();
  if (questionError || !question) return response.status(404).json({ error: 'Pergunta não encontrada.' });

  const context = await getLessonContext(question.lesson_id);
  if (!context || !await canManageCourse(context.courseId, request.user.id)) {
    return response.status(403).json({ error: 'Você não pode responder dúvidas deste curso.' });
  }

  const { data, error } = await supabaseAdmin
    .from('lesson_questions')
    .update({ answer_text: answer, answered_by: request.user.id, answered_at: new Date().toISOString() })
    .eq('id', questionId)
    .select('id, answer_text, answered_by, answered_at')
    .single();

  if (error) return response.status(400).json({ error: 'Não foi possível salvar a resposta.' });
  return response.json(data);
});

app.post('/api/enrollments', requireAuth, async (request, response) => {
  const courseId = parseCourseId(request.body.courseId);

  if (!courseId) {
    return response.status(400).json({ error: 'courseId deve ser um número inteiro válido.' });
  }

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .insert({ student_id: request.user.id, course_id: courseId })
    .select('id, student_id, course_id, enrolled_at')
    .single();

  if (error?.code === '23505') {
    return response.status(409).json({ error: 'Você já está matriculado neste curso.' });
  }

  if (error) {
    console.error('Erro ao criar matrícula no Supabase:', error.message, error.code || '');
    return response.status(400).json({ error: 'Não foi possível realizar a matrícula.' });
  }

  return response.status(201).json(data);
});

// Percentual mínimo de aulas concluídas para emitir o certificado (RF16).
const certificateMinProgress = 60;

// Converte durações livres do editor ("15 min", "1h 30min", "1h", "20") em minutos.
const parseDurationMinutes = (duration) => {
  const text = String(duration || '').toLowerCase();
  const hours = Number(text.match(/(\d+)\s*h/)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*m/)?.[1] || 0);
  if (hours || minutes) return hours * 60 + minutes;
  return Number(text.match(/\d+/)?.[0] || 0);
};

// Calcula o progresso do aluno em cada curso: aulas concluídas sobre o total de
// aulas (vídeos e quizzes). Devolve um Map courseId -> resumo, ou null se a
// consulta falhar.
const getCoursesProgress = async (studentId, courseIds) => {
  const summary = new Map(courseIds.map((courseId) => [courseId, {
    completedLessons: 0,
    totalLessons: 0,
    totalMinutes: 0,
    lastCompletedAt: null,
  }]));
  if (courseIds.length === 0) return summary;

  const { data: modules, error: modulesError } = await supabaseAdmin
    .from('course_modules')
    .select('id, course_id')
    .in('course_id', courseIds);
  if (modulesError) return null;
  if (modules.length === 0) return summary;

  const courseByModule = new Map(modules.map((module) => [module.id, module.course_id]));
  const { data: lessons, error: lessonsError } = await supabaseAdmin
    .from('lessons')
    .select('id, module_id, duration')
    .in('module_id', modules.map((module) => module.id));
  if (lessonsError) return null;
  if (lessons.length === 0) return summary;

  const courseByLesson = new Map();
  lessons.forEach((lesson) => {
    const courseId = courseByModule.get(lesson.module_id);
    courseByLesson.set(lesson.id, courseId);
    const course = summary.get(courseId);
    course.totalLessons += 1;
    course.totalMinutes += parseDurationMinutes(lesson.duration);
  });

  const { data: progress, error: progressError } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id, completed_at')
    .eq('student_id', studentId)
    .eq('completed', true)
    .in('lesson_id', lessons.map((lesson) => lesson.id));
  if (progressError) return null;

  progress.forEach((item) => {
    const course = summary.get(courseByLesson.get(item.lesson_id));
    course.completedLessons += 1;
    if (item.completed_at && (!course.lastCompletedAt || item.completed_at > course.lastCompletedAt)) {
      course.lastCompletedAt = item.completed_at;
    }
  });

  return summary;
};

const toProgressResponse = (summary) => {
  const percent = summary.totalLessons > 0
    ? Math.round((summary.completedLessons / summary.totalLessons) * 100)
    : 0;
  return {
    completedLessons: summary.completedLessons,
    totalLessons: summary.totalLessons,
    percent,
    lastCompletedAt: summary.lastCompletedAt,
    certificateAvailable: percent >= certificateMinProgress,
  };
};

app.get('/api/enrollments/me', requireAuth, async (request, response) => {
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      course:courses (id, title, price, level, image_url, rating, review_count, enrollment_count)
    `)
    .eq('student_id', request.user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    return response.status(500).json({ error: 'Não foi possível carregar as matrículas.' });
  }

  const enrollments = data.filter((enrollment) => enrollment.course);
  const progress = await getCoursesProgress(request.user.id, enrollments.map((enrollment) => enrollment.course.id));
  if (!progress) return response.status(500).json({ error: 'Não foi possível calcular o progresso dos cursos.' });

  return response.json(enrollments.map((enrollment) => ({
    ...enrollment,
    progress: toProgressResponse(progress.get(enrollment.course.id)),
  })));
});

// Dados do certificado de conclusão. A regra de liberação é verificada aqui,
// no servidor; o navegador apenas monta o PDF com os dados devolvidos.
app.get('/api/enrollments/:courseId/certificate', requireAuth, async (request, response) => {
  const courseId = parseCourseId(request.params.courseId);
  if (!courseId) return response.status(400).json({ error: 'Curso inválido.' });

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id, enrolled_at, course:courses (id, title)')
    .eq('student_id', request.user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment?.course) return response.status(404).json({ error: 'Você não está matriculado neste curso.' });

  const [progressMap, profileResult] = await Promise.all([
    getCoursesProgress(request.user.id, [courseId]),
    supabaseAdmin.from('profiles').select('full_name').eq('id', request.user.id).single(),
  ]);
  if (!progressMap || profileResult.error) {
    return response.status(500).json({ error: 'Não foi possível gerar o certificado.' });
  }

  const summary = progressMap.get(courseId);
  const progress = toProgressResponse(summary);
  if (!progress.certificateAvailable) {
    return response.status(403).json({
      error: `O certificado é liberado com ${certificateMinProgress}% do curso concluído. Seu progresso atual é ${progress.percent}%.`,
    });
  }

  const code = createHash('sha256')
    .update(`${enrollment.id}:${request.user.id}:${courseId}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();

  return response.json({
    studentName: profileResult.data.full_name,
    courseTitle: enrollment.course.title,
    workloadHours: Math.max(1, Math.ceil(summary.totalMinutes / 60)),
    completedAt: summary.lastCompletedAt,
    progressPercent: progress.percent,
    code: `CL-${code}`,
  });
});

app.use((_request, response) => response.status(404).json({ error: 'Rota não encontrada.' }));

export default app;
