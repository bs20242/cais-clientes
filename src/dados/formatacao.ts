export function normalizarTexto(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

export function normalizarDocumento(valor: string) {
  return valor.replace(/[.\s/-]/g, '').toUpperCase()
}

export function formatarDocumento(valor: string) {
  const limpo = normalizarDocumento(valor)
  if (limpo.length === 11) return limpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  if (limpo.length === 14) return limpo.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  return valor
}

export function lerData(valor: string): Date | undefined {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor)
  if (!iso && !br) return
  const [ano, mes, dia] = iso ? iso.slice(1).map(Number) : br!.slice(1).reverse().map(Number)
  // Uma data civil não tem fuso. Construí-la em horário local evita exibir a véspera.
  const data = new Date(0)
  data.setFullYear(ano, mes - 1, dia)
  data.setHours(0, 0, 0, 0)
  if (data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia) return data
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const formatarMoeda = (valor: number) => moeda.format(valor)
export const formatarData = (valor: Date) => dataCurta.format(valor)
