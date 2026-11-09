-- Local/staging only. Run after the linkage migration against a restored copy
-- of production data. It performs no write.
do $$
declare
  total_diarios integer;
  diarios_vinculados integer;
  pendencias integer;
  auditorias integer;
  dados_alterados integer;
begin
  select count(*), count(*) filter (where obra_id is not null)
    into total_diarios, diarios_vinculados
  from public.diarios;
  select count(*) into pendencias
  from public.diario_obra_conciliacao_pendente
  where resolvido_em is null;
  select count(*) into auditorias
  from public.diario_obra_migracao_auditoria;
  select count(*) into dados_alterados
  from public.test_diarios_antes antes
  join public.diarios depois on depois.id = antes.id
  where row(
    depois.data_registro, depois.equipe, depois.clima, depois.munk_hrs,
    depois.guindaste_hrs, depois.horas_trabalhadas, depois.m3_montado,
    depois.qtd_bisnagas_pu, depois.eixos_montados, depois.encunhamento_pilares,
    depois.observacoes, depois.informacoes_adicionais, depois.obra, depois.cidade
  ) is distinct from row(
    antes.data_registro, antes.equipe, antes.clima, antes.munk_hrs,
    antes.guindaste_hrs, antes.horas_trabalhadas, antes.m3_montado,
    antes.qtd_bisnagas_pu, antes.eixos_montados, antes.encunhamento_pilares,
    antes.observacoes, antes.informacoes_adicionais, antes.obra, antes.cidade
  );

  if total_diarios <> 74 then
    raise exception 'Quantidade de diarios mudou: %', total_diarios;
  end if;
  if diarios_vinculados <> 73 then
    raise exception 'Quantidade de diarios vinculados inesperada: %', diarios_vinculados;
  end if;
  if pendencias <> 1 then
    raise exception 'Quantidade de pendencias inesperada: %', pendencias;
  end if;
  if auditorias <> diarios_vinculados then
    raise exception 'Auditoria nao cobre todos os vinculos: % de %', auditorias, diarios_vinculados;
  end if;
  if dados_alterados <> 0 then
    raise exception 'A migracao alterou campos historicos em % diarios', dados_alterados;
  end if;
  if not exists (
    select 1 from public.diario_obra_conciliacao_pendente
    where obra_legado = 'Cacau Park'
      and cidade_legado = 'Itu - SP'
      and motivo = 'sem_correspondencia'
      and resolvido_em is null
  ) then
    raise exception 'Pendencia Cacau Park, Itu - SP nao foi preservada';
  end if;
end $$;
