-- Local-only integration test for catalog import, revisions and RLS.
do $catalogo$
declare
  obra_a uuid;
  obra_b uuid;
  result jsonb;
  visible boolean;
  quantidade integer;
begin
  -- Recreate only this test's isolated works so the file is repeatable.
  delete from public.obra_pecas where obra_id in (select id from public.obras where nome_obra in ('Catalogo local A', 'Catalogo local B'));
  delete from public.obra_localizacoes where obra_id in (select id from public.obras where nome_obra in ('Catalogo local A', 'Catalogo local B'));
  delete from public.catalogo_importacoes where obra_id in (select id from public.obras where nome_obra in ('Catalogo local A', 'Catalogo local B'));
  delete from public.obras where nome_obra in ('Catalogo local A', 'Catalogo local B');
  insert into public.obras (nome_obra, cidade) values ('Catalogo local A', 'Teste') returning id into obra_a;
  insert into public.obras (nome_obra, cidade) values ('Catalogo local B', 'Teste') returning id into obra_b;

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  execute 'set local role authenticated';
  execute format($sql$
    select public.confirmar_importacao_catalogo(
      %L::uuid, 'catalogo-a.xlsx', repeat('a', 64), 1024,
      '[{"localizacao":"Pilares","tipo":"LP","codigo":"LP003","quantidade_prevista":3,"volume_unitario_m3":0.8},{"localizacao":"Cobertura","tipo":"LP","codigo":"LP003","quantidade_prevista":2,"volume_unitario_m3":0.8}]'::jsonb
    )
  $sql$, obra_a) into result;
  if (result->>'quantidade_prevista')::integer <> 5 then raise exception 'Total importado incorreto'; end if;

  execute format('select count(*) from public.obra_pecas where obra_id = %L::uuid and ativo', obra_a) into quantidade;
  if quantidade <> 2 then raise exception 'Catalogo nao preservou codigo repetido por pavimento'; end if;
  begin
    execute format($sql$
      insert into public.catalogo_importacoes (obra_id, revisao, nome_arquivo, hash_arquivo, tamanho_bytes, status, resumo, criado_por)
      values (%L::uuid, 99, 'duplicado.xlsx', repeat('a', 64), 1024, 'aplicada', '{}'::jsonb, auth.uid())
    $sql$, obra_a);
    raise exception 'Hash duplicado foi aceito';
  exception when unique_violation then null;
  end;
  execute format('select exists (select 1 from public.obra_pecas where obra_id = %L::uuid)', obra_b) into visible;
  if visible then raise exception 'Falha parcial criou pecas em outra obra'; end if;

  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
  execute format('select exists (select 1 from public.obra_pecas where obra_id = %L::uuid)', obra_a) into visible;
  if not visible then raise exception 'Colaborador nao conseguiu consultar catalogo'; end if;
  begin
    execute format($sql$
      insert into public.catalogo_importacoes (obra_id, revisao, nome_arquivo, hash_arquivo, tamanho_bytes, status, resumo, criado_por)
      values (%L::uuid, 98, 'colaborador.xlsx', repeat('c', 64), 1024, 'aplicada', '{}'::jsonb, auth.uid())
    $sql$, obra_a);
    raise exception 'Colaborador conseguiu gerenciar importacao';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
  execute format('select exists (select 1 from public.obra_pecas where obra_id = %L::uuid)', obra_a) into visible;
  if visible then raise exception 'Usuario sem acesso leu catalogo'; end if;
end $catalogo$;
