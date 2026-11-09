-- Runs against the synthetic identities from local-baseline.sql. It is a
-- single statement so `supabase db query --file` can execute it locally.
do $rls$
declare
  obra_id_teste uuid;
  obra_temporaria uuid;
  diario_temporario uuid;
  visible boolean;
  administrador boolean;
  affected integer;
begin
  select id into obra_id_teste from public.obras order by id limit 1;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  execute 'set local role authenticated';
  execute 'select public.usuario_atual_eh_administrador()' into administrador;
  if not administrador then raise exception 'Administrador local sem acesso'; end if;
  execute 'insert into public.obras (nome_obra, cidade) values (''Obra RLS temporaria'', ''Cidade RLS'') returning id' into obra_temporaria;
  execute format('update public.obras set cidade = ''Cidade RLS atualizada'' where id = %L::uuid', obra_temporaria);
  execute format('insert into public.diarios (obra_id, obra, cidade, data_registro) values (%L::uuid, ''Obra RLS temporaria'', ''Cidade RLS'', current_date) returning id', obra_temporaria) into diario_temporario;
  begin
    execute format('delete from public.diarios where id = %L::uuid', diario_temporario);
    raise exception 'Administrador excluiu diario fisicamente';
  exception when insufficient_privilege then null;
  end;
  begin
    execute format('delete from public.obras where id = %L::uuid', obra_temporaria);
    raise exception 'Administrador excluiu obra com diario';
  exception when foreign_key_violation then null;
  end;

  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
  execute 'select public.usuario_atual_eh_administrador()' into administrador;
  if administrador then raise exception 'Colaborador recebeu papel administrativo'; end if;
  execute format('update public.obras set nome_obra = nome_obra where id = %L::uuid', obra_id_teste);
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Colaborador alterou obra'; end if;
  execute format('insert into public.diarios (obra_id, obra, cidade, data_registro) select id, nome_obra, cidade, current_date from public.obras where id = %L::uuid returning id', obra_id_teste) into diario_temporario;
  execute format('update public.diarios set observacoes = ''Atualizado pelo colaborador'' where id = %L::uuid', diario_temporario);
  begin
    execute format('delete from public.diarios where id = %L::uuid', diario_temporario);
    raise exception 'Colaborador excluiu diario fisicamente';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
  execute 'select exists (select 1 from public.obras)' into visible;
  if visible then raise exception 'Usuario sem acesso leu obras'; end if;
  begin
    execute format('insert into public.diarios (obra_id, obra, cidade, data_registro) values (%L::uuid, ''Nao autorizado'', ''Nao autorizado'', current_date)', obra_id_teste);
    raise exception 'Usuario sem acesso inseriu diario';
  exception when insufficient_privilege then null;
  end;

  execute 'set local role anon';
  begin
    execute 'select 1 from public.obras limit 1';
    raise exception 'Anonimo leu obras';
  exception when insufficient_privilege then null;
  end;

  execute 'reset role';
  delete from public.diarios where obra = 'Obra RLS temporaria' or observacoes = 'Atualizado pelo colaborador';
  delete from public.obras where id = obra_temporaria;
end $rls$;
