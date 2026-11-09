-- Runs in a new database request after catalogo-pecas-local.sql.
do $reimport$
declare
  obra_a uuid;
  obra_b uuid;
  result jsonb;
  revisoes integer;
  ativas integer;
begin
  select id into obra_a from public.obras where nome_obra = 'Catalogo local A';
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  execute 'set local role authenticated';
  execute format($sql$
    select public.confirmar_importacao_catalogo(
      %L::uuid, 'catalogo-revisado.xlsx', repeat('d', 64), 2048,
      '[{"localizacao":"Pilares","tipo":"LP","codigo":"LP003","quantidade_prevista":4,"volume_unitario_m3":0.8}]'::jsonb
    )
  $sql$, obra_a) into result;
  if (result->>'revisao')::integer <> 2 then raise exception 'Reimportacao nao criou revisao 2'; end if;
  execute format('select count(*) from public.catalogo_importacoes where obra_id = %L::uuid', obra_a) into revisoes;
  execute format('select count(*) from public.obra_pecas where obra_id = %L::uuid and ativo', obra_a) into ativas;
  if revisoes <> 2 or ativas <> 1 then raise exception 'Reimportacao nao arquivou a revisao anterior'; end if;

-- The function must be reusable within one transaction; no session temp object
-- may survive a call and collide with the next one.
  select id into obra_b from public.obras where nome_obra = 'Catalogo local B';
  perform public.confirmar_importacao_catalogo(
    obra_b, 'transacao-1.xlsx', repeat('e', 64), 1024,
    '[{"localizacao":"Pilares","tipo":"LP","codigo":"LP003","quantidade_prevista":1,"volume_unitario_m3":0.8}]'::jsonb
  );
  perform public.confirmar_importacao_catalogo(
    obra_b, 'transacao-2.xlsx', repeat('f', 64), 1024,
    '[{"localizacao":"Cobertura","tipo":"LP","codigo":"LP003","quantidade_prevista":1,"volume_unitario_m3":0.8}]'::jsonb
  );
  execute format('select count(*) from public.catalogo_importacoes where obra_id = %L::uuid', obra_b) into revisoes;
  if revisoes <> 2 then raise exception 'Duas chamadas na mesma transacao nao persistiram as duas revisoes'; end if;
end $reimport$;
