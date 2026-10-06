-- Execute este arquivo no SQL Editor do Supabase.
--
-- Cria o bucket do Supabase Storage que guarda os materiais de apoio enviados
-- pelo editor de conteúdo. O envio é feito pelo navegador com uma URL
-- assinada gerada pela API (POST /api/courses/:courseId/materials/upload-url),
-- então nenhuma política de escrita pública é necessária.
--
-- O bucket é público para leitura: o link salvo na aula abre o arquivo
-- diretamente. O arquivo pode ser executado mais de uma vez.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-materials',
  'course-materials',
  true,
  20971520, -- 20 MB
  array[
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
    'image/jpeg'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
