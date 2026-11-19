import { normalizarDocumento } from './formatacao'

function digitoVerificador(base: string, pesos: number[]) {
  // Na tabela do CNPJ, cada letra vale seu código ASCII menos 48. Para dígitos, isso dá o próprio número.
  const soma = Array.from(base).reduce((total, caractere, i) => total + (caractere.charCodeAt(0) - 48) * pesos[i], 0)
  const resto = soma % 11
  return String(resto < 2 ? 0 : 11 - resto)
}

export function documentoValido(valor: string) {
  const doc = normalizarDocumento(valor)
  const cpf = /^\d{11}$/.test(doc)
  if ((!cpf && !/^[A-Z0-9]{12}\d{2}$/.test(doc)) || /^(.)\1+$/.test(doc)) return false
  const pesos = cpf ? [10, 9, 8, 7, 6, 5, 4, 3, 2] : [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const base = doc.slice(0, -2)
  const primeiro = digitoVerificador(base, pesos)
  const segundo = digitoVerificador(base + primeiro, [cpf ? 11 : 6, ...pesos])
  return doc === base + primeiro + segundo
}
