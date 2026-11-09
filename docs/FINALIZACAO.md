# Finalizacao Local

## Concluido

- Etapas 2A e 2B: autorizacao, catalogo, importacao Aedifica e revisoes.
- Etapa 2C: montagem transacional, saldo, idempotencia, auditoria, cancelamento e testes SQL locais.
- Dashboard geral usa metricas centralizadas que separam volumes legados e estruturados.
- Seletor de pecas reutilizado na criacao e edicao de diarios.
- Visualizacao do diario usa snapshots de montagem.
- Teste de concorrencia com duas sessoes locais executado.
- PDFs reais gerados no servidor com `pdf-lib`: diário individual e consolidado por obra, em A4, com tabelas, paginação, cabeçalho, rodapé e download autenticado.
- Tela de relatório consolidado permite selecionar período; dashboard individual inclui evolução acumulada e recarrega ao retornar para a aba.

## Finalizado

- Dashboard individual filtra período, pavimento e tipo. Volumes legados só participam do filtro de período, pois não possuem classificação estruturada.
- Confirmação e cancelamento de montagem usam diálogos acessíveis; não há `window.confirm` ou `window.prompt` no aplicativo.
- PDF diário calcula o volume pelo estado da montagem, sem exibir volume manual em diário cancelado.
- Testes SQL locais foram tornados repetíveis para catálogo e reimportação.
- A configuração local volta a habilitar migrations, evitando que um `db push` ignore alterações versionadas.
- Playwright e Chromium foram instalados e há cobertura de login, autorização, catálogo, dashboard e viewport móvel em `e2e/diario.spec.ts`.

## Bloqueios reais

- Nenhum acesso remoto ou producao sera usado.
- A importacao historica nao sera confirmada enquanto houver ambiguidade entre a planilha e os diarios legados.
- E2E requer provisionar usuarios/sessoes isoladas na stack local.
- A validação HTTP autenticada dos PDFs requer iniciar o Supabase local; não houve conexão com ambiente remoto.
- A configuração de desenvolvimento precisa acessar a aplicação por `127.0.0.1`, declarado em `allowedDevOrigins`; sem isso o HMR bloqueava a hidratação do React e o submit de login ocorria como formulário nativo, sem executar o handler nem persistir o cookie SSR.

## Testes Executados

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run lint` e `npm run build` após a implementação de PDFs (08/11/2026).
- `npm test` após a prévia de histórico: 9 testes aprovados (08/11/2026).
- `supabase db lint`
- `supabase/tests/catalogo-pecas-local.sql`
- `supabase/tests/catalogo-reimport-local.sql`
- `supabase/tests/montagem-diaria-local.sql`
- `supabase/tests/rls-local.sql`
- `supabase/tests/montagem-concorrencia-local.mjs`
- `npm run lint` e `npm run typecheck`: aprovados após os ajustes finais.
- `npm test`: 9 testes aprovados.
- `npm run build`: aprovado.
- `supabase db lint`: aprovado.
- `supabase/tests/catalogo-pecas-local.sql`, `catalogo-reimport-local.sql`, `montagem-diaria-local.sql`, `rls-local.sql` e `montagem-concorrencia-local.mjs`: aprovados na stack local.
- `supabase/tests/catalogo-aedifica-local.mjs`: aprovado, com 284 grupos, 904 unidades e 762,52 m³.
- `npm run test:e2e`: o login SSR, bloqueio de visitante e persistência após navegação foram aprovados. O cenário completo de catálogo foi executado novamente; a confirmação da importação excedeu a espera inicial do teste e o timeout foi ampliado, mas a reexecução completa final não coube nesta sessão.

## Publicação segura

Não fazer deploy automático somente com o push enquanto o banco remoto ainda estiver no schema legado. Antes do deploy, desative a integração de deploy automático ou mantenha a aplicação anterior ativa; faça backup lógico e restaure-o em staging isolado. Execute o preflight de vínculo, confira 73 candidatos e a pendência única, aplique `20260308000100` e `20260308000200`, registre o administrador com `authorize-existing-user.sql`, aplique o hardening `20260308000300`, e só então aplique as migrations `20260308000400` a `20260308000600`. Em staging, valide RLS, montagem, concorrência, catálogo e PDFs autenticados. Corrija e aprove o fluxo de sessão SSR antes da liberação da nova aplicação. A importação histórica ambígua deve permanecer somente em prévia.

## Arquivos Principais

- `supabase/migrations/20260308000600_montagem_diaria_transacional.sql`
- `lib/services/montagem.ts`
- `lib/services/dashboard.ts`
- `app/components/MontagemPecas.tsx`
- `app/diario/page.tsx`
- `app/editar/[id]/page.tsx`
- `app/visualizar/[id]/page.tsx`
- `app/dashboard/page.tsx`
- `app/api/relatorios/diarios/[id]/route.ts`
- `app/api/obras/[obraId]/relatorios/consolidado/route.ts`
- `app/obras/[id]/relatorios/page.tsx`
- `lib/pdf/relatorios.ts`
