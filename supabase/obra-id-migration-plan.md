# Migração não destrutiva de `obra_id`

Este plano foi substituído pelas migrations versionadas em `migrations/`, após
a confirmação do schema de produção. Ele permanece como referência da regra de
conciliação não destrutiva.

1. Fazer backup lógico e registrar a contagem de `obras` e `diarios`.
2. Usar o `diarios.obra_id` anulável já existente; não remover `obra` nem
   `cidade` legados.
3. Produzir uma consulta de candidatos que compare nome e cidade normalizados.
   Só atualizar registros com correspondência única.
4. Exportar os registros sem correspondência ou com mais de uma obra candidata
   para revisão manual. Eles continuam acessíveis pelo conteúdo legado.
5. Adicionar a foreign key apenas depois da conferência dos vínculos gravados.
6. Mudar os novos fluxos para selecionar e enviar somente `obra_id`, mantendo
   nome e cidade como snapshot no diário para compatibilidade histórica.
7. Medir os registros ainda nulos antes de decidir por `NOT NULL`; essa decisão
   não pertence à primeira migração.

O dashboard, histórico, visualização, edição e exclusão devem passar a usar
`obra_id` para relações. Campos de texto históricos não podem ser usados para
associação automática quando o candidato não for único.
