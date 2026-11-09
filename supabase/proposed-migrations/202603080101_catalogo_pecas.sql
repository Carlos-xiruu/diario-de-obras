-- PROPOSED ONLY: do not apply in production during Etapa 2A.
-- The debit of quantities will be introduced later through a transactional RPC.
begin;

create table public.obra_localizacoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  nome text not null,
  nome_normalizado text generated always as (lower(trim(nome))) stored,
  criado_em timestamptz not null default now(),
  unique (obra_id, nome_normalizado)
);

create table public.importacoes_pecas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  tipo text not null check (tipo in ('catalogo', 'historico_montagem')),
  nome_arquivo text not null,
  hash_arquivo text not null,
  status text not null check (status in ('pendente', 'validada', 'aplicada', 'rejeitada')),
  resumo jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique (obra_id, tipo, hash_arquivo)
);

create table public.obra_pecas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  localizacao_id uuid not null references public.obra_localizacoes(id) on delete restrict,
  importacao_id uuid references public.importacoes_pecas(id) on delete restrict,
  tipo text not null,
  tipo_normalizado text generated always as (lower(trim(tipo))) stored,
  codigo text not null,
  codigo_normalizado text generated always as (lower(trim(codigo))) stored,
  quantidade_prevista integer not null check (quantidade_prevista >= 0),
  quantidade_montada integer not null default 0 check (quantidade_montada >= 0 and quantidade_montada <= quantidade_prevista),
  volume_unitario_m3 numeric(14, 4) not null check (volume_unitario_m3 >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (obra_id, localizacao_id, tipo_normalizado, codigo_normalizado)
);

create table public.diario_itens_montagem (
  id uuid primary key default gen_random_uuid(),
  diario_id uuid not null references public.diarios(id) on delete restrict,
  obra_peca_id uuid not null references public.obra_pecas(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  codigo_snapshot text not null,
  tipo_snapshot text not null,
  localizacao_snapshot text not null,
  volume_unitario_m3_snapshot numeric(14, 4) not null check (volume_unitario_m3_snapshot >= 0),
  volume_montado_m3 numeric(14, 4) not null check (volume_montado_m3 >= 0),
  criado_em timestamptz not null default now(),
  unique (diario_id, obra_peca_id)
);

create index obra_pecas_obra_id_idx on public.obra_pecas (obra_id);
create index diario_itens_montagem_diario_id_idx on public.diario_itens_montagem (diario_id);

commit;
