-- Safe reversal for the linkage migration. It only reverts rows that still
-- have exactly the value attributed by the audited migration.
do $rollback$
begin
  update public.diarios d
  set obra_id = a.obra_id_anterior
  from public.diario_obra_migracao_auditoria a
  where d.id = a.diario_id
    and d.obra_id = a.obra_id_atribuido;
end $rollback$;
