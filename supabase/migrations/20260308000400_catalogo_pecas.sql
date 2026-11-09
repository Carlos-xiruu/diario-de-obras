-- Depends on 20260308000200_create_authorization_registry.sql and its
-- authorization functions. Do not apply before the Etapa 2A security rollout.
begin;

create extension if not exists pgcrypto;

create table public.catalogo_importacoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  revisao integer not null check (revisao > 0),
  nome_arquivo text not null,
  hash_arquivo text not null check (hash_arquivo ~ '^[0-9a-f]{64}$'),
  tamanho_bytes bigint not null check (tamanho_bytes > 0 and tamanho_bytes <= 10485760),
  status text not null check (status in ('aplicada', 'substituida')),
  resumo jsonb not null,
  criado_por uuid not null references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  unique (obra_id, revisao),
  unique (obra_id, hash_arquivo)
);

create table public.obra_localizacoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  nome text not null,
  nome_normalizado text generated always as (lower(trim(nome))) stored,
  criado_em timestamptz not null default now(),
  unique (obra_id, nome_normalizado)
);

create table public.obra_pecas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  localizacao_id uuid not null references public.obra_localizacoes(id) on delete restrict,
  importacao_id uuid not null references public.catalogo_importacoes(id) on delete restrict,
  tipo text not null,
  tipo_normalizado text generated always as (lower(trim(tipo))) stored,
  codigo text not null,
  codigo_normalizado text generated always as (lower(trim(codigo))) stored,
  quantidade_prevista integer not null check (quantidade_prevista >= 0),
  quantidade_montada integer not null default 0 check (quantidade_montada >= 0 and quantidade_montada <= quantidade_prevista),
  quantidade_pendente integer generated always as (quantidade_prevista - quantidade_montada) stored,
  volume_unitario_m3 numeric(16,4) not null check (volume_unitario_m3 >= 0),
  volume_total_previsto_m3 numeric(18,4) generated always as (quantidade_prevista * volume_unitario_m3) stored,
  ativo boolean not null default true,
  desativado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (importacao_id, localizacao_id, tipo_normalizado, codigo_normalizado),
  check ((ativo and desativado_em is null) or (not ativo and desativado_em is not null))
);

create index catalogo_importacoes_obra_id_idx on public.catalogo_importacoes (obra_id, revisao desc);
create index obra_pecas_obra_ativa_idx on public.obra_pecas (obra_id, ativo);
create index obra_pecas_filtro_idx on public.obra_pecas (obra_id, localizacao_id, tipo_normalizado, codigo_normalizado) where ativo;

alter table public.catalogo_importacoes enable row level security;
alter table public.obra_localizacoes enable row level security;
alter table public.obra_pecas enable row level security;

revoke all on public.catalogo_importacoes, public.obra_localizacoes, public.obra_pecas from public, anon, authenticated;
grant select on public.catalogo_importacoes, public.obra_localizacoes, public.obra_pecas to authenticated;
grant insert, update, delete on public.catalogo_importacoes, public.obra_localizacoes, public.obra_pecas to authenticated;

create policy "Usuarios autorizados leem importacoes de catalogo"
on public.catalogo_importacoes for select to authenticated
using (public.usuario_atual_autorizado());
create policy "Administradores gerenciam importacoes de catalogo"
on public.catalogo_importacoes for all to authenticated
using (public.usuario_atual_eh_administrador()) with check (public.usuario_atual_eh_administrador());

create policy "Usuarios autorizados leem localizacoes"
on public.obra_localizacoes for select to authenticated
using (public.usuario_atual_autorizado());
create policy "Administradores gerenciam localizacoes"
on public.obra_localizacoes for all to authenticated
using (public.usuario_atual_eh_administrador()) with check (public.usuario_atual_eh_administrador());

create policy "Usuarios autorizados leem pecas"
on public.obra_pecas for select to authenticated
using (public.usuario_atual_autorizado());
create policy "Administradores gerenciam pecas"
on public.obra_pecas for all to authenticated
using (public.usuario_atual_eh_administrador()) with check (public.usuario_atual_eh_administrador());

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
  if p_hash_arquivo !~ '^[0-9a-f]{64}$' or p_tamanho_bytes <= 0 or p_tamanho_bytes > 10485760 then
    raise exception 'Metadados do arquivo invalidos.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 or jsonb_array_length(p_itens) > 5000 then
    raise exception 'Catalogo vazio ou acima do limite permitido.' using errcode = '22023';
  end if;

  perform 1 from public.obras where id = p_obra_id for update;
  if not found then raise exception 'Obra nao encontrada.' using errcode = 'P0002'; end if;

  create temporary table itens_importacao on commit drop as
  select
    trim(localizacao) as localizacao,
    trim(tipo) as tipo,
    upper(trim(codigo)) as codigo,
    quantidade_prevista,
    volume_unitario_m3
  from jsonb_to_recordset(p_itens) as item(
    localizacao text,
    tipo text,
    codigo text,
    quantidade_prevista integer,
    volume_unitario_m3 numeric
  );

  if exists (
    select 1 from itens_importacao
    where localizacao = '' or tipo = '' or codigo = ''
      or quantidade_prevista is null or quantidade_prevista < 0
      or volume_unitario_m3 is null or volume_unitario_m3 < 0
  ) then
    raise exception 'Catalogo contem item invalido.' using errcode = '22023';
  end if;
  if exists (
    select 1 from itens_importacao
    group by lower(localizacao), lower(tipo), lower(codigo)
    having count(*) > 1
  ) then
    raise exception 'Catalogo contem pecas duplicadas na mesma localizacao.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.catalogo_importacoes
    where obra_id = p_obra_id and hash_arquivo = p_hash_arquivo
  ) then
    raise exception 'Este arquivo ja foi importado para esta obra.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.obra_pecas
    where obra_id = p_obra_id and ativo and quantidade_montada > 0
  ) then
    raise exception 'A revisao possui montagens e exige conciliacao especifica.' using errcode = '55000';
  end if;

  select coalesce(max(revisao), 0) + 1 into v_revisao
  from public.catalogo_importacoes where obra_id = p_obra_id;
  select count(*), coalesce(sum(quantidade_prevista), 0), coalesce(sum(quantidade_prevista * volume_unitario_m3), 0)
  into v_total_pecas, v_total_quantidade, v_total_volume
  from itens_importacao;

  update public.obra_pecas
  set ativo = false, desativado_em = now(), atualizado_em = now()
  where obra_id = p_obra_id and ativo;
  update public.catalogo_importacoes set status = 'substituida'
  where obra_id = p_obra_id and status = 'aplicada';

  insert into public.catalogo_importacoes (
    obra_id, revisao, nome_arquivo, hash_arquivo, tamanho_bytes, status, resumo, criado_por
  ) values (
    p_obra_id, v_revisao, trim(p_nome_arquivo), p_hash_arquivo, p_tamanho_bytes, 'aplicada',
    jsonb_build_object('grupos', v_total_pecas, 'quantidade_prevista', v_total_quantidade, 'volume_previsto_m3', v_total_volume),
    auth.uid()
  ) returning id into v_importacao_id;

  insert into public.obra_localizacoes (obra_id, nome)
  select p_obra_id, localizacao from itens_importacao
  group by localizacao
  on conflict (obra_id, nome_normalizado) do nothing;

  insert into public.obra_pecas (
    obra_id, localizacao_id, importacao_id, tipo, codigo, quantidade_prevista, volume_unitario_m3
  )
  select p_obra_id, l.id, v_importacao_id, i.tipo, i.codigo, i.quantidade_prevista, i.volume_unitario_m3
  from itens_importacao i
  join public.obra_localizacoes l
    on l.obra_id = p_obra_id and l.nome_normalizado = lower(i.localizacao);

  return jsonb_build_object(
    'importacao_id', v_importacao_id,
    'revisao', v_revisao,
    'grupos', v_total_pecas,
    'quantidade_prevista', v_total_quantidade,
    'volume_previsto_m3', v_total_volume
  );
end;
$func$;

revoke all on function public.confirmar_importacao_catalogo(uuid, text, text, bigint, jsonb) from public;
grant execute on function public.confirmar_importacao_catalogo(uuid, text, text, bigint, jsonb) to authenticated;

commit;
