// Local-only end-to-end check: ExcelJS preview, RPC confirmation and persisted totals.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { parseBaseMontagem } from '../../lib/importacao-aedifica.mjs'

const fileName = 'Aedifica CT2574 - Controle Diario Montagem.xlsx'
const file = await readFile(new URL(`../../fixtures/referencias/${fileName}`, import.meta.url))
const preview = await parseBaseMontagem(file)
assert.equal(preview.errors.length, 0)
assert.deepEqual(preview.totals, { grupos: 284, quantidade_prevista: 904, volume_previsto_m3: 762.52 })

const items = preview.items.map(({ localizacao, tipo, codigo, quantidade_prevista, volume_unitario_m3 }) => ({
  localizacao, tipo, codigo, quantidade_prevista, volume_unitario_m3,
}))
const hash = createHash('sha256').update(file).digest('hex')
const sql = `
begin;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select public.confirmar_importacao_catalogo(
  (select o.id from public.obras o where not exists (
    select 1 from public.catalogo_importacoes i where i.obra_id = o.id and i.hash_arquivo = '${hash}'
  ) order by o.id limit 1),
  '${fileName}', '${hash}', ${file.length}, $catalogo$${JSON.stringify(items)}$catalogo$::jsonb
);
select jsonb_build_object(
  'grupos', count(*),
  'unidades', sum(quantidade_prevista),
  'volume_m3', sum(volume_total_previsto_m3),
  'lp003_em_pavimentos', count(*) filter (where codigo = 'LP003')
)
from public.obra_pecas
where importacao_id = (
  select id from public.catalogo_importacoes where hash_arquivo = '${hash}' order by criado_em desc limit 1
) and ativo;
commit;
`

const output = await new Promise((resolve, reject) => {
  const process = spawn('docker', [
    'exec', '-i', 'supabase_db_diario-de-obras', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At',
  ])
  let stdout = ''
  let stderr = ''
  process.stdout.on('data', (chunk) => { stdout += chunk })
  process.stderr.on('data', (chunk) => { stderr += chunk })
  process.on('error', reject)
  process.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(stderr)))
  process.stdin.end(sql)
})

const persisted = JSON.parse(output.trim().split(/\r?\n/).filter((line) => line.startsWith('{')).at(-1))
assert.deepEqual(persisted, { grupos: 284, unidades: 904, volume_m3: 762.52, lp003_em_pavimentos: 2 })
console.log(JSON.stringify(persisted))
