-- Read-only production preflight. Review and archive this output immediately
-- before applying 20260308000100_link_diarios_to_obras.sql.
with candidatos as (
  select d.id as diario_id, d.obra, d.cidade, o.id as obra_id
  from public.diarios d
  left join public.obras o
    on lower(trim(o.nome_obra)) = lower(trim(d.obra))
   and lower(trim(o.cidade)) = lower(trim(d.cidade))
  where d.obra_id is null
), mapeamento as (
  select
    diario_id,
    max(obra) as obra_legado,
    max(cidade) as cidade_legado,
    count(obra_id)::integer as quantidade_candidatos,
    min(obra_id::text)::uuid as obra_id_atribuido
  from candidatos
  group by diario_id
)
select
  diario_id,
  obra_legado,
  cidade_legado,
  quantidade_candidatos,
  obra_id_atribuido,
  case
    when quantidade_candidatos = 1 then 'pronto_para_migrar'
    when quantidade_candidatos = 0 then 'sem_correspondencia'
    else 'correspondencia_ambigua'
  end as situacao
from mapeamento
order by obra_legado, cidade_legado, diario_id;

with candidatos as (
  select d.id as diario_id, o.id as obra_id
  from public.diarios d
  left join public.obras o
    on lower(trim(o.nome_obra)) = lower(trim(d.obra))
   and lower(trim(o.cidade)) = lower(trim(d.cidade))
  where d.obra_id is null
), mapeamento as (
  select diario_id, count(obra_id)::integer as quantidade_candidatos
  from candidatos
  group by diario_id
)
select
  count(*) as diarios_sem_obra_id,
  count(*) filter (where quantidade_candidatos = 1) as correspondencias_unicas,
  count(*) filter (where quantidade_candidatos = 0) as sem_correspondencia,
  count(*) filter (where quantidade_candidatos > 1) as ambiguas
from mapeamento;
