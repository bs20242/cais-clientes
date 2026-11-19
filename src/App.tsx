import { useEffect, useRef, useState } from 'react'
import { AlertCircle, BookUser, RefreshCw } from 'lucide-react'
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router'
import type { Carteira } from './dados/modelos'
import { carregarCarteira } from './dados/planilha'
import FichaCliente, { NaoEncontrado } from './paginas/FichaCliente'
import ListaClientes, { type Filtros } from './paginas/ListaClientes'

const filtrosIniciais: Filtros = { busca: '', agencia: '', pagina: 1 }

function Diretorio() {
  const { pathname } = useLocation()
  const principal = useRef<HTMLElement>(null)
  const [dados, setDados] = useState<Carteira>()
  const [filtros, setFiltros] = useState(filtrosIniciais)
  const [versao, setVersao] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const controle = new AbortController()
    carregarCarteira(controle.signal).then(carteira => {
      if (!controle.signal.aborted) setDados(carteira)
    }).catch((causa: unknown) => {
      if (!controle.signal.aborted) setErro(causa instanceof Error && causa.message.includes('aba ') ? causa.message : 'Confira a conexão e tente novamente.')
    }).finally(() => {
      if (!controle.signal.aborted) setCarregando(false)
    })
    return () => controle.abort()
  }, [versao])

  useEffect(() => {
    const titulo = pathname === '/' ? 'Clientes' : pathname === '/novo' ? 'Novo cliente' : 'Ficha do cliente'
    document.title = titulo + ' · Banco Cais'
    principal.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])

  function atualizar() {
    setCarregando(true)
    setErro('')
    setVersao(anterior => anterior + 1)
  }

  return <>
    <a className="pular" href="#conteudo" onClick={e => { e.preventDefault(); principal.current?.focus() }}>Pular para o conteúdo</a>
    <header className="topo"><div className="barra">
      <Link className="marca" to="/" aria-label="Banco Cais, início"><img src={import.meta.env.BASE_URL + 'cais.svg'} alt="" /><span>Banco Cais</span></Link>
      <nav aria-label="Principal" className="nav-topo"><NavLink to="/" end><BookUser size={17} aria-hidden="true" /> Clientes</NavLink></nav>
      <button className="atualizar" disabled={carregando} onClick={atualizar}>
        <RefreshCw size={16} aria-hidden="true" className={carregando ? 'girando' : ''} /><span>{carregando ? 'Atualizando' : 'Atualizar dados'}</span>
      </button>
    </div></header>
    <main className="conteudo" id="conteudo" tabIndex={-1} ref={principal}>
      {erro && <div className="aviso erro" role="alert"><AlertCircle size={20} aria-hidden="true" /><div><strong>Não foi possível atualizar a planilha.</strong> {erro} {dados && 'Os dados da última leitura continuam disponíveis.'}</div><button className="botao secundario" onClick={atualizar}>Tentar novamente</button></div>}
      {dados ? <>
        {dados.linhasIgnoradas > 0 && <p className="aviso" role="status">Registros ignorados por dados inválidos ou IDs repetidos na planilha: {dados.linhasIgnoradas}.</p>}
        <Routes>
          <Route path="/" element={<ListaClientes clientes={dados.clientes} agencias={dados.agencias} filtros={filtros} aoFiltrar={setFiltros} />} />
          <Route path="/clientes/:id" element={<FichaCliente clientes={dados.clientes} agencias={dados.agencias} contas={dados.contas} />} />
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
      </> : carregando && <div className="carregamento" role="status"><RefreshCw size={22} className="girando" aria-hidden="true" /> Carregando a planilha…</div>}
    </main>
  </>
}

export default function App() {
  return <HashRouter><Diretorio /></HashRouter>
}
