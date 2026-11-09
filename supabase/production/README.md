# Ordem de aplicacao em producao

Nenhum arquivo desta pasta deve ser executado sem autorizacao explicita e sem
backup validado.

1. Fazer backup logico e registrar as contagens de `obras` e `diarios`.
2. Executar `preview-link-diarios-to-obras.sql` em staging restaurado e em
   producao imediatamente antes da migration. Conferir 73 candidatos unicos e
   uma pendencia; arquivar a saida.
3. Aplicar `20260308000100_link_diarios_to_obras.sql` em producao em janela curta;
   a migration bloqueia escrita concorrente apenas durante o mapeamento.
4. Conferir os relatorios emitidos e o unico registro em
   `diario_obra_conciliacao_pendente`. Corrigir esse vinculo somente por decisao
   humana documentada.
5. Aplicar `20260308000200_create_authorization_registry.sql`.
6. Usar `authorize-existing-user.sql` para identificar e registrar um usuario
   Auth existente como administrador. Conferir a listagem antes de continuar.
7. Executar `20260308000300_enforce_authorization_and_protect_obras.sql`. Ela
   aborta se nao houver administrador ativo, remove politicas permissivas,
   bloqueia anonimos e troca o FK de cascade para restrict.
8. Executar `supabase/tests/rls.sql` somente contra staging/local usando tres
   usuarios de teste, seguido de testes manuais da aplicacao autenticada.

O hardening de seguranca e um script manual versionado em `production/`, nao
uma migration automatica, pois sua pre-condicao e a escolha humana de um UUID
Auth existente para o primeiro administrador. Nao o marque como aplicado sem
registrar no runbook quem executou, quando e qual administrador foi validado.

Reversao de vinculo: use `rollback/20260308000100_link_diarios_to_obras.revert.sql`. Ela
so reverte uma associacao se o `obra_id` ainda for o valor registrado na
auditoria; nao apaga alteracoes manuais posteriores. Nao reverta a seguranca
removendo RLS ou recriando politicas `true`; corrija acessos em
`acessos_usuario` e investigue a causa.
