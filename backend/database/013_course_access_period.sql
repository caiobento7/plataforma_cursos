-- Execute este arquivo no SQL Editor do Supabase.
--
-- Prazo de acesso aos cursos: cada curso define por quantos meses o aluno tem
-- acesso a partir da matrícula (6 por padrão), e cada matrícula guarda a data
-- em que o acesso expira. Renovar o curso estende essa data.
--
-- Matrículas existentes recebem o prazo a partir da data em que foram feitas.
-- O arquivo pode ser executado mais de uma vez.

alter table public.courses
  add column if not exists access_months integer not null default 6
    check (access_months between 1 and 36);

alter table public.enrollments
  add column if not exists expires_at timestamptz;

update public.enrollments as enrollment
set expires_at = enrollment.enrolled_at + make_interval(months => course.access_months)
from public.courses as course
where course.id = enrollment.course_id
  and enrollment.expires_at is null;
