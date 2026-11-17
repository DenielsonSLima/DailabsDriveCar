import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'drive-cliente-'));
try {
  const outfile = join(dir, 'schema.mjs');
  await build({ entryPoints: ['modules/parceiros/parceiros.types.ts'], outfile, bundle: true, platform: 'node', format: 'esm' });
  const { ParceiroSchema } = await import(pathToFileURL(outfile));
  for (const pessoa_tipo of ['FISICA', 'JURIDICA']) {
    const base = { nome: '  CLIENTE TESTE  ', pessoa_tipo, tipo: 'CLIENTE' };
    const fields = ['documento','email','telefone','whatsapp','cep','logradouro','numero','bairro','cidade','uf','complemento'];
    for (const value of [undefined, null, '']) {
      const result = ParceiroSchema.parse({ ...base, ...Object.fromEntries(fields.map(field => [field, value])) });
      assert.equal(result.nome, 'CLIENTE TESTE');
    }
    for (const nome of ['', '   ']) assert.equal(ParceiroSchema.safeParse({ ...base, nome }).success, false);
    const existing = {...base, nome: 'CLIENTE TESTE', documento: '12345678901', email: 'teste@example.com', cep: '49000-000', uf: 'SE', cidade: 'ARACAJU', logradouro: 'RUA A', numero: '10', bairro: 'CENTRO'};
    const parsed = ParceiroSchema.parse(existing);
    for (const key of Object.keys(existing)) assert.equal(parsed[key], existing[key]);
    for (const invalid of [{email: 'invalido'}, {cep: '123'}, {uf: 'S'}]) assert.equal(ParceiroSchema.safeParse({...base, ...invalid}).success, false);
  }
  const searchFile = join(dir, 'search.mjs');
  await build({ entryPoints: ['modules/lotes/lotes.clientes.ts'], outfile: searchFile, bundle: true, platform: 'node', format: 'esm' });
  const { filtrarClientesLote } = await import(pathToFileURL(searchFile));
  const clients = [
    {id:'a', nome:'JOSÉ SILVA', tipo:'CLIENTE', documento:null},
    {id:'b', nome:'JOSÉ SILVA', tipo:'CLIENTE', documento:'12345678901'},
  ];
  assert.deepEqual(filtrarClientesLote(clients, 'jose silva').map(c => c.id), ['a','b']);
  assert.deepEqual(filtrarClientesLote(clients, '123.456.789-01').map(c => c.id), ['b']);
  assert.deepEqual(filtrarClientesLote(clients, '').map(c => c.id), ['a','b']);
  console.log('PASS: name-only PF/PJ, blank/null/omitted optional fields, whitespace name rejected, existing data preserved and supplied email/CEP/UF validated.');
} finally { await rm(dir, { recursive: true, force: true }); }
