# Testes SQL locais

Estes testes exigem uma instância local do Supabase com as migrations aplicadas
e três usuários reais de `auth.users`: administrador, colaborador e usuário sem
acesso. Eles usam transações e `rollback`; nunca devem ser apontados ao banco de
produção. `local-baseline.sql` cria somente o schema confirmado e 74 registros
sintéticos (73 correspondências e a pendência Cacau Park) para o ambiente local.

Use `rls-local.sql` para o fixture local e `rls.sql` com `psql` para staging
restaurado. A Supabase CLI foi inicializada neste repositório; consulte
`HOMOLOGACAO.md` para a ordem completa.
