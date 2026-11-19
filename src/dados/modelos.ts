export const estadosCivis = ['Solteiro', 'Casado', 'Viúvo', 'Divorciado'] as const

export interface Cliente {
  id: string
  cpfCnpj: string
  rg?: string
  dataNascimento: Date
  nome: string
  nomeSocial?: string
  email: string
  endereco: string
  rendaAnual: number
  patrimonio: number
  estadoCivil: (typeof estadosCivis)[number]
  codigoAgencia: number
}

export interface Conta {
  id: string
  cpfCnpjCliente: string
  tipo: 'corrente' | 'poupanca'
  saldo: number
  limiteCredito: number
  creditoDisponivel: number
}

export interface Agencia {
  id: string
  codigo: number
  nome: string
  endereco: string
}

export interface Carteira {
  clientes: Cliente[]
  contas: Conta[]
  agencias: Agencia[]
  linhasIgnoradas: number
}
