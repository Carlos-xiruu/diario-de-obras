# Homologação local e staging

## Baseline

O banco de produção antecede as migrations deste repositório. Por isso,
`local-baseline.sql` não fica em `migrations/`: ela recria apenas o schema
confirmado, dados sintéticos e políticas legadas para testes locais. Nunca a
execute em produção.

## Requisitos

- Docker Desktop iniciado e com acesso ao daemon.
- Supabase CLI `3.0.0` ou compatível: `npx --yes supabase@latest`.
- `psql` é necessário apenas para o teste parametrizado de staging.

## Fluxo local reproduzível

As migrations `20260308000400` e `20260308000500` dependem das funções de
autorização da `20260308000200`, mas não do hardening manual `20260308000300`.
Ainda assim, aplique o hardening depois de cadastrar o primeiro administrador e
antes de qualquer operação autenticada do catálogo.

```powershell
# Temporariamente: [db.migrations].enabled = false em supabase/config.toml.
npx --yes supabase@latest start
# Restaure [db.migrations].enabled = true antes do proximo comando.
npx --yes supabase@latest db query --file supabase/local-baseline.sql
npx --yes supabase@latest migration up
npx --yes supabase@latest db query --file supabase/tests/link-diarios.sql
npx --yes supabase@latest db query "insert into public.acessos_usuario (user_id, papel) values ('10000000-0000-0000-0000-000000000001', 'administrador'), ('10000000-0000-0000-0000-000000000002', 'colaborador')"
npx --yes supabase@latest db query --file supabase/production/20260308000300_enforce_authorization_and_protect_obras.sql
npx --yes supabase@latest db query --file supabase/tests/rls-local.sql
```

For staging, use `supabase/tests/rls.sql` with three real staging identities.
Run the link migration one more time before `link-diarios.sql` to validate
idempotency. Run `rollback/20260308000100_link_diarios_to_obras.revert.sql`
and `tests/link-diarios-rollback.sql` only in a fresh local run, then repeat
the link migration and validation.

For staging, restore a production backup into an isolated project and replace
the synthetic baseline step with the restore. Do not run `supabase db reset` on
that restored database because its legacy schema is not represented by an
automatic baseline migration.

`auth.enable_signup = false` em `config.toml` vale apenas para a stack local.
O cadastro no Supabase Auth de produção deve ser desabilitado separadamente,
depois do inventário de usuários e da ativação de ao menos um administrador.
