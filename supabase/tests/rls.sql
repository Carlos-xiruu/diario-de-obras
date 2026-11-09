-- Local/staging only. All mutations run in a rollback. Invoke with psql:
-- -v admin_user_id=10000000-0000-0000-0000-000000000001
-- -v collaborator_user_id=10000000-0000-0000-0000-000000000002
-- -v unauthorized_user_id=10000000-0000-0000-0000-000000000003
-- -v obra_id=<an existing obra UUID>
begin;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', :'admin_user_id', true);
do $$
declare
  obra_teste uuid;
  diario_teste uuid;
begin
  if not public.usuario_atual_eh_administrador() then
    raise exception 'Administrador esperado nao recebeu acesso administrativo';
  end if;
  if not exists (select 1 from public.obras) then
    raise exception 'Administrador deveria conseguir ler obras';
  end if;

  insert into public.obras (nome_obra, cidade)
  values ('Obra RLS temporaria', 'Cidade RLS')
  returning id into obra_teste;
  update public.obras set cidade = 'Cidade RLS atualizada' where id = obra_teste;

  insert into public.diarios (obra_id, obra, cidade, data_registro, observacoes)
  values (obra_teste, 'Obra RLS temporaria', 'Cidade RLS atualizada', current_date, 'Teste RLS')
  returning id into diario_teste;
  update public.diarios set observacoes = 'Teste RLS atualizado' where id = diario_teste;

  begin
    delete from public.diarios where id = diario_teste;
    raise exception 'Administrador conseguiu excluir diario fisicamente';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.obras where id = obra_teste;
    raise exception 'Obra com diario relacionado foi excluida';
  exception when foreign_key_violation then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', :'collaborator_user_id', true);
select set_config('app.test.obra_id', :'obra_id', true);
do $$
declare
  affected integer;
  diario_teste uuid;
begin
  if not public.usuario_atual_autorizado() or public.usuario_atual_eh_administrador() then
    raise exception 'Papel de colaborador incorreto';
  end if;
  if not exists (select 1 from public.diarios) then
    raise exception 'Colaborador deveria conseguir ler diarios';
  end if;

  update public.obras
  set nome_obra = nome_obra
  where id = current_setting('app.test.obra_id')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'Colaborador conseguiu alterar obra';
  end if;

  insert into public.diarios (obra_id, obra, cidade, data_registro, observacoes)
  select id, nome_obra, cidade, current_date, 'Diario de colaborador'
  from public.obras
  where id = current_setting('app.test.obra_id')::uuid
  returning id into diario_teste;
  update public.diarios set observacoes = 'Diario de colaborador atualizado' where id = diario_teste;

  begin
    delete from public.diarios where id = diario_teste;
    raise exception 'Colaborador conseguiu excluir diario fisicamente';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', :'unauthorized_user_id', true);
do $$
begin
  if public.usuario_atual_autorizado() then
    raise exception 'Usuario sem vinculo recebeu acesso';
  end if;
  if exists (select 1 from public.obras) or exists (select 1 from public.diarios) then
    raise exception 'Usuario sem vinculo conseguiu ler dados';
  end if;
  begin
    insert into public.diarios (obra_id, obra, cidade, data_registro)
    values (current_setting('app.test.obra_id')::uuid, 'Nao autorizado', 'Nao autorizado', current_date);
    raise exception 'Usuario sem vinculo conseguiu inserir diario';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role anon;
do $$
begin
  begin
    perform 1 from public.obras;
    raise exception 'Anonimo conseguiu ler obras';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.diarios (obra, cidade, data_registro)
    values ('Anonimo', 'Anonimo', current_date);
    raise exception 'Anonimo conseguiu inserir diario';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
