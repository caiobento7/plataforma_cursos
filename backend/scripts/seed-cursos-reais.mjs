// Cadastra o conteúdo real dos 6 cursos do catálogo: vídeos do YouTube
// incorporados com crédito ao canal, um quiz de 5 perguntas por módulo e uma
// apostila em PDF por módulo, gerada aqui e enviada ao Supabase Storage.
//
// Uso:
//   npm run seed:cursos                 grava no banco configurado em backend/.env
//   npm run seed:cursos -- --pdf pasta  só gera as apostilas na pasta, sem tocar no banco
//
// Os cursos são localizados pelo título. A gravação usa a mesma função do banco
// do editor de conteúdo (save_course_content), que substitui o conteúdo do curso
// de forma atômica. Módulos e aulas com o mesmo título de uma execução anterior
// mantêm o id, então rodar o script de novo preserva o progresso dos alunos.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildHandout } from './cursos-reais/apostila.mjs';
import { courses } from './cursos-reais/cursos.mjs';

const pdfFlag = process.argv.indexOf('--pdf');
const pdfOnlyDirectory = pdfFlag >= 0 ? process.argv[pdfFlag + 1] : null;
const bucket = 'course-materials';

const handoutFor = (course, module, index) => buildHandout({
  courseTitle: course.title,
  moduleNumber: index + 1,
  moduleTitle: module.title,
  credit: course.credit,
  videos: module.lessons,
  blocks: module.handout,
});

const slugify = (text) => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

if (pdfOnlyDirectory) {
  mkdirSync(pdfOnlyDirectory, { recursive: true });
  courses.forEach((course) => course.modules.forEach((module, index) => {
    const file = path.join(pdfOnlyDirectory, `${slugify(course.title)}-modulo-${index + 1}.pdf`);
    writeFileSync(file, handoutFor(course, module, index));
    console.log(`Gerado ${file}`);
  }));
  process.exit(0);
}

const { supabaseAdmin } = await import('../src/supabase.js');

const loadExistingIds = async (courseId) => {
  const { data: modules, error } = await supabaseAdmin
    .from('course_modules')
    .select('id, title, lessons (id, title, content_type)')
    .eq('course_id', courseId);
  if (error) throw new Error(`Não foi possível ler o conteúdo atual: ${error.message}`);

  const moduleIds = new Map(modules.map((module) => [module.title, module.id]));
  const lessonIds = new Map(modules.flatMap((module) => module.lessons.map((lesson) => [`${lesson.content_type}:${lesson.title}`, lesson.id])));
  return { moduleIds, lessonIds };
};

const uploadHandout = async (courseId, moduleNumber, pdf) => {
  const filePath = `cursos/${courseId}/apostila-modulo-${moduleNumber}.pdf`;
  const storage = supabaseAdmin.storage.from(bucket);
  const { error } = await storage.upload(filePath, pdf, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error(`Falha ao enviar ${filePath}: ${error.message}`);
  // O parâmetro de versão muda junto com o arquivo e evita que o navegador ou a
  // CDN sirvam a apostila anterior depois de uma atualização.
  const version = createHash('sha1').update(pdf).digest('hex').slice(0, 10);
  return `${storage.getPublicUrl(filePath).data.publicUrl}?v=${version}`;
};

let failures = 0;
for (const course of courses) {
  const { data: found, error } = await supabaseAdmin.from('courses').select('id').eq('title', course.title).maybeSingle();
  if (error || !found) {
    failures += 1;
    console.error(`✗ Curso "${course.title}" não encontrado no banco.`);
    continue;
  }

  const { moduleIds, lessonIds } = await loadExistingIds(found.id);
  const content = [];
  for (const [index, module] of course.modules.entries()) {
    const documentUrl = await uploadHandout(found.id, index + 1, handoutFor(course, module, index));
    content.push({
      id: moduleIds.get(module.title) ?? null,
      title: module.title,
      lessons: [
        ...module.lessons.map((lesson) => ({
          id: lessonIds.get(`video:${lesson.title}`) ?? null,
          title: lesson.title,
          duration: `${lesson.minutes} min`,
          type: 'video',
          videoUrl: `https://www.youtube.com/watch?v=${lesson.videoId}`,
          documentUrl,
          description: lesson.description,
          videoCredit: `${course.credit} (YouTube)`,
        })),
        {
          id: lessonIds.get(`quiz:${module.quiz.title}`) ?? null,
          title: module.quiz.title,
          duration: `${module.quiz.questions.length * 2} min`,
          type: 'quiz',
          videoUrl: null,
          documentUrl: null,
          description: module.quiz.description,
          videoCredit: null,
          quizData: {
            passMark: 70,
            questions: module.quiz.questions.map(({ text, options, answer }) => ({ text, options, correct: options[answer] })),
          },
        },
      ],
    });
  }

  const { error: saveError } = await supabaseAdmin.rpc('save_course_content', { p_course_id: found.id, p_content: content });
  if (saveError) {
    failures += 1;
    console.error(`✗ ${course.title}: ${saveError.message}`);
    continue;
  }

  const lessonCount = content.reduce((total, module) => total + module.lessons.length, 0);
  console.log(`✓ ${course.title}: ${content.length} módulos, ${lessonCount} aulas, ${content.length} apostilas`);
}

process.exit(failures === 0 ? 0 : 1);
