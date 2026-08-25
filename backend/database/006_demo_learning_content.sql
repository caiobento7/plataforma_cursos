-- Execute este arquivo no SQL Editor do Supabase depois de 002_learning_content.sql.
--
-- Popula módulos, aulas e o quiz do curso "Introdução à Programação". Sem esta
-- carga o catálogo existe, mas todo curso abre em "Conteúdo Indisponível": o
-- seed original insere apenas a tabela courses, e não há conteúdo de aprendizagem.
--
-- O arquivo é idempotente: se o curso já possuir módulos, nada é executado.

do $$
declare
  v_course_id bigint;
  v_module_1  bigint;
  v_module_2  bigint;
  v_module_3  bigint;
  v_quiz_lesson bigint;
  v_quiz_id   bigint;
begin
  select id into v_course_id
  from public.courses
  where title = 'Introdução à Programação'
  limit 1;

  if v_course_id is null then
    raise notice 'Curso "Introdução à Programação" não encontrado. Execute seed.sql antes.';
    return;
  end if;

  if exists (select 1 from public.course_modules where course_id = v_course_id) then
    raise notice 'O curso já possui conteúdo. Nada foi alterado.';
    return;
  end if;

  -- Módulos -----------------------------------------------------------------

  insert into public.course_modules (course_id, title, sort_order)
  values (v_course_id, 'Módulo 1: Introdução', 0)
  returning id into v_module_1;

  insert into public.course_modules (course_id, title, sort_order)
  values (v_course_id, 'Módulo 2: Variáveis e Tipos', 1)
  returning id into v_module_2;

  insert into public.course_modules (course_id, title, sort_order)
  values (v_course_id, 'Módulo 3: Estruturas', 2)
  returning id into v_module_3;

  -- Aulas do Módulo 1 -------------------------------------------------------

  insert into public.lessons (module_id, title, duration, content_type, video_url, document_url, sort_order)
  values (
    v_module_1, 'O que é programação?', '15 min', 'video',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    0
  );

  insert into public.lessons (module_id, title, duration, content_type, video_url, sort_order)
  values (v_module_1, 'Primeiros passos', '20 min', 'video', 'https://www.w3schools.com/html/mov_bbb.mp4', 1);

  insert into public.lessons (module_id, title, duration, content_type, sort_order)
  values (v_module_1, 'Quiz: Conceitos básicos', '10 min', 'quiz', 2)
  returning id into v_quiz_lesson;

  -- Aulas do Módulo 2 -------------------------------------------------------

  insert into public.lessons (module_id, title, duration, content_type, video_url, sort_order)
  values (v_module_2, 'Declarando variáveis', '25 min', 'video', 'https://www.w3schools.com/html/mov_bbb.mp4', 0);

  insert into public.lessons (module_id, title, duration, content_type, video_url, sort_order)
  values (v_module_2, 'Tipos de dados primitivos', '30 min', 'video', 'https://www.w3schools.com/html/mov_bbb.mp4', 1);

  -- Aulas do Módulo 3 -------------------------------------------------------

  insert into public.lessons (module_id, title, duration, content_type, video_url, sort_order)
  values (v_module_3, 'Operadores lógicos', '20 min', 'video', 'https://www.w3schools.com/html/mov_bbb.mp4', 0);

  -- Quiz do Módulo 1 --------------------------------------------------------

  insert into public.quizzes (lesson_id, pass_mark)
  values (v_quiz_lesson, 70)
  returning id into v_quiz_id;

  insert into public.quiz_questions (quiz_id, question_text, options, correct_answer, sort_order) values
    (v_quiz_id, 'O que é uma variável?',
     '["Um valor constante","Um contêiner para armazenar dados","Uma função","Um tipo de loop"]'::jsonb,
     'Um contêiner para armazenar dados', 0),
    (v_quiz_id, 'O que "HTML" significa?',
     '["HyperText Markup Language","High-Level Text Machine","Hyperlink and Text Markup","Home Tool Markup Language"]'::jsonb,
     'HyperText Markup Language', 1),
    (v_quiz_id, 'Qual símbolo é usado para comentários de linha única em JavaScript?',
     '["//","/* */","<!-- -->","#"]'::jsonb,
     '//', 2),
    (v_quiz_id, 'O que o CSS faz?',
     '["Estrutura o conteúdo da web","Define a estilização da web","Controla a lógica do site","Gerencia o banco de dados"]'::jsonb,
     'Define a estilização da web', 3),
    (v_quiz_id, 'Qual das opções NÃO é um tipo de dado primitivo em JavaScript?',
     '["String","Number","Boolean","Object"]'::jsonb,
     'Object', 4),
    (v_quiz_id, 'O que é um "array"?',
     '["Uma coleção ordenada de valores","Uma função matemática","Um único valor","Um loop condicional"]'::jsonb,
     'Uma coleção ordenada de valores', 5),
    (v_quiz_id, 'Qual loop continua enquanto a condição for verdadeira?',
     '["while","for","if","switch"]'::jsonb,
     'while', 6),
    (v_quiz_id, 'Como você chama uma função chamada "myFunction"?',
     '["call myFunction()","myFunction;","myFunction()","execute myFunction"]'::jsonb,
     'myFunction()', 7),
    (v_quiz_id, 'O que "React" é?',
     '["Um framework backend","Uma biblioteca JavaScript para UI","Um banco de dados","Um sistema operacional"]'::jsonb,
     'Uma biblioteca JavaScript para UI', 8),
    (v_quiz_id, 'O que === faz em JavaScript?',
     '["Define o valor de uma variável","Compara valor, mas não tipo","Compara valor e tipo","Executa uma função"]'::jsonb,
     'Compara valor e tipo', 9);

  raise notice 'Conteúdo do curso "Introdução à Programação" carregado com sucesso.';
end $$;
