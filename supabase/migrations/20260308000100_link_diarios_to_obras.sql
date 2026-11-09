-- Links only legacy diaries with exactly one normalized name/city match.
-- Run only after a production backup and review the result sets emitted below.
begin;

lock table public.diarios in share row exclusive mode;
lock table public.obras in share mode;

create table if not exists public.diario_obra_migracao_auditoria (
  diario_id uuid primary key references public.diarios(id) on delete restrict,
  obra_id_anterior uuid,
  obra_id_atribuido uuid not null references public.obras(id) on delete restrict,
  obra_legado text,
  cidade_legado text,
  migrado_em timestamptz not null default now()
);

create table if not exists public.diario_obra_conciliacao_pendente (
  diario_id uuid primary key references public.diarios(id) on delete restrict,
  obra_legado text,
  cidade_legado text,
  motivo text not null check (motivo in ('sem_correspondencia', 'correspondencia_ambigua')),
  detectado_em timestamptz not null default now(),
  resolvido_em timestamptz,
  resolvido_por uuid references auth.users(id) on delete set null,
  observacao_resolucao text
);

create index if not exists diarios_obra_id_idx on public.diarios (obra_id);

create temporary table diario_obra_mapeamento on commit drop as
with candidatos as (
  select
    d.id as diario_id,
    d.obra as obra_legado,
    d.cidade as cidade_legado,
    o.id as obra_id
  from public.diarios d
  left join public.obras o
    on lower(trim(o.nome_obra)) = lower(trim(d.obra))
   and lower(trim(o.cidade)) = lower(trim(d.cidade))
  where d.obra_id is null
)
select
  diario_id,
  max(obra_legado) as obra_legado,
  max(cidade_legado) as cidade_legado,
  count(obra_id)::integer as quantidade_candidatos,
  min(obra_id::text)::uuid as obra_id_atribuido
from candidatos
group by diario_id;

-- The production audit found exactly 74 unlinked diaries: 73 unique matches
-- and one unmatched diary. Abort the first execution if data changed instead
-- of silently linking a different population. A rerun is allowed only after
-- this migration has already written its audit trail.
do $$
declare
  total_mapeado integer;
  unicos integer;
  sem_correspondencia integer;
  ambiguos integer;
  auditoria_existente integer;
begin
  select
    count(*),
    count(*) filter (where quantidade_candidatos = 1),
    count(*) filter (where quantidade_candidatos = 0),
    count(*) filter (where quantidade_candidatos > 1)
  into total_mapeado, unicos, sem_correspondencia, ambiguos
  from diario_obra_mapeamento;

  select count(*) into auditoria_existente
  from public.diario_obra_migracao_auditoria;

  if auditoria_existente = 0
    and (total_mapeado <> 74 or unicos <> 73 or sem_correspondencia <> 1 or ambiguos <> 0) then
    raise exception
      'Previa de obra_id mudou: total %, unicos %, sem correspondencia %, ambiguos %',
      total_mapeado, unicos, sem_correspondencia, ambiguos;
  end if;
end $$;

-- Previa obrigatoria: deve mostrar 73 linhas com um candidato e uma pendencia.
select
  m.diario_id,
  m.obra_legado,
  m.cidade_legado,
  m.quantidade_candidatos,
  m.obra_id_atribuido,
  case
    when m.quantidade_candidatos = 1 then 'pronto_para_migrar'
    when m.quantidade_candidatos = 0 then 'sem_correspondencia'
    else 'correspondencia_ambigua'
  end as situacao
from diario_obra_mapeamento m
order by m.obra_legado, m.cidade_legado, m.diario_id;

insert into public.diario_obra_conciliacao_pendente (
  diario_id, obra_legado, cidade_legado, motivo
)
select
  diario_id,
  obra_legado,
  cidade_legado,
  case
    when quantidade_candidatos = 0 then 'sem_correspondencia'
    else 'correspondencia_ambigua'
  end
from diario_obra_mapeamento
where quantidade_candidatos <> 1
on conflict (diario_id) do update
set
  obra_legado = excluded.obra_legado,
  cidade_legado = excluded.cidade_legado,
  motivo = excluded.motivo,
  detectado_em = now()
where public.diario_obra_conciliacao_pendente.resolvido_em is null;

insert into public.diario_obra_migracao_auditoria (
  diario_id, obra_id_anterior, obra_id_atribuido, obra_legado, cidade_legado
)
select
  m.diario_id,
  d.obra_id,
  m.obra_id_atribuido,
  m.obra_legado,
  m.cidade_legado
from diario_obra_mapeamento m
join public.diarios d on d.id = m.diario_id
where m.quantidade_candidatos = 1
  and d.obra_id is null
on conflict (diario_id) do nothing;

update public.diarios d
set obra_id = m.obra_id_atribuido
from diario_obra_mapeamento m
where d.id = m.diario_id
  and d.obra_id is null
  and m.quantidade_candidatos = 1;

-- Conferencia posterior: nenhum vinculo existente e preservado pelo update.
select
  count(*) filter (where obra_id is not null) as diarios_com_obra_id,
  count(*) filter (where obra_id is null) as diarios_sem_obra_id
from public.diarios;

select diario_id, obra_legado, cidade_legado, motivo
from public.diario_obra_conciliacao_pendente
where resolvido_em is null
order by detectado_em, diario_id;

commit;
