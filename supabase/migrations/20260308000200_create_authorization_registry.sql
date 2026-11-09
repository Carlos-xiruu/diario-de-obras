-- This migration is safe to apply before authorization is enforced. It does
-- not change existing obras/diarios policies and therefore cannot lock users out.
begin;

do $$
begin
  create type public.papel_usuario as enum ('administrador', 'colaborador');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.acessos_usuario (
  user_id uuid primary key references auth.users(id) on delete cascade,
  papel public.papel_usuario not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.acessos_usuario enable row level security;

drop policy if exists "Usuario le o proprio acesso" on public.acessos_usuario;
create policy "Usuario le o proprio acesso"
on public.acessos_usuario
for select
to authenticated
using (user_id = auth.uid());

revoke all on public.acessos_usuario from public, anon, authenticated;
grant select on public.acessos_usuario to authenticated;

create or replace function public.usuario_atual_autorizado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.acessos_usuario a
    where a.user_id = auth.uid()
      and a.ativo
  );
$$;

create or replace function public.usuario_atual_eh_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.acessos_usuario a
    where a.user_id = auth.uid()
      and a.ativo
      and a.papel = 'administrador'
  );
$$;

revoke all on function public.usuario_atual_autorizado() from public;
revoke all on function public.usuario_atual_eh_administrador() from public;
grant execute on function public.usuario_atual_autorizado() to authenticated;
grant execute on function public.usuario_atual_eh_administrador() to authenticated;

commit;
