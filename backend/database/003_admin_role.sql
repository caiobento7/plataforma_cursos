-- Execute uma vez no SQL Editor para migrar o papel de professor para administrador.

alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles set role = 'admin' where role = 'teacher';

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'admin'));
