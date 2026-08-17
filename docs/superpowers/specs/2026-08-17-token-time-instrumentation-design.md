# Instrumentação de Tokens e Tempo dos Agentes — Design

**Data:** 2026-08-17
**Status:** Aprovado
**Relacionado:** Adapta duas specs originais (redução de tokens; medição de tempo de
desenvolvimento) ao que é de fato implementável dentro de um Claude Code Plugin — ver
"Decisões de escopo" abaixo para o porquê da adaptação.

## Contexto e objetivo

O usuário forneceu duas specs SDD genéricas, escritas em termos de "Claude Agent SDK /
Claude Code": uma para reduzir consumo de tokens dos agentes, outra para medir o tempo
de desenvolvimento dos agentes. Este repositório é o plugin `sasa-web-agents`
(`agents/*.md` + `skills/start/SKILL.md`, sem `CLAUDE.md`, sem código de aplicação, sem
uso da Agent SDK). O objetivo desta spec é reescrever as duas specs originais como algo
que um **plugin** consegue de fato empacotar e distribuir — para que qualquer pessoa que
instale `sasa-web-agents` via marketplace ganhe os mesmos benefícios automaticamente,
sem precisar editar o próprio `~/.claude/settings.json`.

## Decisões de escopo

- **Alvo é o plugin, não a configuração pessoal do usuário.** Confirmado com o usuário:
  as duas specs devem virar arquivos versionados neste repositório (`agents/*.md`,
  `skills/start/SKILL.md`, `hooks/hooks.json`), não instruções para o
  `~/.claude/settings.json` do usuário. Isso é o que torna o benefício acessível a
  qualquer pessoa que instale o plugin pelo GitHub público.
- **Itens fora de alcance de um plugin, removidos desta spec:** prompt caching
  (`cache_control`), context editing (`clear_tool_uses`) e compaction são internos ao
  motor do Claude Code — confirmado contra a documentação oficial (`hooks.md`,
  `plugins-reference.md`) que não existe alavanca de plugin para nenhum dos três. Da
  mesma forma, `.claudeignore` é estritamente de projeto (o plugin não pode ship um em
  nome do projeto do cliente) e `CLAUDE.md` enxuto não se aplica — este repositório não
  tem um.
- **RF-01 da spec de tempo (cronômetro visível) já existe de fábrica.** O Claude Code já
  mostra um timer ao vivo enquanto um subagente roda. Não há necessidade de construir
  isso; `subagentStatusLine` (a única customização de status-line que um plugin pode
  declarar) tem comportamento de override não documentado, então não é usado aqui.
- **Tempo medido é por subagente, não por sessão inteira.** A spec original de tempo
  assumia hooks `SessionStart`/`Stop` gravando em `~/.claude/sessions.csv` — isso mediria
  a sessão inteira do usuário (todos os projetos, todo o tempo, não só quando os agentes
  do sasa-web-agents estão em uso). Redesenhado para os hooks `SubagentStart` /
  `SubagentStop`, que disparam especificamente ao redor de cada invocação de subagente e
  cujo payload inclui `agent_type` — permitindo um hook `matcher` que só reage aos 7
  agentes deste plugin.
- **Sem eval suite formal.** A spec original de tokens assume um "conjunto de avaliação"
  para validar que nenhuma otimização derruba a taxa de sucesso (RNF-01). Este plugin não
  tem um. Por isso, nenhuma mudança nesta spec altera comportamento/qualidade dos
  agentes (nada de trocar tools, nada de trocar `model`, nada de cortar conteúdo de
  prompt) — apenas mudanças de infraestrutura (hooks, orquestração de consolidação,
  documentação).

## O que muda

### 1. Verificação documentada (sem mudança de código)

`agents/*.md` já declara `tools:` mínimas por papel e `model: sonnet` uniforme em todos
os 7 agentes. Confirmado nesta spec como já conforme às metas de RF-02 (tools sob
demanda) e ponto de partida de RF-08 (roteamento por modelo) das specs originais — não
há gordura para cortar sem arriscar qualidade (RNF-01). Nenhuma mudança de arquivo aqui.

### 2. Política de modelo documentada (RF-08 adaptado)

Adiciona uma seção curta em `skills/start/SKILL.md` explicando por que os 7 agentes
usam `sonnet` uniformemente: nenhum é rebaixado para `haiku` (a entrega é trabalho de
nível sênior — código e revisão, não classificação/sumarização simples) e nenhum é
promovido a `opus` (nenhuma tarefa no escopo atual justifica o custo adicional). Isso
satisfaz "existe uma política documentada" sem alterar comportamento.

### 3. Delegação da consolidação (RF-05 adaptado) — a única mudança que reduz tokens de fato

**Estado atual (`SKILL.md`, Passo 5 — Consolidar):** a sessão principal (o orquestrador)
lê diretamente os relatórios brutos gerados por `qa-test-strategy`,
`ui-ux-accessibility` e `code-reviewer` para decidir o que precisa ser corrigido antes
de reportar ao usuário. Esses relatórios crescem com o tamanho do projeto e ficam
retidos no contexto do orquestrador pelo resto da sessão.

**Novo comportamento:** o Passo 5 passa a despachar um subagente dedicado
("consolidator") cujo único trabalho é ler os três artefatos (testes/relatório do QA,
`docs/audits/ui-ux-accessibility-<data>.md`, e o output do `code-reviewer`) e devolver
apenas uma lista compacta e priorizada do que precisa ser corrigido. A sessão principal
nunca absorve o conteúdo bruto dos três relatórios — só a síntese.

### 4. Log de duração por subagente (spec de tempo redesenhada)

Novo diretório `hooks/` no plugin:

```
hooks/
├── hooks.json
├── log-agent-start.js
└── log-agent-stop.js
```

- **`hooks.json`** registra `SubagentStart` e `SubagentStop`, ambos com
  `matcher: "architect|backend-senior|frontend-senior|qa-test-strategy|ui-ux-accessibility|code-reviewer|consolidator"`
  — só reage aos 7 agentes deste plugin, ignora qualquer outro Task call na sessão do
  usuário.
- **`log-agent-start.js`** lê o JSON do stdin (`agent_id`, `agent_type`, `session_id`,
  `cwd`), grava o epoch atual em `${CLAUDE_PLUGIN_DATA}/.starts/<agent_id>`.
- **`log-agent-stop.js`** lê o mesmo JSON, lê o arquivo de start correspondente (se
  ausente, assume duração `0` em vez de falhar — mesma resiliência do RF-05 original),
  calcula a duração, adiciona uma linha em `${CLAUDE_PLUGIN_DATA}/agent-durations.csv`
  com colunas `timestamp,agent_type,agent_id,session_id,cwd,duration_seconds`, remove o
  arquivo de start.
- Scripts em **Node.js** (não `jq`/bash puro): Node é uma dependência garantida — o
  próprio Claude Code precisa dele — enquanto `jq` não é garantido em toda instalação.
- `${CLAUDE_PLUGIN_DATA}` é local por máquina (`~/.claude/plugins/data/{plugin-id}/`) e
  persiste entre atualizações do plugin. **Não é compartilhado nem sobe para o
  repositório** — cada pessoa que instala o plugin acumula o próprio histórico local. A
  coluna `cwd` existe porque esse diretório é compartilhado entre todos os projetos que
  usam o plugin na mesma máquina; sem ela, dados de clientes diferentes ficariam
  misturados no mesmo CSV.
- **Limitação aceita:** sem file locking no append do CSV. Se dois subagentes terminarem
  no mesmo instante (Passo 2 do `SKILL.md` despacha `backend-senior` e `frontend-senior`
  em paralelo), uma linha poderia teoricamente se intercalar. Log local de baixo risco;
  não justifica a complexidade de um lock.

### 5. README

Adiciona uma seção curta descrevendo os dois benefícios (consolidação delegada +
log de duração automático por agente), com o número medido do item 3 (ver "Medição"
abaixo) — não um percentual genérico não verificável.

## Medição (antes de publicar o número no README)

Construir um exemplo representativo (relatórios de QA, UI/UX e code-reviewer de tamanho
típico de um projeto real) e medir, em tokens:
- **Antes:** tamanho combinado dos três relatórios brutos que hoje entram no contexto do
  orquestrador no Passo 5.
- **Depois:** tamanho da síntese que o orquestrador recebe do subagente consolidador.

O número reportado no README é essa comparação medida, rotulada como "por ciclo de
consolidação" (não como uma alegação de redução geral de custo do plugin, já que os
outros itens desta spec não alteram volume de tokens).

## Fora de escopo (com justificativa)

RF-01/03/04/06/07/09 da spec de tokens original (caching, context editing, compaction,
`CLAUDE.md`, `.claudeignore`, telemetria de tokens) e RF-04 da spec de tempo original
(tempo por tarefa opcional) — nenhum tem alavanca a nível de plugin; implementá-los
exigiria editar o `~/.claude/settings.json` pessoal de cada usuário, o que foi
explicitamente descartado como fora do escopo desta rodada.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Hook Node.js falha silenciosamente e nunca loga | Scripts saem com código 0 mesmo em erro de log (best-effort) para nunca bloquear a sessão do usuário; erros vão para stderr, não travam o hook |
| CSV cresce indefinidamente ao longo do tempo | Aceito por ora — é um arquivo de log local, texto puro, tamanho desprezível mesmo após milhares de linhas |
| Consolidator subagent adiciona uma chamada extra (latência) onde antes não havia | Aceito — o objetivo é reduzir tokens retidos na sessão principal, não reduzir número de chamadas; a troca é intencional |
| Percentual de redução no README fica desatualizado se os agentes mudarem depois | O número é rotulado com a data e o método de medição, não como uma garantia permanente |
