-- Run against a fresh baseline before the link migration. It verifies that a
-- population different from the audited 74/73/1/0 tuple is detected and then
-- removes its synthetic extra diary.
do $$
declare
  total_mapeado integer;
  unicos integer;
  sem_correspondencia integer;
  ambiguos integer;
begin
  insert into public.diarios (obra, cidade, data_registro, observacoes)
  values ('Obra inserida durante a pre-migracao', 'Cidade inexistente', current_date, 'Teste de guarda');

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
    count(*),
    count(*) filter (where quantidade_candidatos = 1),
    count(*) filter (where quantidade_candidatos = 0),
    count(*) filter (where quantidade_candidatos > 1)
  into total_mapeado, unicos, sem_correspondencia, ambiguos
  from mapeamento;

  delete from public.diarios where observacoes = 'Teste de guarda';

  if total_mapeado = 74 and unicos = 73 and sem_correspondencia = 1 and ambiguos = 0 then
    raise exception 'A guarda de pre-migracao nao detectou alteracao de contagem';
  end if;
end $$;
