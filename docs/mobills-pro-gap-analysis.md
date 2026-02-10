# Comparativo: App atual x Mobills Pro (referência de mercado)

> Observação: o código-fonte do Mobills Pro não é público. Este comparativo usa o comportamento conhecido do produto (recursos premium, UX e fluxo de uso) como referência funcional.

## 1) O que seu app já faz bem

- **Base financeira sólida**: lançamentos com status, transferências, parcelamento, recorrência e impacto em saldo por conta.
- **Módulos importantes já presentes**: Dashboard, Extrato, Relatórios, Metas, Cartões, Orçamentos, Categorias e assistente de análise.
- **Operação offline/local-first** com backup e importação de OFX.
- **Filtros e busca** em transações com indexação simples.

## 2) Gaps principais em relação ao que usuários esperam do “nível Pro”

### Gap A — Conectividade bancária automática
No Mobills Pro, o principal ganho percebido costuma ser reduzir digitação manual (sincronização e categorização automática).

**Hoje no seu app**
- Importação manual OFX e backup JSON.

**Melhoria recomendada**
- Integrar Open Finance (Pluggy, Belvo, Quanto, etc.) com fluxo de consentimento.
- Criar “inbox de conciliação” para revisar transações importadas antes de efetivar.
- Auto-categorização com regras e modelo incremental por usuário.

### Gap B — Controle de cartão e fatura em nível avançado
Apps Pro tratam cartão com fechamento/vencimento, fatura futura, parcelados por fatura e simulação de impacto.

**Hoje no seu app**
- Há limite, fechamento/vencimento e leitura de uso atual.

**Melhoria recomendada**
- Tela de **fatura por competência** (aberta/fechada/paga).
- “Calendário de faturas” (próximos 90 dias).
- Lançamento parcelado com **projeção de comprometimento futuro** por mês.

### Gap C — Planejamento e previsibilidade
O diferencial Pro geralmente está em prever o futuro (saldo projetado, risco de estourar orçamento, etc.).

**Hoje no seu app**
- Existe orçamento por categoria e alerta visual de estouro.

**Melhoria recomendada**
- Projeção de saldo diário até o fim do mês (incluindo recorrentes e faturas).
- Alertas preditivos: “probabilidade de estourar categoria X”.
- Cenários “e se” (simulador: reduzir categoria em 10%, quitar dívida, etc.).

### Gap D — Profundidade analítica
Pro normalmente oferece mais cortes analíticos (coortes, evolução por categoria, comparativo meta x realizado).

**Hoje no seu app**
- Relatório de pizza por categoria e barras de fluxo 6 meses.

**Melhoria recomendada**
- Série temporal por categoria (12 meses).
- Receita/Despesa por centro de custo (tags/subcategorias).
- Relatórios acionáveis com insights automáticos (top 3 alavancas de economia).

### Gap E — UX de captura rápida e automação
No uso diário, apps Pro focam em reduzir fricção (atalhos, templates, regras automáticas).

**Hoje no seu app**
- Modal completo de lançamento, com muitos campos.

**Melhoria recomendada**
- “Quick add” (3 campos: valor, descrição, conta) com categorização automática.
- Regras: “Se descrição contém X => categoria Y + tag Z”.
- Duplicar lançamento e templates recorrentes.

### Gap F — Segurança, confiabilidade e evolução de dados
Produto Pro costuma reforçar proteção, auditoria e migrações estáveis.

**Hoje no seu app**
- Armazenamento local e reset global.

**Melhoria recomendada**
- Versão de schema + migrações (evitar quebra de dados antigos).
- Criptografia local opcional (PIN/biometria em mobile).
- Log de auditoria para alterações sensíveis.

## 3) Backlog priorizado (alto impacto x esforço)

## Fase 1 — Quick wins (2–4 semanas)
1. Regras automáticas de categorização por descrição.
2. Quick add de lançamento (desktop + mobile).
3. Relatório “meta x realizado” mensal por categoria.
4. Alertas inteligentes para orçamento (80%, 100%, tendência de estouro).

## Fase 2 — Diferenciação funcional (4–8 semanas)
1. Faturas de cartão por competência.
2. Projeção de saldo diário com recorrências.
3. Inbox de conciliação para OFX (detecção de duplicatas e sugestão de categoria).

## Fase 3 — “Nível Pro” percebido (8–16 semanas)
1. Integração Open Finance com consentimento.
2. Motor de insights personalizados e explicáveis.
3. Segurança avançada (criptografia, trilha de auditoria e política de backup versionado).

## 4) Sugestões de implementação no seu código atual

- **Regras automáticas**: criar `services/rulesEngine.ts` e aplicar no fluxo de `addTransaction`.
- **Faturas por competência**: modelar entidade `Invoice` e vincular transações de cartão por ciclo (fechamento/vencimento).
- **Projeções**: novo seletor memoizado no contexto para “saldo projetado por dia”.
- **Conciliação OFX**: etapa intermediária antes de persistir, com score de similaridade (data/valor/descrição).
- **Observabilidade do usuário**: eventos locais para medir adoção de módulos (sem invadir privacidade).

## 5) Métricas para validar evolução

- % de transações cadastradas sem edição manual.
- Tempo médio para registrar um gasto.
- Taxa de categorias “sem categoria”.
- Precisão de previsão de gasto mensal (MAPE).
- Retenção 30/90 dias e frequência semanal de uso.

---

Se quiser, eu posso transformar esse backlog em **issues técnicas já quebradas por componente** (contexto, serviços e telas), com estimativa por tarefa.
