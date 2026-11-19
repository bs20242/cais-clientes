import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Plus,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { Link } from 'react-router'
import { formatarDocumento, normalizarDocumento, normalizarTexto } from '../dados/formatacao'
import type { Agencia, Cliente } from '../dados/modelos'

export interface Filtros {
  busca: string
  agencia: string
  pagina: number
}

interface Props {
  clientes: Cliente[]
  agencias: Agencia[]
  filtros: Filtros
  aoFiltrar: (filtros: Filtros) => void
}

const porPagina = 10

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toLocaleUpperCase(
    'pt-BR',
  )
}

export default function ListaClientes({ clientes, agencias, filtros, aoFiltrar }: Props) {
  const termo = normalizarTexto(filtros.busca)
  const doc = normalizarDocumento(filtros.busca)
  const resultado = clientes.filter((cliente) => {
    const agenciaCorreta = !filtros.agencia || String(cliente.codigoAgencia) === filtros.agencia
    return (
      agenciaCorreta &&
      (normalizarTexto(cliente.nome).includes(termo) ||
        (cliente.nomeSocial && normalizarTexto(cliente.nomeSocial).includes(termo)) ||
        (doc !== '' && cliente.cpfCnpj.includes(doc)))
    )
  })
  const totalPaginas = Math.max(1, Math.ceil(resultado.length / porPagina))
  const pagina = Math.min(filtros.pagina, totalPaginas)
  const inicio = (pagina - 1) * porPagina
  const visiveis = resultado.slice(inicio, inicio + porPagina)
  const nomesAgencias = new Map(agencias.map((agencia) => [agencia.codigo, agencia.nome]))

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h1>Clientes</h1>
          <p className="resumo-base">
            {clientes.length}{' '}
            {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}{' '}
            <span aria-hidden="true">·</span> {agencias.length}{' '}
            {agencias.length === 1 ? 'agência' : 'agências'}
          </p>
        </div>
        <Link className="botao primario" to="/novo">
          <Plus size={18} aria-hidden="true" /> Novo cliente
        </Link>
      </div>
      <section className="painel diretorio" aria-label="Lista de clientes">
        <div className="filtros">
          <div className="campo-busca">
            <Search size={19} aria-hidden="true" />
            <input
              aria-label="Buscar por nome ou CPF/CNPJ"
              placeholder="Buscar por nome ou CPF/CNPJ"
              type="search"
              value={filtros.busca}
              onChange={(e) => aoFiltrar({ ...filtros, busca: e.target.value, pagina: 1 })}
            />
            {filtros.busca && (
              <button
                className="limpar-busca"
                aria-label="Limpar busca"
                onClick={() => aoFiltrar({ ...filtros, busca: '', pagina: 1 })}
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="campo-agencia">
            <Landmark size={17} aria-hidden="true" />
            <select
              aria-label="Filtrar por agência"
              value={filtros.agencia}
              onChange={(e) => aoFiltrar({ ...filtros, agencia: e.target.value, pagina: 1 })}
            >
              <option value="">Todas as agências</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.codigo}>
                  {a.nome} ({a.codigo})
                </option>
              ))}
            </select>
          </div>
        </div>
        {visiveis.length > 0 ? (
          <table className="tabela-clientes">
            <caption className="sr-only">Clientes encontrados</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col" className="col-documento">
                  CPF/CNPJ
                </th>
                <th scope="col" className="col-agencia">
                  Agência
                </th>
                <th scope="col">
                  <span className="sr-only">Ficha</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((cliente) => (
                <tr key={cliente.id}>
                  <th scope="row">
                    <Link
                      className="link-cliente"
                      to={'/clientes/' + encodeURIComponent(cliente.id)}
                    >
                      <span
                        className={'avatar tom-' + (cliente.nome.codePointAt(0)! % 4)}
                        aria-hidden="true"
                      >
                        {iniciais(cliente.nome)}
                      </span>
                      <span className="identidade">
                        <span>{cliente.nome}</span>
                        <small className="doc-mobile">{formatarDocumento(cliente.cpfCnpj)}</small>
                      </span>
                    </Link>
                  </th>
                  <td className="numeros col-documento">{formatarDocumento(cliente.cpfCnpj)}</td>
                  <td className="col-agencia">
                    {nomesAgencias.get(cliente.codigoAgencia) ??
                      'Agência ' + cliente.codigoAgencia + ' (sem cadastro)'}
                  </td>
                  <td className="ir-ficha">
                    <ArrowRight size={17} aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="vazio">
            <SearchX size={28} aria-hidden="true" />
            <h2>{clientes.length ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h2>
            {clientes.length > 0 && (
              <button
                className="botao secundario"
                onClick={() => aoFiltrar({ busca: '', agencia: '', pagina: 1 })}
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
        <div className="rodape-lista">
          <p role="status">
            {resultado.length
              ? inicio + 1 + '–' + (inicio + visiveis.length) + ' de ' + resultado.length
              : '0'}{' '}
            {resultado.length === 1 ? 'cliente' : 'clientes'}
          </p>
          {totalPaginas > 1 && (
            <nav aria-label="Paginação" className="paginacao">
              <button
                className="seta"
                aria-label="Página anterior"
                disabled={pagina === 1}
                onClick={() => aoFiltrar({ ...filtros, pagina: pagina - 1 })}
              >
                <ChevronLeft size={19} />
              </button>
              <span aria-label={'Página ' + pagina + ' de ' + totalPaginas}>
                {pagina} / {totalPaginas}
              </span>
              <button
                className="seta"
                aria-label="Próxima página"
                disabled={pagina === totalPaginas}
                onClick={() => aoFiltrar({ ...filtros, pagina: pagina + 1 })}
              >
                <ChevronRight size={19} />
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
