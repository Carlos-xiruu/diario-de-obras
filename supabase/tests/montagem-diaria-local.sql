-- Local integration coverage for balances, idempotency, RLS and audit.
do $montagem$
declare
  obra_a uuid := gen_random_uuid();
  obra_b uuid := gen_random_uuid();
  local_a uuid := gen_random_uuid();
  local_b uuid := gen_random_uuid();
  importacao_a uuid := gen_random_uuid();
  importacao_b uuid := gen_random_uuid();
  peca_a uuid := gen_random_uuid();
  peca_b uuid := gen_random_uuid();
  peca_outra_obra uuid := gen_random_uuid();
  diario_a uuid;
  diario_b uuid;
  resultado jsonb;
  saldo integer;
  auditorias integer;
begin
  insert into public.obras (id, nome_obra, cidade) values
    (obra_a, 'Obra montagem local A', 'Teste'), (obra_b, 'Obra montagem local B', 'Teste');
  insert into public.catalogo_importacoes (id, obra_id, revisao, nome_arquivo, hash_arquivo, tamanho_bytes, status, resumo, criado_por) values
    (importacao_a, obra_a, 1, 'montagem-local.xlsx', repeat('1', 64), 1024, 'aplicada', '{}'::jsonb, '10000000-0000-0000-0000-000000000001');
  insert into public.obra_localizacoes (id, obra_id, nome) values (local_a, obra_a, 'Pavimento teste');
  insert into public.obra_pecas (id, obra_id, localizacao_id, importacao_id, tipo, codigo, quantidade_prevista, volume_unitario_m3) values
    (peca_a, obra_a, local_a, importacao_a, 'VR', 'VR006', 3, 0.5),
    (peca_b, obra_a, local_a, importacao_a, 'LP', 'LP001', 2, 0.8);
  insert into public.catalogo_importacoes (id, obra_id, revisao, nome_arquivo, hash_arquivo, tamanho_bytes, status, resumo, criado_por)
  values (importacao_b, obra_b, 1, 'outra-obra.xlsx', repeat('2', 64), 1024, 'aplicada', '{}'::jsonb, '10000000-0000-0000-0000-000000000001');
  insert into public.obra_localizacoes (id, obra_id, nome) values (local_b, obra_b, 'Outro pavimento');
  insert into public.obra_pecas (id, obra_id, localizacao_id, importacao_id, tipo, codigo, quantidade_prevista, volume_unitario_m3)
  values (peca_outra_obra, obra_b, local_b, importacao_b, 'VR', 'VR006', 1, 0.5);

  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  execute 'set local role authenticated';
  insert into public.diarios (obra_id, obra, cidade, data_registro) values (obra_a, 'Obra montagem local A', 'Teste', current_date) returning id into diario_a;
  select public.aplicar_montagem_diario(diario_a, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 1)), 'rascunho', '00000000-0000-0000-0000-000000000101', null) into resultado;
  select quantidade_montada into saldo from public.obra_pecas where id = peca_a;
  if saldo <> 0 then raise exception 'Rascunho alterou saldo'; end if;
  select public.aplicar_montagem_diario(diario_a, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 1)), 'confirmar', '00000000-0000-0000-0000-000000000102', null) into resultado;
  select quantidade_montada into saldo from public.obra_pecas where id = peca_a;
  if saldo <> 1 or (resultado->>'volume_estruturado_m3')::numeric <> 0.5 then raise exception 'Confirmacao parcial incorreta'; end if;
  perform public.aplicar_montagem_diario(diario_a, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 1)), 'confirmar', '00000000-0000-0000-0000-000000000102', null);
  begin
    perform public.aplicar_montagem_diario(diario_a, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 2)), 'confirmar', '00000000-0000-0000-0000-000000000102', null);
    raise exception 'Chave reutilizada com payload diferente foi aceita';
  exception when invalid_parameter_value then null;
  end;
  perform public.aplicar_montagem_diario(diario_a, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 2), jsonb_build_object('obra_peca_id', peca_b, 'quantidade', 1)), 'editar', '00000000-0000-0000-0000-000000000103', null);
  if (select quantidade_montada from public.obra_pecas where id = peca_a) <> 2 or (select quantidade_montada from public.obra_pecas where id = peca_b) <> 1 then raise exception 'Edicao por diferenca falhou'; end if;
  begin
    perform public.aplicar_montagem_diario(diario_a, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 4)), 'editar', '00000000-0000-0000-0000-000000000104', null);
    raise exception 'Saldo excedido foi aceito';
  exception when check_violation then null;
  end;
  if (select quantidade_montada from public.obra_pecas where id = peca_b) <> 1 then raise exception 'Falha parcial alterou outra peca'; end if;
  begin
    update public.obra_pecas set quantidade_montada = 0 where id = peca_a;
    raise exception 'Saldo foi alterado diretamente';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.aplicar_montagem_diario(diario_a, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_outra_obra, 'quantidade', 1)), 'editar', '00000000-0000-0000-0000-000000000105', null);
    raise exception 'Peca de outra obra foi aceita';
  exception when invalid_parameter_value then null;
  end;
  perform public.aplicar_montagem_diario(diario_a, '[]'::jsonb, 'cancelar', '00000000-0000-0000-0000-000000000106', 'Lancamento de teste');
  if (select quantidade_montada from public.obra_pecas where id = peca_a) <> 0 or (select quantidade_montada from public.obra_pecas where id = peca_b) <> 0 then raise exception 'Cancelamento nao devolveu saldo'; end if;
  begin
    perform public.aplicar_montagem_diario(diario_a, '[]'::jsonb, 'cancelar', '00000000-0000-0000-0000-000000000107', 'Duplicado');
    raise exception 'Cancelamento duplicado foi aceito';
  exception when object_not_in_prerequisite_state then null;
  end;

  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
  insert into public.diarios (obra_id, obra, cidade, data_registro) values (obra_a, 'Obra montagem local A', 'Teste', current_date) returning id into diario_b;
  perform public.aplicar_montagem_diario(diario_b, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 3)), 'confirmar', '00000000-0000-0000-0000-000000000108', null);
  if (select quantidade_pendente from public.obra_pecas where id = peca_a) <> 0 then raise exception 'Montagem total nao zerou saldo'; end if;
  begin
    perform public.aplicar_montagem_diario(diario_b, jsonb_build_array(jsonb_build_object('obra_peca_id', peca_a, 'quantidade', 4)), 'editar', '00000000-0000-0000-0000-000000000109', null);
    raise exception 'Montagem acima de saldo zero foi aceita';
  exception when check_violation then null;
  end;

  execute 'reset role';
  select count(*) into auditorias from public.diario_montagem_auditoria where diario_id = diario_a;
  if auditorias <> 4 then raise exception 'Auditoria incompleta: %', auditorias; end if;
end $montagem$;
