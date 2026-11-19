import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { documentoValido } from '../dados/documento'
import { lerData, normalizarDocumento } from '../dados/formatacao'
import { estadosCivis, type Agencia, type Cliente } from '../dados/modelos'
import { Voltar } from './FichaCliente'
import './cadastro.css'

interface Props {
  clientes: Cliente[]
  agencias: Agencia[]
  aoCadastrar: (cliente: Cliente) => void
}

export default function CadastroCliente({ clientes, agencias, aoCadastrar }: Props) {
  const [erro, setErro] = useState<{ campo: string; mensagem: string }>()
  const [hoje] = useState(() => new Date())
  const dataMaxima = [hoje.getFullYear(), String(hoje.getMonth() + 1).padStart(2, '0'), String(hoje.getDate()).padStart(2, '0')].join('-')

  function atributos(campo: string) {
    return { name: campo, id: campo, 'aria-invalid': erro?.campo === campo || undefined, 'aria-describedby': erro?.campo === campo ? 'erro-cadastro' : undefined }
  }

  function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const form = evento.currentTarget
    const dados = new FormData(form)
    const texto = (campo: string) => String(dados.get(campo) ?? '').trim()
    function indicarErro(campo: string, mensagem: string) {
      setErro({ campo, mensagem })
      const controle = form.elements.namedItem(campo)
      if (controle instanceof HTMLElement) controle.focus()
    }

    const nome = texto('nome')
    const endereco = texto('endereco')
    const cpfCnpj = normalizarDocumento(texto('cpfCnpj'))
    const nascimento = lerData(texto('dataNascimento'))
    const estadoCivil = estadosCivis.find(estado => estado === texto('estadoCivil'))
    const agencia = agencias.find(item => String(item.codigo) === texto('codigoAgencia'))
    if (!nome) return indicarErro('nome', 'Informe o nome completo.')
    if (!documentoValido(cpfCnpj)) return indicarErro('cpfCnpj', 'Confira os caracteres e os dígitos verificadores do CPF ou CNPJ.')
    if (clientes.some(cliente => cliente.cpfCnpj === cpfCnpj)) return indicarErro('cpfCnpj', 'Já existe um cliente com este CPF ou CNPJ.')
    if (!nascimento || nascimento > hoje) return indicarErro('dataNascimento', 'Informe uma data de nascimento válida até hoje.')
    if (!estadoCivil) return indicarErro('estadoCivil', 'Selecione um estado civil.')
    if (!endereco) return indicarErro('endereco', 'Informe o endereço.')
    if (!agencia) return indicarErro('codigoAgencia', 'Selecione uma agência disponível.')

    aoCadastrar({
      id: crypto.randomUUID(), nome, cpfCnpj, dataNascimento: nascimento, estadoCivil, endereco,
      rg: texto('rg') || undefined, nomeSocial: texto('nomeSocial') || undefined, email: texto('email'),
      rendaAnual: Number(texto('rendaAnual')), patrimonio: Number(texto('patrimonio')), codigoAgencia: agencia.codigo,
    })
  }

  return <>
    <Voltar />
    <div className="titulo-pagina interno"><div><h1>Novo cliente</h1>
      <p className="resumo-base">O cadastro fica disponível até recarregar a página.</p>
    </div></div>
    <form className="painel formulario" onSubmit={cadastrar} onInput={() => { if (erro) setErro(undefined) }}>
      <fieldset><legend>Dados pessoais</legend><div className="campos">
        <label className="largo">Nome completo<input {...atributos('nome')} autoComplete="name" required /></label>
        <label>Nome social <small>(opcional)</small><input {...atributos('nomeSocial')} /></label>
        <label>CPF ou CNPJ<input {...atributos('cpfCnpj')} spellCheck={false} autoCapitalize="characters" required /></label>
        <label>RG <small>(opcional)</small><input {...atributos('rg')} /></label>
        <label>Data de nascimento<input type="date" {...atributos('dataNascimento')} autoComplete="bday" max={dataMaxima} required /></label>
        <label>Estado civil<select {...atributos('estadoCivil')} defaultValue="" required>
          <option value="" disabled>Selecione</option>{estadosCivis.map(estado => <option key={estado}>{estado}</option>)}
        </select></label>
      </div></fieldset>
      <fieldset><legend>Contato</legend><div className="campos">
        <label>E-mail<input type="email" {...atributos('email')} autoComplete="email" required /></label>
        <label>Endereço<input {...atributos('endereco')} autoComplete="street-address" required /></label>
      </div></fieldset>
      <fieldset><legend>Dados bancários</legend><div className="campos">
        <label>Renda anual (R$)<input type="number" {...atributos('rendaAnual')} inputMode="decimal" min="0" step="0.01" required /></label>
        <label>Patrimônio (R$)<input type="number" {...atributos('patrimonio')} inputMode="decimal" min="0" step="0.01" required /></label>
        <label>Agência<select {...atributos('codigoAgencia')} defaultValue="" required>
          <option value="" disabled>{agencias.length ? 'Selecione uma agência' : 'Nenhuma agência disponível'}</option>
          {agencias.map(a => <option value={a.codigo} key={a.id}>{a.nome} ({a.codigo})</option>)}
        </select></label>
      </div></fieldset>
      {erro && <p className="aviso erro erro-cadastro" id="erro-cadastro" role="alert">{erro.mensagem}</p>}
      <div className="acoes-form"><Link className="botao secundario" to="/">Cancelar</Link><button className="botao primario" type="submit">Cadastrar cliente</button></div>
    </form>
  </>
}
