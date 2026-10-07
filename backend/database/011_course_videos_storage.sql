-- Execute este arquivo no SQL Editor do Supabase.
--
-- Cria o bucket do Supabase Storage que guarda os vídeos das aulas enviados
-- pelo editor de conteúdo. Assim como os materiais de apoio, o envio é feito
-- pelo navegador com uma URL assinada gerada pela API
-- (POST /api/courses/:courseId/uploads).
--
-- O limite de 50 MB é o máximo por arquivo no plano gratuito do Supabase.
-- O arquivo pode ser executado mais de uma vez.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-videos',
  'course-videos',
  true,
  52428800, -- 50 MB
  array['video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
