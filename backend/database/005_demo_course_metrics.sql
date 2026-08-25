-- Execute este arquivo no SQL Editor do Supabase depois de 004_demo_admin.sql.
-- Dados demonstrativos persistidos para avaliações e indicadores do backoffice.

alter table public.courses
  add column if not exists rating numeric(2, 1) not null default 4.0 check (rating between 0 and 5),
  add column if not exists review_count integer not null default 0 check (review_count >= 0),
  add column if not exists enrollment_count integer not null default 0 check (enrollment_count >= 0),
  add column if not exists revenue_30d numeric(10, 2) not null default 0 check (revenue_30d >= 0),
  add column if not exists new_students_30d integer not null default 0 check (new_students_30d >= 0);

-- A atualização por título permite executar o script novamente com segurança.
update public.courses as course
set
  rating = metrics.rating,
  review_count = metrics.review_count,
  enrollment_count = metrics.enrollment_count,
  revenue_30d = metrics.revenue_30d,
  new_students_30d = metrics.new_students_30d
from (
  values
    ('Design UX/UI Avançado', 4.9, 284, 514, 2038.00, 38),
    ('Marketing Digital', 4.6, 190, 761, 0.00, 42),
    ('React: O Guia Completo', 4.8, 230, 689, 0.00, 35),
    ('Python para Análise de Dados', 4.9, 316, 438, 1688.00, 24),
    ('Gestão de Projetos', 4.7, 132, 267, 1184.00, 10),
    ('Introdução à Programação', 4.7, 186, 392, 910.00, 3)
) as metrics(title, rating, review_count, enrollment_count, revenue_30d, new_students_30d)
where course.title = metrics.title;
