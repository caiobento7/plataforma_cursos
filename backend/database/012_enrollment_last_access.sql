-- Execute este arquivo no SQL Editor do Supabase.
--
-- Registra, em cada matrícula, a última aula que o aluno abriu e quando.
-- É o que alimenta o "Continue de onde parou" do painel do aluno e a aula em
-- que o player abre. O arquivo pode ser executado mais de uma vez.

alter table public.enrollments
  add column if not exists last_lesson_id bigint references public.lessons(id) on delete set null,
  add column if not exists last_accessed_at timestamptz;
