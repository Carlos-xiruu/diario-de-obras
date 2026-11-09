-- Execute manually as a database owner before the RLS hardening migration.
-- Replace the UUID with a verified existing auth.users.id. This is deliberately
-- not a migration: no guessed administrator is ever created automatically.
--
-- insert into public.acessos_usuario (user_id, papel, ativo)
-- values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID'::uuid, 'administrador', true)
-- on conflict (user_id) do update
-- set papel = excluded.papel, ativo = true, atualizado_em = now();

select
  u.id,
  u.email,
  a.papel,
  a.ativo
from auth.users u
left join public.acessos_usuario a on a.user_id = u.id
order by u.created_at;
