# Finanças Local (offline)

Aplicativo de gestão financeira pessoal com React + Vite + Electron.

## O que já está no app

- Dashboard financeiro
- Extrato com filtros
- Orçamentos por categoria
- Metas
- Cartões de crédito
- Relatórios
- Importação OFX e backup JSON
- Cadastro de transações com parcelamento/recorrência
- **Modo rápido de lançamento** (novo)
- **Sugestão automática de categoria por descrição** (novo)

## Rodar localmente (sem pagar hospedagem)

Você **não precisa de hospedagem** para usar o app no seu computador.

### 1) Pré-requisitos

- Node.js 18+
- npm

### 2) Instalar dependências

```bash
npm install
```

### 3) Rodar em modo desenvolvimento (web)

```bash
npm run dev
```

Depois abra no navegador o endereço exibido no terminal (geralmente `http://localhost:5173`).

### 4) Gerar build web local

```bash
npm run build
npm run preview
```

### 5) Rodar como app desktop (Electron)

```bash
npm run start
```

Esse comando gera o build e abre o app desktop localmente.

### 6) Empacotar para Windows

```bash
npm run build-win
```

## Onde os dados ficam

- O app funciona em modo local/offline.
- Você pode exportar/importar backup JSON em **Configurações**.
- Também pode importar extratos OFX.

## Próximos passos sugeridos

- Regras de categorização customizadas por usuário
- Faturas por competência para cartão
- Projeção de saldo futuro
- Conciliação inteligente de OFX com deduplicação
