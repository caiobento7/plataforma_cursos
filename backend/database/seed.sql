-- Execute este arquivo no SQL Editor depois de schema.sql.
-- A cláusula WHERE NOT EXISTS torna a carga segura para executar mais de uma vez.

insert into public.courses (title, price, level, image_url)
select *
from (
  values
    ('Introdução à Programação', 99.90, 'Iniciante', 'https://placehold.co/600x400/2c3e50/ffffff?text=Programação'),
    ('Design UX/UI Avançado', 149.90, 'Avançado', 'https://placehold.co/600x400/3498db/ffffff?text=UX/UI'),
    ('Marketing Digital', 0, 'Intermediário', 'https://placehold.co/600x400/e67e22/ffffff?text=Marketing'),
    ('Gestão de Projetos', 199.90, 'Iniciante', 'https://placehold.co/600x400/1abc9c/ffffff?text=Gestão'),
    ('Python para Análise de Dados', 129.90, 'Intermediário', 'https://placehold.co/600x400/9b59b6/ffffff?text=Python'),
    ('React: O Guia Completo', 0, 'Avançado', 'https://placehold.co/600x400/34495e/ffffff?text=React')
) as seed(title, price, level, image_url)
where not exists (
  select 1 from public.courses existing where existing.title = seed.title
);
