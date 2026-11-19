import assert from 'node:assert/strict'
import { test } from 'node:test'
import { documentoValido } from '../src/dados/documento.ts'
import { formatarData, formatarDocumento, lerData } from '../src/dados/formatacao.ts'
import { carregarCarteira } from '../src/dados/planilha.ts'

test('preserva datas civis e rejeita dias que não existem', () => {
  assert.equal(formatarData(lerData('2024-02-29')!), '29/02/2024')
  assert.equal(formatarData(lerData('29/02/2024')!), '29/02/2024')
  assert.equal(lerData('2025-02-29'), undefined)
})

test('valida os dígitos de CPF e CNPJ, inclusive com máscara e letras', () => {
  for (const doc of ['529.982.247-25', '04.252.011/0001-10', '12.abc.345/01de-35']) {
    assert.equal(documentoValido(doc), true)
  }
  for (const doc of ['000.000.000-00', '12345', '52998224724', '12ABC34501DE34']) {
    assert.equal(documentoValido(doc), false)
  }
  assert.equal(formatarDocumento('12ABC34501DE35'), '12.ABC.345/01DE-35')
  assert.equal(formatarDocumento('012345'), '012345')
})

const cabecalho =
  'nome,id,cpfCnpj,dataNascimento,email,endereco,rendaAnual,patrimonio,estadoCivil,codigoAgencia,'
const abas: Record<string, string> = {
  clientes: [
    cabecalho,
    '"Cliente, Exemplo",cl-1,012345,2024-02-29,exemplo@example.org,Rua Um,"1.234,56",0,Viuvo,99,',
    'Repetido,cl-1,99,2024-02-29,x@example.org,Rua Um,1,0,Casado,99,',
    'Data inválida,cl-2,98,2025-02-29,x@example.org,Rua Um,1,0,Casado,99,',
  ].join('\n'),
  contas:
    'tipo,cpfCnpjCliente,id,saldo,limiteCredito,creditoDisponivel\npoupança,012345,ct-1,-15.50,200,75',
  agencias: 'id,nome,codigo,endereco\nag-1,Agência Exemplo,1,"Rua Um, 2"',
}

test('converte as três abas e mantém documentos curtos e referências ausentes', async (t) => {
  const pedido = t.mock.method(
    globalThis,
    'fetch',
    async (url: URL) => new Response(abas[url.searchParams.get('sheet')!]),
  )
  const carteira = await carregarCarteira(new AbortController().signal)
  assert.equal(pedido.mock.callCount(), 3)
  assert.equal(carteira.linhasIgnoradas, 2)
  assert.equal(carteira.clientes.length, 1)
  const [cliente] = carteira.clientes
  assert.equal(cliente.nome, 'Cliente, Exemplo')
  assert.equal(cliente.estadoCivil, 'Viúvo')
  assert.equal(cliente.rendaAnual, 1234.56)
  assert.equal(cliente.rg, undefined)
  assert.equal(cliente.cpfCnpj, '012345')
  assert.equal(cliente.cpfCnpj, carteira.contas[0].cpfCnpjCliente)
  assert.equal(carteira.contas[0].saldo, -15.5)
  assert.equal(carteira.contas[0].tipo, 'poupanca')
  assert.equal(cliente.codigoAgencia, 99)
  assert.equal(carteira.agencias[0].endereco, 'Rua Um, 2')
})

test('informa falha quando a origem responde com erro ou muda uma coluna obrigatória', async (t) => {
  const sinal = new AbortController().signal
  const consulta = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }))
  await assert.rejects(carregarCarteira(sinal), /Falha ao consultar a aba/)
  consulta.mock.mockImplementation(async () => new Response('id,nome\n1,Exemplo'))
  await assert.rejects(carregarCarteira(sinal), /Não foi possível interpretar a aba/)
})
