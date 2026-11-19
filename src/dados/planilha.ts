import Papa from 'papaparse'
import { lerData, normalizarDocumento, normalizarTexto } from './formatacao'
import { estadosCivis, type Agencia, type Carteira, type Cliente, type Conta } from './modelos'

const origem = 'https://docs.google.com/spreadsheets/d/1LkyaeCgiyaIN1IxXnbZQPmVMIcht3PIxMDUXHsvczK0/gviz/tq'
type Linha = Record<string, string>
class CampoInvalido extends Error {}

function obrigatorio(valor: string | undefined): string {
  if (!valor) throw new CampoInvalido()
  return valor
}

function numero(valor: string): number {
  const texto = obrigatorio(valor).replace(/^R\$\s*/, '').trim()
  const decimal = texto.includes(',')
    ? /^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(texto) && texto.replaceAll('.', '').replace(',', '.')
    : /^[+-]?\d+(?:\.\d+)?$/.test(texto) && texto
  if (!decimal || !Number.isFinite(Number(decimal))) throw new CampoInvalido()
  return Number(decimal)
}

function codigoAgencia(valor: string): number {
  const codigo = numero(valor)
  if (!Number.isSafeInteger(codigo)) throw new CampoInvalido()
  return codigo
}

function documento(valor: string): string {
  // A origem contém documentos curtos. Preservar seu tamanho mantém o vínculo com as contas.
  const limpo = normalizarDocumento(obrigatorio(valor))
  if (!/^[A-Z0-9]+$/.test(limpo)) throw new CampoInvalido()
  return limpo
}

function lerCliente(linha: Linha): Cliente {
  const nascimento = lerData(obrigatorio(linha.dataNascimento))
  const estadoCivil = estadosCivis.find(estado => normalizarTexto(estado) === normalizarTexto(linha.estadoCivil))
  if (!nascimento || !estadoCivil) throw new CampoInvalido()
  return {
    id: obrigatorio(linha.id),
    cpfCnpj: documento(linha.cpfCnpj),
    rg: linha.rg || undefined,
    dataNascimento: nascimento,
    nome: obrigatorio(linha.nome),
    nomeSocial: linha.nomeSocial || undefined,
    email: obrigatorio(linha.email),
    endereco: obrigatorio(linha.endereco),
    rendaAnual: numero(linha.rendaAnual),
    patrimonio: numero(linha.patrimonio),
    estadoCivil,
    codigoAgencia: codigoAgencia(linha.codigoAgencia),
  }
}

function lerConta(linha: Linha): Conta {
  const tipo = normalizarTexto(linha.tipo)
  if (tipo !== 'corrente' && tipo !== 'poupanca') throw new CampoInvalido()
  return {
    id: obrigatorio(linha.id),
    cpfCnpjCliente: documento(linha.cpfCnpjCliente),
    tipo,
    saldo: numero(linha.saldo),
    limiteCredito: numero(linha.limiteCredito),
    creditoDisponivel: numero(linha.creditoDisponivel),
  }
}

function lerAgencia(linha: Linha): Agencia {
  return { id: obrigatorio(linha.id), codigo: codigoAgencia(linha.codigo), nome: obrigatorio(linha.nome), endereco: obrigatorio(linha.endereco) }
}

async function lerAba<T extends { id: string }>(
  aba: string, colunasObrigatorias: string[], converter: (linha: Linha) => T, signal: AbortSignal,
) {
  const url = new URL(origem)
  url.searchParams.set('tqx', 'out:csv')
  url.searchParams.set('sheet', aba)
  const resposta = await fetch(url, { signal, cache: 'no-store' })
  if (!resposta.ok) throw new Error('Falha ao consultar a aba ' + aba + '.')
  const csv = await resposta.text()
  // Ler por cabeçalho permite reordenar as colunas e ignorar colunas extras sem nome.
  const { data, errors } = Papa.parse<string[]>(csv, { delimiter: ',', skipEmptyLines: 'greedy' })
  const cabecalho = (data.shift() ?? []).map(campo => campo.trim())
  if (errors.length || !colunasObrigatorias.every(campo => cabecalho.includes(campo))) {
    throw new Error('Não foi possível interpretar a aba ' + aba + '.')
  }
  const itens: T[] = []
  const ids = new Set<string>()
  let ignoradas = 0
  for (const valores of data) {
    const linha: Linha = {}
    cabecalho.forEach((campo, i) => { if (campo) linha[campo] = valores[i]?.trim() ?? '' })
    try {
      const item = converter(linha)
      if (ids.has(item.id)) throw new CampoInvalido()
      ids.add(item.id)
      itens.push(item)
    } catch (erro) {
      if (!(erro instanceof CampoInvalido)) throw erro
      ignoradas++
    }
  }
  return { itens, ignoradas }
}

export async function carregarCarteira(signal: AbortSignal): Promise<Carteira> {
  const [clientes, contas, agencias] = await Promise.all([
    lerAba('clientes', ['id', 'cpfCnpj', 'dataNascimento', 'nome', 'email', 'endereco', 'rendaAnual', 'patrimonio', 'estadoCivil', 'codigoAgencia'], lerCliente, signal),
    lerAba('contas', ['id', 'cpfCnpjCliente', 'tipo', 'saldo', 'limiteCredito', 'creditoDisponivel'], lerConta, signal),
    lerAba('agencias', ['id', 'codigo', 'nome', 'endereco'], lerAgencia, signal),
  ])
  return {
    clientes: clientes.itens, contas: contas.itens, agencias: agencias.itens,
    linhasIgnoradas: clientes.ignoradas + contas.ignoradas + agencias.ignoradas,
  }
}
