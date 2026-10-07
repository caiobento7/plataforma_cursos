-- Execute este arquivo no SQL Editor do Supabase depois de 014_lesson_description_credit.sql.
--
-- Guarda a melhor nota aprovada de cada quiz no progresso do aluno. A nota final
-- do curso é a média dessas notas, e o certificado exige todas as aulas
-- concluídas e nota final de pelo menos 70%.
-- O arquivo pode ser executado mais de uma vez.

alter table public.lesson_progress
  add column if not exists quiz_score integer check (quiz_score between 0 and 100);
