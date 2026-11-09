-- Run immediately after the controlled rollback against the local fixture.
do $$
declare
  total_diarios integer;
  sem_vinculo integer;
begin
  select count(*), count(*) filter (where obra_id is null)
  into total_diarios, sem_vinculo
  from public.diarios;

  if total_diarios <> 74 or sem_vinculo <> 74 then
    raise exception 'Rollback nao restaurou os 74 diarios legados: total %, sem vinculo %', total_diarios, sem_vinculo;
  end if;
  if not exists (
    select 1 from public.diario_obra_conciliacao_pendente
    where obra_legado = 'Cacau Park' and cidade_legado = 'Itu - SP' and resolvido_em is null
  ) then
    raise exception 'Rollback removeu a pendencia manual Cacau Park';
  end if;
end $$;
