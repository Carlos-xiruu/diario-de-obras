import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

function query(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', '-i', 'supabase_db_diario-de-obras', 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1'])
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim())))
    child.stdin.end(sql)
  })
}

const fixture = JSON.parse(await query(`
with obra as (insert into public.obras (nome_obra, cidade) values ('Concorrencia local', 'Teste') returning id),
importacao as (insert into public.catalogo_importacoes (obra_id, revisao, nome_arquivo, hash_arquivo, tamanho_bytes, status, resumo, criado_por) select id, 1, 'concorrencia.xlsx', repeat('9', 64), 1, 'aplicada', '{}'::jsonb, '10000000-0000-0000-0000-000000000001' from obra returning id, obra_id),
localizacao as (insert into public.obra_localizacoes (obra_id, nome) select obra_id, 'Pavimento' from importacao returning id, obra_id),
peca as (insert into public.obra_pecas (obra_id, localizacao_id, importacao_id, tipo, codigo, quantidade_prevista, volume_unitario_m3) select i.obra_id, l.id, i.id, 'VR', 'VR006', 1, 1 from importacao i join localizacao l on l.obra_id=i.obra_id returning id, obra_id),
diarios as (insert into public.diarios (obra_id, obra, cidade, data_registro) select obra_id, 'Concorrencia local', 'Teste', current_date from peca union all select obra_id, 'Concorrencia local', 'Teste', current_date from peca returning id)
select json_build_object('peca', (select id from peca), 'diarios', (select json_agg(id) from diarios));
`))

const call = (diario, key) => query(`begin; select set_config('request.jwt.claim.role','authenticated',true); select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true); set local role authenticated; select public.aplicar_montagem_diario('${diario}', jsonb_build_array(jsonb_build_object('obra_peca_id','${fixture.peca}','quantidade',1)), 'confirmar', '${key}', null); commit;`)
const results = await Promise.allSettled([
  call(fixture.diarios[0], '11111111-1111-1111-1111-111111111111'),
  call(fixture.diarios[1], '22222222-2222-2222-2222-222222222222'),
])
assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
assert.equal(results.filter((result) => result.status === 'rejected').length, 1)
const mounted = await query(`select quantidade_montada from public.obra_pecas where id='${fixture.peca}'`)
assert.equal(mounted, '1')
console.log('Concorrencia validada: uma confirmacao venceu e o saldo nao ficou negativo.')
