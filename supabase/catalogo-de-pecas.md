# Fundação proposta para o catálogo de peças

`proposed-migrations/202603080101_catalogo_pecas.sql` permanece fora da pasta
de migrations aplicáveis nesta etapa. Ele propõe:

- `obra_localizacoes`: pavimentos/localizações únicos dentro da obra.
- `obra_pecas`: chave única por obra, localização, tipo e código; o código
  sozinho nunca identifica uma peça.
- `importacoes_pecas`: versões e hash para separar catálogo de histórico.
- `diario_itens_montagem`: itens com snapshots que preservam PDF e histórico.

O saldo não será atualizado pelo frontend. A próxima etapa deve criar uma RPC
transacional que bloqueie as peças envolvidas, valide o saldo, grave os itens e
atualize `quantidade_montada` em uma única transação. Rascunhos não chamam a
RPC; confirmação, edição e cancelamento a chamam com semântica idempotente.
