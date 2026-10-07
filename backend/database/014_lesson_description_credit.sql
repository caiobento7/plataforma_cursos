-- Execute este arquivo no SQL Editor do Supabase depois de 009_save_course_content.sql.
--
-- Aulas ganham uma descrição (o que o aluno vai aprender) e o crédito do vídeo
-- (autor ou canal, para vídeos de terceiros incorporados do YouTube). A função
-- save_course_content é recriada para gravar os dois campos.
-- O arquivo pode ser executado mais de uma vez.

alter table public.lessons
  add column if not exists description text check (char_length(description) <= 1000),
  add column if not exists video_credit text check (char_length(video_credit) <= 120);

create or replace function public.save_course_content(p_course_id bigint, p_content jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_module jsonb;
  v_lesson jsonb;
  v_module_id bigint;
  v_lesson_id bigint;
  v_quiz_id bigint;
  v_module_order integer := 0;
  v_lesson_order integer;
  v_kept_modules bigint[] := '{}';
  v_kept_lessons bigint[] := '{}';
begin
  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'Curso % não encontrado.', p_course_id using errcode = 'P0002';
  end if;

  -- As colunas sort_order têm restrição de unicidade. Antes de reordenar, os
  -- valores atuais vão para uma faixa livre, evitando conflitos temporários
  -- entre itens que trocam de posição.
  update public.course_modules
  set sort_order = sort_order + 100000
  where course_id = p_course_id;

  update public.lessons
  set sort_order = sort_order + 100000
  where module_id in (select id from public.course_modules where course_id = p_course_id);

  for v_module in select value from jsonb_array_elements(p_content) loop
    v_module_id := null;

    if jsonb_typeof(v_module -> 'id') = 'number' then
      update public.course_modules
      set title = v_module ->> 'title',
          sort_order = v_module_order
      where id = (v_module ->> 'id')::bigint
        and course_id = p_course_id
      returning id into v_module_id;
    end if;

    if v_module_id is null then
      insert into public.course_modules (course_id, title, sort_order)
      values (p_course_id, v_module ->> 'title', v_module_order)
      returning id into v_module_id;
    end if;

    v_kept_modules := array_append(v_kept_modules, v_module_id);
    v_module_order := v_module_order + 1;
    v_lesson_order := 0;

    for v_lesson in select value from jsonb_array_elements(coalesce(v_module -> 'lessons', '[]'::jsonb)) loop
      v_lesson_id := null;

      if jsonb_typeof(v_lesson -> 'id') = 'number' then
        update public.lessons
        set module_id = v_module_id,
            title = v_lesson ->> 'title',
            duration = v_lesson ->> 'duration',
            content_type = v_lesson ->> 'type',
            video_url = v_lesson ->> 'videoUrl',
            document_url = v_lesson ->> 'documentUrl',
            description = v_lesson ->> 'description',
            video_credit = v_lesson ->> 'videoCredit',
            sort_order = v_lesson_order
        where id = (v_lesson ->> 'id')::bigint
          and module_id in (select id from public.course_modules where course_id = p_course_id)
        returning id into v_lesson_id;
      end if;

      if v_lesson_id is null then
        insert into public.lessons (module_id, title, duration, content_type, video_url, document_url, description, video_credit, sort_order)
        values (
          v_module_id,
          v_lesson ->> 'title',
          v_lesson ->> 'duration',
          v_lesson ->> 'type',
          v_lesson ->> 'videoUrl',
          v_lesson ->> 'documentUrl',
          v_lesson ->> 'description',
          v_lesson ->> 'videoCredit',
          v_lesson_order
        )
        returning id into v_lesson_id;
      end if;

      v_kept_lessons := array_append(v_kept_lessons, v_lesson_id);
      v_lesson_order := v_lesson_order + 1;

      if v_lesson ->> 'type' = 'quiz' then
        insert into public.quizzes (lesson_id, pass_mark)
        values (v_lesson_id, (v_lesson -> 'quizData' ->> 'passMark')::integer)
        on conflict (lesson_id) do update set pass_mark = excluded.pass_mark
        returning id into v_quiz_id;

        delete from public.quiz_questions where quiz_id = v_quiz_id;

        insert into public.quiz_questions (quiz_id, question_text, options, correct_answer, sort_order)
        select v_quiz_id,
               question ->> 'text',
               question -> 'options',
               question ->> 'correct',
               (position - 1)::integer
        from jsonb_array_elements(v_lesson -> 'quizData' -> 'questions') with ordinality as q(question, position);
      else
        delete from public.quizzes where lesson_id = v_lesson_id;
      end if;
    end loop;
  end loop;

  delete from public.lessons
  where module_id in (select id from public.course_modules where course_id = p_course_id)
    and id <> all (v_kept_lessons);

  delete from public.course_modules
  where course_id = p_course_id
    and id <> all (v_kept_modules);
end;
$$;

-- Funções do schema public ficam expostas pela API REST do Supabase. Esta só
-- pode ser executada pelo backend, que usa a chave secreta (service_role).
revoke execute on function public.save_course_content(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.save_course_content(bigint, jsonb) to service_role;
