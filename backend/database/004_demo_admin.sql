-- Execute este arquivo depois de 003_admin_role.sql.
-- Promove a conta de demonstração Admin criada para o backoffice.

update public.profiles
set role = 'admin'
where id = 'ae1e1222-7c54-405e-80dc-e5b1dad19c14';
