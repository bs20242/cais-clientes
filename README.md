# Banco Cais

Aplicação em React e TypeScript para consultar clientes, contas e agências de um banco fictício. [Acessar o Banco Cais](https://bs20242.github.io/cais-clientes/)

A lista permite buscar por nome ou CPF/CNPJ e filtrar por agência, com até dez clientes por página. A ficha reúne os dados do cliente, as contas vinculadas e o endereço da agência.

Os dados são lidos de uma planilha do Google ao abrir o aplicativo ou selecionar **Atualizar dados**. Novos cadastros ficam na memória do navegador até a página ser recarregada.

## Execução local

Com Node.js 24 ou 22.17 e npm instalados, execute na pasta do projeto os comandos abaixo.

```sh
npm ci
npm run dev
```

## Verificações e build

| Comando | Função |
| --- | --- |
| `npm test` | Executa os testes de leitura e validação dos dados. |
| `npm run lint` | Verifica o código com o Oxlint. |
| `npm run build` | Verifica os tipos e gera o site em `dist`. |
| `npm run preview` | Serve o build localmente. |

O GitHub Actions executa as verificações e publica a versão da `main` no GitHub Pages.
