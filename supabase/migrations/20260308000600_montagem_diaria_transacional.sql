begin;

alter table public.diarios
  add column if not exists montagem_status text not null default 'rascunho'
    check (montagem_status in ('rascunho', 'confirmado', 'cancelado', 'legado')),
  add column if not exists volume_estruturado_m3 numeric(18,4) not null default 0 check (volume_estruturado_m3 >= 0),
  add column if not exists montagem_confirmada_em timestamptz,
  add column if not exists montagem_confirmada_por uuid references auth.users(id) on delete restrict,
  add column if not exists montagem_cancelada_em timestamptz,
  add column if not exists montagem_cancelada_por uuid references auth.users(id) on delete restrict,
  add column if not exists montagem_motivo_cancelamento text;

-- Existing diaries have only manually entered volume. They remain immutable
-- historical records for structured mounting purposes.
update public.diarios
set montagem_status = 'legado'
where montagem_status = 'rascunho' and criado_em < transaction_timestamp();

create table public.diario_itens_montagem (
  id uuid primary key default gen_random_uuid(),
  diario_id uuid not null references public.diarios(id) on delete restrict,
  obra_id uuid not null references public.obras(id) on delete restrict,
  obra_peca_id uuid not null references public.obra_pecas(id) on delete restrict,
  importacao_id uuid not null references public.catalogo_importacoes(id) on delete restrict,
  localizacao_snapshot text not null,
  tipo_snapshot text not null,
  codigo_snapshot text not null,
  quantidade integer not null check (quantidade > 0),
  volume_unitario_m3_snapshot numeric(16,4) not null check (volume_unitario_m3_snapshot >= 0),
  volume_total_m3 numeric(18,4) not null check (volume_total_m3 >= 0),
  aplicado boolean not null default false,
  criado_por uuid not null references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (diario_id, obra_peca_id)
);

create table public.diario_montagem_operacoes (
  id uuid primary key default gen_random_uuid(),
  diario_id uuid not null references public.diarios(id) on delete restrict,
  chave_idempotencia uuid not null,
  acao text not null check (acao in ('rascunho', 'confirmar', 'editar', 'cancelar')),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  resultado jsonb not null,
  criado_por uuid not null references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  unique (diario_id, chave_idempotencia)
);

create table public.diario_montagem_auditoria (
  id uuid primary key default gen_random_uuid(),
  diario_id uuid not null references public.diarios(id) on delete restrict,
  operacao_id uuid not null references public.diario_montagem_operacoes(id) on delete restrict,
  acao text not null check (acao in ('rascunho', 'confirmar', 'editar', 'cancelar')),
  motivo text,
  itens jsonb not null,
  volume_estruturado_m3 numeric(18,4) not null,
  responsavel_id uuid not null references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now()
);

create index diario_itens_montagem_diario_idx on public.diario_itens_montagem (diario_id, aplicado);
create index diario_itens_montagem_peca_idx on public.diario_itens_montagem (obra_peca_id) where aplicado;
create index diario_montagem_auditoria_diario_idx on public.diario_montagem_auditoria (diario_id, criado_em desc);

alter table public.diario_itens_montagem enable row level security;
alter table public.diario_montagem_operacoes enable row level security;
alter table public.diario_montagem_auditoria enable row level security;

revoke all on public.diario_itens_montagem, public.diario_montagem_operacoes, public.diario_montagem_auditoria from public, anon, authenticated;
grant select on public.diario_itens_montagem, public.diario_montagem_operacoes, public.diario_montagem_auditoria to authenticated;

create policy "Usuarios autorizados leem itens de montagem"
on public.diario_itens_montagem for select to authenticated
using (public.usuario_atual_autorizado());
create policy "Usuarios autorizados leem operacoes de montagem"
on public.diario_montagem_operacoes for select to authenticated
using (public.usuario_atual_autorizado());
create policy "Usuarios autorizados leem auditoria de montagem"
on public.diario_montagem_auditoria for select to authenticated
using (public.usuario_atual_autorizado());

create or replace function public.proteger_saldo_pecas()
returns trigger language plpgsql set search_path = public as $func$
begin
  if new.quantidade_montada is distinct from old.quantidade_montada
     and current_setting('app.montagem_rpc', true) is distinct from 'on' then
    raise exception 'O saldo de pecas somente pode ser alterado pela RPC de montagem.' using errcode = '42501';
  end if;
  return new;
end;
$func$;

drop trigger if exists proteger_saldo_pecas on public.obra_pecas;
create trigger proteger_saldo_pecas before update of quantidade_montada on public.obra_pecas
for each row execute function public.proteger_saldo_pecas();

create or replace function public.proteger_estado_montagem_diario()
returns trigger language plpgsql set search_path = public as $func$
begin
  if (new.montagem_status, new.volume_estruturado_m3, new.montagem_confirmada_em,
      new.montagem_confirmada_por, new.montagem_cancelada_em, new.montagem_cancelada_por,
      new.montagem_motivo_cancelamento)
     is distinct from
     (old.montagem_status, old.volume_estruturado_m3, old.montagem_confirmada_em,
      old.montagem_confirmada_por, old.montagem_cancelada_em, old.montagem_cancelada_por,
      old.montagem_motivo_cancelamento)
     and current_setting('app.montagem_rpc', true) is distinct from 'on' then
    raise exception 'O estado de montagem somente pode ser alterado pela RPC de montagem.' using errcode = '42501';
  end if;
  return new;
end;
$func$;

drop trigger if exists proteger_estado_montagem_diario on public.diarios;
create trigger proteger_estado_montagem_diario before update on public.diarios
for each row execute function public.proteger_estado_montagem_diario();

-- A catalog revision with effective mountings must stay available for audit.
create or replace function public.proteger_revisao_montada()
returns trigger language plpgsql set search_path = public as $func$
begin
  if old.ativo and not new.ativo and exists (
    select 1 from public.diario_itens_montagem i where i.obra_peca_id = old.id and i.aplicado
  ) then
    raise exception 'Nao e permitido substituir catalogo com pecas montadas.' using errcode = '55000';
  end if;
  return new;
end;
$func$;

drop trigger if exists proteger_revisao_montada on public.obra_pecas;
create trigger proteger_revisao_montada before update of ativo on public.obra_pecas
for each row execute function public.proteger_revisao_montada();

create or replace function public.aplicar_montagem_diario(
  p_diario_id uuid,
  p_itens jsonb,
  p_acao text,
  p_chave_idempotencia uuid,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $func$
declare
  v_diario public.diarios%rowtype;
  v_usuario uuid := auth.uid();
  v_hash text;
  v_existente public.diario_montagem_operacoes%rowtype;
  v_ids uuid[];
  v_validos integer;
  v_total numeric(18,4);
  v_resultado jsonb;
  v_operacao_id uuid;
begin
  if v_usuario is null or not public.usuario_atual_autorizado() then
    raise exception 'Usuario nao autorizado para registrar montagem.' using errcode = '42501';
  end if;
  if p_acao not in ('rascunho', 'confirmar', 'editar', 'cancelar') or p_chave_idempotencia is null then
    raise exception 'Operacao de montagem invalida.' using errcode = '22023';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) > 1000 then
    raise exception 'Itens de montagem invalidos.' using errcode = '22023';
  end if;

  select * into v_diario from public.diarios where id = p_diario_id for update;
  if not found or v_diario.obra_id is null then
    raise exception 'Diario sem obra vinculada nao aceita montagem estruturada.' using errcode = '22023';
  end if;
  if v_diario.montagem_status = 'legado' then
    raise exception 'Diario historico nao pode receber montagem estruturada.' using errcode = '55000';
  end if;

  v_hash := encode(extensions.digest(convert_to(jsonb_build_object('acao', p_acao, 'itens', p_itens, 'motivo', coalesce(p_motivo, ''))::text, 'UTF8'), 'sha256'), 'hex');
  select * into v_existente from public.diario_montagem_operacoes
  where diario_id = p_diario_id and chave_idempotencia = p_chave_idempotencia for update;
  if found then
    if v_existente.payload_hash <> v_hash then
      raise exception 'Chave de idempotencia reutilizada com outro payload.' using errcode = '22023';
    end if;
    return v_existente.resultado;
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_itens) as i(obra_peca_id uuid, quantidade integer)
    where obra_peca_id is null or quantidade is null or quantidade <= 0
  ) or exists (
    select 1 from jsonb_to_recordset(p_itens) as i(obra_peca_id uuid, quantidade integer)
    group by obra_peca_id having count(*) > 1
  ) then
    raise exception 'Cada peca deve ter quantidade inteira positiva e aparecer uma unica vez.' using errcode = '22023';
  end if;

  if p_acao = 'rascunho' and v_diario.montagem_status <> 'rascunho' then
    raise exception 'Apenas diarios em rascunho podem ter itens alterados sem confirmar.' using errcode = '55000';
  elsif p_acao = 'confirmar' and v_diario.montagem_status <> 'rascunho' then
    raise exception 'Apenas diarios em rascunho podem ser confirmados.' using errcode = '55000';
  elsif p_acao = 'editar' and v_diario.montagem_status <> 'confirmado' then
    raise exception 'Apenas diarios confirmados podem ser editados.' using errcode = '55000';
  elsif p_acao = 'cancelar' and v_diario.montagem_status <> 'confirmado' then
    raise exception 'Apenas diarios confirmados podem ser cancelados.' using errcode = '55000';
  end if;
  if p_acao = 'cancelar' and (p_motivo is null or length(trim(p_motivo)) = 0) then
    raise exception 'Informe o motivo do cancelamento.' using errcode = '22023';
  end if;

  select array_agg(id order by id) into v_ids from (
    select obra_peca_id as id from jsonb_to_recordset(p_itens) as i(obra_peca_id uuid, quantidade integer)
    union
    select obra_peca_id from public.diario_itens_montagem where diario_id = p_diario_id and aplicado
  ) ids;
  if coalesce(cardinality(v_ids), 0) > 0 then
    perform 1 from public.obra_pecas where id = any(v_ids) order by id for update;
    select count(*) into v_validos
    from public.obra_pecas p join public.catalogo_importacoes c on c.id = p.importacao_id
    where p.id = any(v_ids) and p.obra_id = v_diario.obra_id and p.ativo and c.status = 'aplicada';
    if v_validos <> cardinality(v_ids) then
      raise exception 'Peca inexistente, inativa ou pertencente a outra obra.' using errcode = '22023';
    end if;
  end if;

  if p_acao = 'rascunho' then
    delete from public.diario_itens_montagem where diario_id = p_diario_id;
    insert into public.diario_itens_montagem (
      diario_id, obra_id, obra_peca_id, importacao_id, localizacao_snapshot, tipo_snapshot, codigo_snapshot,
      quantidade, volume_unitario_m3_snapshot, volume_total_m3, aplicado, criado_por
    )
    select p_diario_id, p.obra_id, p.id, p.importacao_id, l.nome, p.tipo, p.codigo, i.quantidade,
      p.volume_unitario_m3, i.quantidade * p.volume_unitario_m3, false, v_usuario
    from jsonb_to_recordset(p_itens) as i(obra_peca_id uuid, quantidade integer)
    join public.obra_pecas p on p.id = i.obra_peca_id join public.obra_localizacoes l on l.id = p.localizacao_id;
    select coalesce(sum(volume_total_m3), 0) into v_total from public.diario_itens_montagem where diario_id = p_diario_id;
  else
    -- A single ordered lock set above makes both multi-piece edits and last-unit
    -- competition serialize before calculating the delta.
    if exists (
      with desejados as (select obra_peca_id, quantidade from jsonb_to_recordset(p_itens) as i(obra_peca_id uuid, quantidade integer)),
      atuais as (select obra_peca_id, quantidade from public.diario_itens_montagem where diario_id = p_diario_id and aplicado),
      diferencas as (
        select coalesce(d.obra_peca_id, a.obra_peca_id) as obra_peca_id, coalesce(d.quantidade, 0) - coalesce(a.quantidade, 0) as quantidade
        from desejados d full join atuais a using (obra_peca_id)
      )
      select 1 from diferencas d join public.obra_pecas p on p.id = d.obra_peca_id
      where p.quantidade_montada + d.quantidade < 0 or p.quantidade_montada + d.quantidade > p.quantidade_prevista
    ) then
      raise exception 'Quantidade solicitada excede o saldo disponivel.' using errcode = '23514';
    end if;

    perform set_config('app.montagem_rpc', 'on', true);
    with desejados as (select obra_peca_id, quantidade from jsonb_to_recordset(p_itens) as i(obra_peca_id uuid, quantidade integer)),
    atuais as (select obra_peca_id, quantidade from public.diario_itens_montagem where diario_id = p_diario_id and aplicado),
    diferencas as (
      select coalesce(d.obra_peca_id, a.obra_peca_id) as obra_peca_id, coalesce(d.quantidade, 0) - coalesce(a.quantidade, 0) as quantidade
      from desejados d full join atuais a using (obra_peca_id)
    )
    update public.obra_pecas p set quantidade_montada = p.quantidade_montada + d.quantidade, atualizado_em = now()
    from diferencas d where p.id = d.obra_peca_id and d.quantidade <> 0;

    if p_acao = 'cancelar' then
      update public.diario_itens_montagem set aplicado = false, atualizado_em = now() where diario_id = p_diario_id and aplicado;
      update public.diarios set montagem_status = 'cancelado', volume_estruturado_m3 = 0,
        montagem_cancelada_em = now(), montagem_cancelada_por = v_usuario, montagem_motivo_cancelamento = trim(p_motivo)
      where id = p_diario_id;
      v_total := 0;
    else
      delete from public.diario_itens_montagem where diario_id = p_diario_id;
      insert into public.diario_itens_montagem (
        diario_id, obra_id, obra_peca_id, importacao_id, localizacao_snapshot, tipo_snapshot, codigo_snapshot,
        quantidade, volume_unitario_m3_snapshot, volume_total_m3, aplicado, criado_por
      )
      select p_diario_id, p.obra_id, p.id, p.importacao_id, l.nome, p.tipo, p.codigo, i.quantidade,
        p.volume_unitario_m3, i.quantidade * p.volume_unitario_m3, true, v_usuario
      from jsonb_to_recordset(p_itens) as i(obra_peca_id uuid, quantidade integer)
      join public.obra_pecas p on p.id = i.obra_peca_id join public.obra_localizacoes l on l.id = p.localizacao_id;
      select coalesce(sum(volume_total_m3), 0) into v_total from public.diario_itens_montagem where diario_id = p_diario_id;
      update public.diarios set montagem_status = 'confirmado', volume_estruturado_m3 = v_total,
        montagem_confirmada_em = coalesce(montagem_confirmada_em, now()), montagem_confirmada_por = coalesce(montagem_confirmada_por, v_usuario),
        montagem_cancelada_em = null, montagem_cancelada_por = null, montagem_motivo_cancelamento = null
      where id = p_diario_id;
    end if;
  end if;

  perform set_config('app.montagem_rpc', 'off', true);

  select jsonb_build_object('diario_id', p_diario_id, 'acao', p_acao, 'status', montagem_status,
    'volume_estruturado_m3', volume_estruturado_m3,
    'itens', coalesce((select jsonb_agg(jsonb_build_object('obra_peca_id', obra_peca_id, 'codigo', codigo_snapshot, 'localizacao', localizacao_snapshot, 'quantidade', quantidade, 'volume_m3', volume_total_m3) order by codigo_snapshot)
      from public.diario_itens_montagem where diario_id = p_diario_id), '[]'::jsonb))
  into v_resultado from public.diarios where id = p_diario_id;

  insert into public.diario_montagem_operacoes (diario_id, chave_idempotencia, acao, payload_hash, resultado, criado_por)
  values (p_diario_id, p_chave_idempotencia, p_acao, v_hash, v_resultado, v_usuario) returning id into v_operacao_id;
  insert into public.diario_montagem_auditoria (diario_id, operacao_id, acao, motivo, itens, volume_estruturado_m3, responsavel_id)
  values (p_diario_id, v_operacao_id, p_acao, nullif(trim(p_motivo), ''), v_resultado->'itens', coalesce(v_total, 0), v_usuario);
  return v_resultado;
end;
$func$;

revoke all on function public.aplicar_montagem_diario(uuid, jsonb, text, uuid, text) from public, anon;
grant execute on function public.aplicar_montagem_diario(uuid, jsonb, text, uuid, text) to authenticated;

commit;
