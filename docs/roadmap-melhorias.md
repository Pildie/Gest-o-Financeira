# Roadmap de Melhorias (priorizado)

## Objetivo
Evoluir o app de controle financeiro local para um produto mais confiável, inteligente e escalável, sem perder simplicidade de uso.

## Prioridade Alta (curto prazo)
1. Importação OFX/CSV robusta com deduplicação automática.
2. Parser CSV com suporte a aspas e separadores em campos textuais.
3. Tela de revisão de importação (preview, conflitos, ignorar/aplicar).
4. Testes automatizados para regras de saldo e importadores.
5. Regras customizadas de categorização por usuário.

## Prioridade Média
1. Projeção de fluxo de caixa futuro (30/60/90 dias).
2. Fatura de cartão por competência (fechamento/vencimento/rotativo).
3. Recomendações acionáveis (não só texto), com tarefas de 1 clique.
4. Backup versionado com rollback local.

## Prioridade Baixa
1. Migração de armazenamento para IndexedDB/SQLite com migrações.
2. Criptografia opcional de backup e proteção por PIN local.
3. Dashboard personalizável por widgets.

## Melhorias implementadas neste ciclo
- Deduplicação em importação OFX e CSV.
- Parser CSV robusto com suporte a aspas.
- Redução de escopo do Tailwind `content` para acelerar build.
