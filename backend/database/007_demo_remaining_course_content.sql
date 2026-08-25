-- Execute este arquivo no SQL Editor do Supabase depois de 006_demo_learning_content.sql.
--
-- Adiciona dois módulos e seis aulas demonstrativas para cada curso inicial
-- que ainda não recebeu conteúdo. É seguro executar mais de uma vez.

with module_seed(course_title, module_title, sort_order) as (
  values
    ('Design UX/UI Avançado', 'Módulo 1: Fundamentos de UX', 0),
    ('Design UX/UI Avançado', 'Módulo 2: Interface e Protótipo', 1),
    ('Marketing Digital', 'Módulo 1: Estratégia Digital', 0),
    ('Marketing Digital', 'Módulo 2: Campanhas e Métricas', 1),
    ('React: O Guia Completo', 'Módulo 1: React Essencial', 0),
    ('React: O Guia Completo', 'Módulo 2: Componentes e Estado', 1),
    ('Python para Análise de Dados', 'Módulo 1: Python para Dados', 0),
    ('Python para Análise de Dados', 'Módulo 2: Análise e Visualização', 1),
    ('Gestão de Projetos', 'Módulo 1: Planejamento do Projeto', 0),
    ('Gestão de Projetos', 'Módulo 2: Execução e Acompanhamento', 1)
)
insert into public.course_modules (course_id, title, sort_order)
select course.id, seed.module_title, seed.sort_order
from module_seed seed
join public.courses course on course.title = seed.course_title
where not exists (
  select 1
  from public.course_modules existing
  where existing.course_id = course.id
    and existing.sort_order = seed.sort_order
);

with lesson_seed(course_title, module_order, lesson_title, duration, sort_order) as (
  values
    ('Design UX/UI Avançado', 0, 'Pesquisa com usuários', '18 min', 0),
    ('Design UX/UI Avançado', 0, 'Jornada e persona', '22 min', 1),
    ('Design UX/UI Avançado', 0, 'Arquitetura da informação', '20 min', 2),
    ('Design UX/UI Avançado', 1, 'Princípios de interface', '25 min', 0),
    ('Design UX/UI Avançado', 1, 'Criando wireframes', '28 min', 1),
    ('Design UX/UI Avançado', 1, 'Protótipo navegável', '30 min', 2),

    ('Marketing Digital', 0, 'Panorama do marketing digital', '15 min', 0),
    ('Marketing Digital', 0, 'Definindo o público-alvo', '20 min', 1),
    ('Marketing Digital', 0, 'Funil de vendas', '24 min', 2),
    ('Marketing Digital', 1, 'Conteúdo para redes sociais', '22 min', 0),
    ('Marketing Digital', 1, 'Introdução ao tráfego pago', '26 min', 1),
    ('Marketing Digital', 1, 'Leitura de métricas', '18 min', 2),

    ('React: O Guia Completo', 0, 'Como o React funciona', '18 min', 0),
    ('React: O Guia Completo', 0, 'JSX na prática', '20 min', 1),
    ('React: O Guia Completo', 0, 'Criando o primeiro componente', '24 min', 2),
    ('React: O Guia Completo', 1, 'Props e composição', '22 min', 0),
    ('React: O Guia Completo', 1, 'Estado com useState', '28 min', 1),
    ('React: O Guia Completo', 1, 'Eventos e renderização', '25 min', 2),

    ('Python para Análise de Dados', 0, 'Ambiente de análise', '16 min', 0),
    ('Python para Análise de Dados', 0, 'Variáveis, listas e dicionários', '24 min', 1),
    ('Python para Análise de Dados', 0, 'Introdução ao Pandas', '30 min', 2),
    ('Python para Análise de Dados', 1, 'Importando dados CSV', '20 min', 0),
    ('Python para Análise de Dados', 1, 'Limpando dados', '28 min', 1),
    ('Python para Análise de Dados', 1, 'Gráficos iniciais', '25 min', 2),

    ('Gestão de Projetos', 0, 'O ciclo de vida do projeto', '17 min', 0),
    ('Gestão de Projetos', 0, 'Escopo e entregas', '22 min', 1),
    ('Gestão de Projetos', 0, 'Cronograma e prioridades', '26 min', 2),
    ('Gestão de Projetos', 1, 'Métodos ágeis', '24 min', 0),
    ('Gestão de Projetos', 1, 'Riscos e comunicação', '20 min', 1),
    ('Gestão de Projetos', 1, 'Acompanhando resultados', '23 min', 2)
)
insert into public.lessons (module_id, title, duration, content_type, video_url, sort_order)
select
  module.id,
  seed.lesson_title,
  seed.duration,
  'video',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  seed.sort_order
from lesson_seed seed
join public.courses course on course.title = seed.course_title
join public.course_modules module
  on module.course_id = course.id
 and module.sort_order = seed.module_order
where not exists (
  select 1
  from public.lessons existing
  where existing.module_id = module.id
    and existing.sort_order = seed.sort_order
);
