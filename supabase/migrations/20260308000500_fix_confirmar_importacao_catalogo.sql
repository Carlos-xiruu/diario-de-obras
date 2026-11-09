-- Replaces the temporary staging table used by the original RPC. A temporary
-- table is scoped to the transaction, so it collided when the RPC ran twice.
begin;

create or replace function public.confirmar_importacao_catalogo(
  p_obra_id uuid,
  p_nome_arquivo text,
  p_hash_arquivo text,
  p_tamanho_bytes bigint,
  p_itens jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $func$
declare
  v_importacao_id uuid;
  v_revisao integer;
  v_total_pecas integer;
  v_total_quantidade integer;
  v_total_volume numeric(18,4);
begin
  if not public.usuario_atual_eh_administrador() then
    raise exception 'Apenas administradores podem importar catalogos.' using errcode = '42501';
  end if;
  if p_nome_arquivo is null or length(trim(p_nome_arquivo)) = 0 or length(trim(p_nome_arquivo)) > 255 then
    raise exception 'Nome de arquivo invalido.' using errcode = '22023';
  end if;
  if p_hash_arquivo is null or p_hash_arquivo !~ '^[0-9a-f]{64}$'
     or p_tamanho_bytes is null or p_tamanho_bytes <= 0 or p_tamanho_bytes > 10485760 then
    raise exception 'Metadados do arquivo invalidos.' using errcode = '22023';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Catalogo vazio ou acima do limite permitido.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_itens) = 0 or jsonb_array_length(p_itens) > 5000 then
    raise exception 'Catalogo vazio ou acima do limite permitido.' using errcode = '22023';
  end if;

  -- Serializes imports for this work, including revision calculation and swap.
  perform 1 from public.obras where id = p_obra_id for update;
  if not found then raise exception 'Obra nao encontrada.' using errcode = 'P0002'; end if;

  if exists (
    with itens as (
      select trim(item.localizacao) as localizacao, trim(item.tipo) as tipo,
        upper(trim(item.codigo)) as codigo, item.quantidade_prevista, item.volume_unitario_m3
      from jsonb_to_recordset(p_itens) as item(
        localizacao text, tipo text, codigo text, quantidade_prevista integer, volume_unitario_m3 numeric
      )
    )
    select 1 from itens
    where localizacao is null or localizacao = '' or tipo is null or tipo = '' or codigo is null or codigo = ''
      or quantidade_prevista is null or quantidade_prevista < 0
      or volume_unitario_m3 is null or volume_unitario_m3 < 0
  ) then
    raise exception 'Catalogo contem item invalido.' using errcode = '22023';
  end if;
  if exists (
    with itens as (
      select trim(item.localizacao) as localizacao, trim(item.tipo) as tipo, upper(trim(item.codigo)) as codigo
      from jsonb_to_recordset(p_itens) as item(localizacao text, tipo text, codigo text)
    )
    select 1 from itens group by lower(localizacao), lower(tipo), lower(codigo) having count(*) > 1
  ) then
    raise exception 'Catalogo contem pecas duplicadas na mesma localizacao.' using errcode = '23505';
  end if;
  if exists (select 1 from public.catalogo_importacoes where obra_id = p_obra_id and hash_arquivo = p_hash_arquivo) then
    raise exception 'Este arquivo ja foi importado para esta obra.' using errcode = '23505';
  end if;
  if exists (select 1 from public.obra_pecas where obra_id = p_obra_id and ativo and quantidade_montada > 0) then
    raise exception 'A revisao possui montagens e exige conciliacao especifica.' using errcode = '55000';
  end if;

  select coalesce(max(revisao), 0) + 1 into v_revisao from public.catalogo_importacoes where obra_id = p_obra_id;
  with itens as (
    select item.quantidade_prevista, item.volume_unitario_m3
    from jsonb_to_recordset(p_itens) as item(quantidade_prevista integer, volume_unitario_m3 numeric)
  )
  select count(*), coalesce(sum(quantidade_prevista), 0), coalesce(sum(quantidade_prevista * volume_unitario_m3), 0)
  into v_total_pecas, v_total_quantidade, v_total_volume from itens;

  update public.obra_pecas set ativo = false, desativado_em = now(), atualizado_em = now()
  where obra_id = p_obra_id and ativo;
  update public.catalogo_importacoes set status = 'substituida' where obra_id = p_obra_id and status = 'aplicada';

  insert into public.catalogo_importacoes (
    obra_id, revisao, nome_arquivo, hash_arquivo, tamanho_bytes, status, resumo, criado_por
  ) values (
    p_obra_id, v_revisao, trim(p_nome_arquivo), p_hash_arquivo, p_tamanho_bytes, 'aplicada',
    jsonb_build_object('grupos', v_total_pecas, 'quantidade_prevista', v_total_quantidade, 'volume_previsto_m3', v_total_volume),
    auth.uid()
  ) returning id into v_importacao_id;

  with itens as (
    select trim(item.localizacao) as localizacao
    from jsonb_to_recordset(p_itens) as item(localizacao text)
  )
  insert into public.obra_localizacoes (obra_id, nome)
  select p_obra_id, localizacao from itens group by localizacao
  on conflict (obra_id, nome_normalizado) do nothing;

  with itens as (
    select trim(item.localizacao) as localizacao, trim(item.tipo) as tipo,
      upper(trim(item.codigo)) as codigo, item.quantidade_prevista, item.volume_unitario_m3
    from jsonb_to_recordset(p_itens) as item(
      localizacao text, tipo text, codigo text, quantidade_prevista integer, volume_unitario_m3 numeric
    )
  )
  insert into public.obra_pecas (
    obra_id, localizacao_id, importacao_id, tipo, codigo, quantidade_prevista, volume_unitario_m3
  )
  select p_obra_id, l.id, v_importacao_id, i.tipo, i.codigo, i.quantidade_prevista, i.volume_unitario_m3
  from itens i join public.obra_localizacoes l
    on l.obra_id = p_obra_id and l.nome_normalizado = lower(i.localizacao);

  return jsonb_build_object(
    'importacao_id', v_importacao_id, 'revisao', v_revisao, 'grupos', v_total_pecas,
    'quantidade_prevista', v_total_quantidade, 'volume_previsto_m3', v_total_volume
  );
end;
$func$;

revoke all on function public.confirmar_importacao_catalogo(uuid, text, text, bigint, jsonb) from public;
grant execute on function public.confirmar_importacao_catalogo(uuid, text, text, bigint, jsonb) to authenticated;

commit;
