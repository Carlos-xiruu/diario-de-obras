-- Manual production/staging step. It is outside automatic migrations because
-- the first administrator must be verified and registered beforehand.
do $hardening$
declare
  table_name text;
  policy_name text;
begin
  if not exists (
    select 1 from public.acessos_usuario
      where ativo and papel = 'administrador'
  ) then
    raise exception 'Cadastre e valide ao menos um administrador antes de aplicar RLS restritiva.';
  end if;

  -- Prevent ON DELETE CASCADE from deleting a work's historical diaries.
  execute 'alter table public.diarios drop constraint if exists diarios_obra_id_fkey';
  execute 'alter table public.diarios add constraint diarios_obra_id_fkey foreign key (obra_id) references public.obras(id) on delete restrict';
  execute 'alter table public.obras enable row level security';
  execute 'alter table public.diarios enable row level security';

  foreach table_name in array array['obras', 'diarios']
  loop
    for policy_name in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
  end loop;

  execute 'revoke all on public.obras, public.diarios from public, anon, authenticated';
  execute 'grant select, insert, update, delete on public.obras to authenticated';
  execute 'grant select, insert, update on public.diarios to authenticated';
  execute 'create policy "Usuarios autorizados leem obras" on public.obras for select to authenticated using (public.usuario_atual_autorizado())';
  execute 'create policy "Administradores gerenciam obras" on public.obras for all to authenticated using (public.usuario_atual_eh_administrador()) with check (public.usuario_atual_eh_administrador())';
  execute 'create policy "Usuarios autorizados leem diarios" on public.diarios for select to authenticated using (public.usuario_atual_autorizado())';
  execute 'create policy "Usuarios autorizados inserem diarios" on public.diarios for insert to authenticated with check (public.usuario_atual_autorizado())';
  execute 'create policy "Usuarios autorizados atualizam diarios" on public.diarios for update to authenticated using (public.usuario_atual_autorizado()) with check (public.usuario_atual_autorizado())';
end $hardening$;
