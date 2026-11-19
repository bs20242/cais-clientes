import { ArrowLeft, Building2, CreditCard, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { formatarData, formatarDocumento, formatarMoeda } from '../dados/formatacao'
import type { Agencia, Cliente, Conta } from '../dados/modelos'

function Dado({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <div><dt>{titulo}</dt><dd>{children ?? 'Não informado'}</dd></div>
}

export function Voltar() {
  return <Link className="voltar" to="/"><ArrowLeft size={16} aria-hidden="true" /> Voltar para clientes</Link>
}

export function NaoEncontrado() {
  return <><Voltar /><h1>Registro não encontrado</h1><p className="apoio">O endereço pode ter mudado. Cadastros temporários expiram ao recarregar a página.</p></>
}

interface Props {
  clientes: Cliente[]
  contas: Conta[]
  agencias: Agencia[]
}

export default function FichaCliente({ clientes, contas, agencias }: Props) {
  const { id } = useParams()
  const cliente = clientes.find(item => item.id === id)
  if (!cliente) return <NaoEncontrado />
  // A planilha relaciona contas pelo documento e agências pelo código, e não pelos IDs.
  const vinculadas = contas.filter(conta => conta.cpfCnpjCliente === cliente.cpfCnpj)
  const agencia = agencias.find(item => item.codigo === cliente.codigoAgencia)
  return <>
    <Voltar />
    <div className="titulo-pagina interno"><div><h1>{cliente.nome}</h1><p className="resumo-base">CPF/CNPJ <span className="numeros">{formatarDocumento(cliente.cpfCnpj)}</span></p></div></div>
    <div className="grade-ficha">
      <section className="painel secao ficha-pessoal">
        <h2><UserRound aria-hidden="true" /> Dados do cliente</h2>
        <dl className="dados">
          <Dado titulo="Nome completo">{cliente.nome}</Dado>
          <Dado titulo="Nome social">{cliente.nomeSocial}</Dado>
          <Dado titulo="CPF/CNPJ">{formatarDocumento(cliente.cpfCnpj)}</Dado>
          <Dado titulo="RG">{cliente.rg}</Dado>
          <Dado titulo="Data de nascimento">{formatarData(cliente.dataNascimento)}</Dado>
          <Dado titulo="Estado civil">{cliente.estadoCivil}</Dado>
          <Dado titulo="E-mail">{cliente.email}</Dado>
          <Dado titulo="Endereço">{cliente.endereco}</Dado>
          <Dado titulo="Renda anual">{formatarMoeda(cliente.rendaAnual)}</Dado>
          <Dado titulo="Patrimônio">{formatarMoeda(cliente.patrimonio)}</Dado>
          <Dado titulo="Código da agência">{cliente.codigoAgencia}</Dado>
          <Dado titulo="ID do cliente">{cliente.id}</Dado>
        </dl>
      </section>
      <section className="painel secao ficha-agencia">
        <h2><Building2 aria-hidden="true" /> Agência</h2>
        {agencia ? <dl className="dados">
          <Dado titulo="Nome">{agencia.nome}</Dado>
          <Dado titulo="Código">{agencia.codigo}</Dado>
          <Dado titulo="Endereço">{agencia.endereco}</Dado>
          <Dado titulo="ID da agência">{agencia.id}</Dado>
        </dl> : <p className="apoio">A agência de código {cliente.codigoAgencia} não foi encontrada na planilha.</p>}
      </section>
      <section className="painel secao ficha-contas">
        <h2><CreditCard aria-hidden="true" /> Contas bancárias <span className="contagem">{vinculadas.length}</span></h2>
        {vinculadas.length === 0 ? <p className="apoio">Nenhuma conta vinculada a este documento.</p> :
          vinculadas.map(conta => <article key={conta.id} className="conta">
            <h3>{conta.tipo === 'corrente' ? 'Conta corrente' : 'Conta poupança'}</h3>
            <dl className="dados">
              <Dado titulo="Saldo">{formatarMoeda(conta.saldo)}</Dado>
              <Dado titulo="Limite de crédito">{formatarMoeda(conta.limiteCredito)}</Dado>
              <Dado titulo="Crédito disponível">{formatarMoeda(conta.creditoDisponivel)}</Dado>
              <Dado titulo="CPF/CNPJ do titular">{formatarDocumento(conta.cpfCnpjCliente)}</Dado>
              <Dado titulo="ID da conta">{conta.id}</Dado>
            </dl>
          </article>)}
      </section>
    </div>
  </>
}
