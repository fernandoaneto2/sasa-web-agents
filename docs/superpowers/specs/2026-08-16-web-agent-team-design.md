# Time de Agentes para Web — Design

**Data:** 2026-08-16
**Status:** Aprovado

## Contexto e objetivo

O usuário desenvolve sites para clientes e quer um time fixo de agentes especialistas,
reutilizável em qualquer projeto futuro, que produza sites de nível sênior tanto em
engenharia (backend/frontend/testes/segurança) quanto em experiência visual —
interfaces altamente dinâmicas, com scroll horizontal e vertical, animações GSAP e
imagens que interagem entre si, no padrão de sites de referência como o site pessoal
do piloto de F1 Lando Norris.

O time é inspirado em um fluxo real de squad de engenharia: Tech Lead, Arquiteto,
Backend Sênior, Frontend Sênior, UI/UX & Acessibilidade, QA e Code Reviewer.

Requisito adicional: o time precisa ser **distribuível** — o usuário quer poder
publicar isso como um repositório público no GitHub para que qualquer pessoa no mundo
instale e use no próprio Claude Code, com um README explicando o que cada agente faz e
como invocar em cada situação.

## Decisões de escopo

- **Agentes executáveis, não só documentação.** O resultado final são subagentes reais
  do Claude Code (arquivos `agents/*.md` com frontmatter `name`/`description`/`tools`),
  invocáveis via Agent tool, não apenas uma descrição textual de requisitos.
- **Distribuição como Claude Code Plugin.** Em vez de instruções pessoais em
  `~/.claude/`, o time inteiro é empacotado como um **plugin** do Claude Code — a
  unidade nativa de distribuição via GitHub, com manifesto próprio
  (`.claude-plugin/plugin.json`), agentes em `agents/*.md` e a orquestração em uma
  skill (`skills/start/SKILL.md`). Esse é o mesmo mecanismo do plugin `superpowers` já
  usado pelo usuário (`/superpowers:brainstorming` etc.) — validado como o caminho
  correto, porque instruções em `~/.claude/CLAUDE.md` são pessoais/locais e **não**
  acompanham o repositório quando compartilhado no GitHub; um plugin, sim.
- **Nome do plugin:** `sasa-web-agents`. Invocação da skill de orquestração:
  `/sasa-web-agents:start` (o namespace `plugin:skill` é obrigatório no Claude Code —
  não existe invocação "bare" de skill de plugin).
- **Tech Lead não é um subagente separado.** A orquestração (decompor tarefa, decidir
  quem chamar e em que ordem, disparar trabalho em paralelo, consolidar resultado) é o
  papel que a própria sessão principal do Claude Code já exerce ao usar a ferramenta
  Agent. Criar um subagente "tech-lead" que por sua vez chama outros subagentes
  adicionaria uma camada de indireção sem benefício real. Em vez disso, o comportamento
  de orquestração é o conteúdo da skill `skills/start/SKILL.md`, carregado sob demanda
  quando o usuário digita `/sasa-web-agents:start`.
- **Stack padrão para sites de cliente:** Next.js + React + TypeScript. GSAP (com
  ScrollTrigger) é a biblioteca padrão de animação; Lenis (ou equivalente) para smooth
  scroll. Esse padrão pode ser ajustado caso a caso por projeto, mas é o ponto de
  partida assumido pelo Frontend Sênior e cobrado pelo UI/UX.

## Arquitetura

```
sasa-web-agents/                       (raiz do plugin = raiz deste repositório)
├── .claude-plugin/
│   ├── plugin.json                    (manifesto: name, description, version, author,
│   │                                    license, repository)
│   └── marketplace.json               (manifesto de marketplace: mesmo repositório
│                                        single-plugin se auto-hospeda como sua própria
│                                        fonte de marketplace, com "source": "./" apontando
│                                        para si mesmo — verificado empiricamente contra o
│                                        plugin `superpowers` instalado nesta máquina, que
│                                        também ships plugin.json E marketplace.json lado a
│                                        lado dentro de .claude-plugin/)
├── agents/
│   ├── architect.md
│   ├── backend-senior.md
│   ├── frontend-senior.md
│   ├── ui-ux-accessibility.md
│   ├── qa-test-strategy.md
│   └── code-reviewer.md
├── skills/
│   └── start/
│       └── SKILL.md                   (Fase 0 de descoberta + fluxo de orquestração)
├── README.md                          (o que cada agente faz + como invocar)
└── LICENSE                            (MIT)
```

Cada arquivo de agente segue o formato padrão de subagente do Claude Code: frontmatter
(`name`, `description`, `tools`, opcionalmente `model`) seguido do prompt de sistema do
agente. Uma vez o plugin instalado, os 6 agentes ficam disponíveis automaticamente
(aparecem em `/context` sob "Custom Agents" e podem ser chamados via Agent tool ou
@-menção) — não é preciso nenhum passo extra de registro.

## Isolamento entre a infraestrutura de agentes e o código do projeto (portabilidade)

Regra explícita do usuário: o desenvolvimento de um site de cliente não pode interferir
na pasta onde os subagentes vivem. O motivo é a portabilidade — se o usuário repassar o
repositório de um projeto pelo GitHub (para o cliente, para outro desenvolvedor, para a
comunidade), quem receber precisa conseguir usar o código sem depender da configuração
pessoal de agentes do usuário nem esbarrar nela.

- O plugin `sasa-web-agents` (este repositório) é a única fonte dos 6 agentes. Uma vez
  instalado pelo usuário (ou por qualquer pessoa que instale o plugin), o Claude Code
  os disponibiliza globalmente — nunca copiados manualmente para dentro de um
  repositório de projeto de cliente.
- Cada projeto de cliente é um repositório próprio, separado deste repositório
  `sasa-web-agents` (que guarda só a definição do time) e separado dos demais projetos
  de cliente entre si. O repositório do plugin nunca contém código de nenhum site real,
  e nenhum repositório de cliente contém os arquivos do plugin.
- Dentro de cada repositório de projeto, se o usuário optar por versionar configuração
  local do Claude Code para aquele projeto (`.claude/settings.json`, um `CLAUDE.md` de
  projeto, overrides locais de agente), essa pasta `.claude/` fica sempre como uma
  pasta **irmã, em paralelo**, ao código do site — nunca dentro dela, e o código do
  site nunca depende de nada que esteja dentro de `.claude/` para funcionar.
- **Teste de portabilidade:** o site precisa buildar, rodar e fazer deploy normalmente
  mesmo que a pasta `.claude/` seja completamente removida do repositório. Isso vale
  como critério de aceite para `backend-senior` e `frontend-senior` — nunca referenciar
  caminhos dentro de `.claude/` em imports, scripts de build, variáveis de ambiente ou
  configuração de deploy.
- Ao iniciar um projeto novo (fim da Fase 0), a estrutura de pastas do repositório do
  cliente já nasce com essa separação, por exemplo:

  ```
  cliente-xyz/
  ├── .claude/          (opcional, tooling do usuário — pode ser removido sem quebrar o site)
  ├── docs/
  │   └── briefing-cliente.md
  ├── src/ (ou app/)    (código do site — autocontido)
  ├── public/
  └── README.md
  ```

## Fase 0 — Descoberta (briefing do cliente)

Requisito do usuário: antes de qualquer projeto novo de site começar a ser desenhado
ou codificado, o time precisa reunir o briefing do cliente. Sem isso, `architect` e
`frontend-senior` tomam decisões no escuro (paleta, densidade de texto, estrutura de
páginas) que geram retrabalho.

Esta fase só roda **uma vez por projeto novo de cliente** — tarefas de manutenção,
correção de bug ou pequenas mudanças em um site já existente pulam direto para a
Triagem (passo 1 do fluxo abaixo), reaproveitando o briefing já coletado anteriormente
(se existir, deve ser salvo em `docs/briefing-cliente.md` no repositório do projeto do
cliente e reconsultado, em vez de perguntado de novo).

A Fase 0 começa quando o usuário digita `/sasa-web-agents:start` para iniciar um
projeto novo. Quem conduz é a sessão principal (papel de Tech Lead), seguindo as
instruções da skill, diretamente com quem está operando o Claude Code — não um
subagente. As perguntas abaixo cobrem as
categorias padrão usadas por agências e freelancers de web design para escopar um
projeto (goals, público, budget, timeline, brand assets, inspiração visual) e foram
adaptadas para alimentar especificamente os outros 6 agentes do time:

- **Negócio & objetivo** *(alimenta `architect`)* — nome da empresa/marca; ramo de
  atuação; objetivo principal do site (institucional, geração de leads, venda online,
  portfólio, agendamento); público-alvo; principais concorrentes; diferencial
  competitivo / proposta de valor.
- **Identidade visual & marca** *(alimenta `frontend-senior` e `ui-ux-accessibility`)*
  — já existe marca/logo pronta (e em qual formato)? existe manual de marca? paleta de
  cores definida ou preferências (e cores a evitar)? tipografia definida ou
  preferências? personalidade da marca em três palavras.
- **Conteúdo & copy** *(alimenta `frontend-senior`)* — o copy já está pronto,
  parcialmente pronto ou precisa ser escrito do zero? tom de voz desejado (formal,
  descontraído, técnico, inspirador)? densidade de texto por seção — mais
  textual/explicativo, equilibrado, ou minimalista (poucas palavras, o visual conduz a
  mensagem)? idiomas do site.
- **Mídia & assets** *(alimenta `frontend-senior`)* — existem fotos/vídeos próprios de
  qualidade profissional? precisa de banco de imagens (stock) ou geração de imagem?
  existem vídeos institucionais ou materiais de campanha reaproveitáveis? há
  necessidade de galeria/portfólio com múltiplas imagens por item?
- **Estrutura & funcionalidades** *(alimenta `architect` e `backend-senior`)* — quais
  páginas/seções são necessárias; precisa de formulário de contato/orçamento (quais
  campos); precisa de integração com CRM, WhatsApp, e-mail marketing, pagamento ou
  agendamento; precisa de blog/CMS editável pelo próprio cliente; precisa de área
  logada; é e-commerce (quantos produtos, qual gateway); precisa de múltiplos idiomas.
- **Estilo de interação & experiência** *(alimenta `frontend-senior` e
  `ui-ux-accessibility`, específico do padrão GSAP/scroll do time)* — o cliente quer
  uma experiência altamente animada/imersiva (estilo Lando Norris) ou uma abordagem
  mais sóbria/institucional? há seção que pede scroll horizontal (portfólio, timeline,
  produtos)? existe conteúdo que se beneficia de storytelling visual (scrollytelling de
  processo, linha do tempo, cases)? sites de referência que o cliente admira e o que
  especificamente gostou neles.
- **Técnico & operacional** *(alimenta `architect`)* — já existe domínio/hospedagem
  contratados? quem vai manter o site depois do lançamento (o cliente via CMS ou sempre
  via desenvolvedor)? prazo desejado; orçamento de referência.
- **SEO & metas de conversão** *(alimenta `architect` e `qa-test-strategy`)* —
  palavras-chave relevantes para o negócio; meta de conversão principal (formulário,
  compra, ligação, agendamento); existe site anterior e o que manter/descartar dele.

**Como conduzir:** perguntar por categoria, em blocos pequenos, não as ~30 perguntas de
uma vez. Perguntas de múltipla escolha (tom de voz, densidade de texto, nível de
animação) usam a ferramenta de pergunta estruturada; perguntas abertas (nome da
empresa, palavras-chave, referências) são feitas em texto corrido. Qualquer categoria
já respondida ou claramente não aplicável (ex: site institucional simples não precisa
de pergunta de gateway de pagamento) é pulada. "Não sei / decida por mim" é uma
resposta válida em qualquer pergunta — não deve travar o início do projeto; nesse caso
o agente relevante (`architect` ou `frontend-senior`) decide com base em boas práticas
e registra a decisão explicitamente para validação posterior do cliente.

Ao final da Fase 0, o briefing coletado é salvo em `docs/briefing-cliente.md` no
repositório do projeto do cliente, servindo de insumo direto para `architect` (Fase de
Triagem) e `frontend-senior`.

## Fluxo de orquestração (conteúdo da skill `skills/start/SKILL.md`)

Quando uma tarefa de projeto web é recebida (via `/sasa-web-agents:start`):

0. **Descoberta.** Se for um projeto novo de cliente (ainda sem `docs/briefing-cliente.md`),
   conduzir a Fase 0 descrita acima antes de qualquer outra etapa. Projetos já
   briefados ou tarefas de manutenção pulam direto para o passo 1.
1. **Triagem.** Decidir se a tarefa é grande/estrutural o bastante para exigir o
   `architect` antes de qualquer código (nova stack, nova integração, decisão de banco,
   estratégia de auth, REST vs. GraphQL vs. tRPC, etc). Tarefas pequenas pulam essa
   etapa.
2. **Implementação paralela.** Quando a tarefa toca backend e frontend, disparar
   `backend-senior` e `frontend-senior` em paralelo (background), cada um com escopo
   claro de arquivos/rotas/componentes para evitar conflito.
3. **Qualidade.** Após a implementação, disparar `qa-test-strategy` (escreve testes:
   unitários, integração, e2e) e `ui-ux-accessibility` (audita consistência visual,
   responsividade, WCAG e comportamento das animações) — podem rodar em paralelo entre
   si, pois ambos são consumidores read-mostly do código já implementado.
4. **Revisão final.** `code-reviewer` roda por último, em contexto isolado, somente
   leitura — segurança, performance, correção lógica, aderência a padrões.
5. **Consolidação.** A sessão principal junta os achados de QA, UI/UX e Code Reviewer,
   decide o que precisa de correção antes de considerar a tarefa pronta, e só então
   entrega ao usuário um resultado já revisado — nunca código "cru" sem passar pelo
   gate de revisão.

Tarefas pequenas e de um único arquivo não precisam do fluxo completo — a triagem do
passo 1 decide a profundidade do processo proporcionalmente ao tamanho da mudança.

## Requisitos mínimos de cada agente (nível sênior)

### `architect` — Arquiteto de Software

- **Ferramentas:** somente leitura de código (Read, Grep, Glob, WebSearch/WebFetch) +
  escrita restrita a documentos de decisão (ADRs) — nunca edita código de
  implementação.
- **Entra em ação** antes de decisões estruturais grandes: monólito vs. serviços,
  estilo de API (REST/GraphQL/tRPC), escolha de banco, estratégia de cache, estratégia
  de autenticação (JWT/sessions/OAuth).
- **Padrão sênior:** toda decisão vem acompanhada de um ADR (Architecture Decision
  Record) explicitando alternativas consideradas e o trade-off da escolha — nunca
  apenas "use X". Deve considerar custo, complexidade operacional e o tamanho real do
  projeto (não superdimensionar arquitetura para um site institucional simples).

### `backend-senior` — Backend Sênior

- **Ferramentas:** acesso completo a código (Read, Edit, Write, Bash, Grep, Glob).
- **Padrão sênior obrigatório em toda rota/endpoint:**
  - validação de entrada;
  - tratamento de erro consistente (formato de resposta de erro padronizado);
  - ausência de queries N+1 (usar eager loading / batching);
  - paginação em listagens;
  - rate limiting em endpoints públicos/sensíveis;
  - idempotência em endpoints críticos (pagamento, criação de recursos únicos);
  - secrets sempre fora do código-fonte (variáveis de ambiente);
  - logs estruturados (não `console.log` solto).
- Segue as convenções do framework do projeto (Express, NestJS, Django, Rails,
  Next.js API routes/Route Handlers, etc.) em vez de impor um padrão genérico.
- **Portabilidade:** nunca cria dependência do código de produção em relação à pasta
  `.claude/` (imports, scripts de build, variáveis de ambiente carregadas de lá,
  etc.) — ver "Isolamento entre a infraestrutura de agentes e o código do projeto".

### `frontend-senior` — Frontend Sênior

- **Ferramentas:** acesso completo a código (Read, Edit, Write, Bash, Grep, Glob).
- **Stack padrão:** Next.js + React + TypeScript, salvo indicação em contrário do
  projeto.
- **Padrão sênior de engenharia:**
  - componentização real — nenhum componente com centenas de linhas fazendo tudo;
  - estados de loading/error/empty tratados explicitamente em toda tela que busca
    dados;
  - memoização (`useMemo`/`useCallback`/`React.memo`) aplicada onde há custo real de
    render, não por reflexo;
  - code-splitting e otimização de bundle (dynamic import de rotas/seções pesadas);
  - acessibilidade básica embutida desde a implementação (HTML semântico, foco
    gerenciável, labels).
- **Padrão de interface dinâmica (requisito explícito do usuário, referência: site do
  Lando Norris):**
  - GSAP + ScrollTrigger como biblioteca padrão para animação orientada a scroll;
  - smooth scroll (Lenis ou equivalente) quando o projeto pedir uma experiência
    imersiva;
  - suporte a seções de scroll horizontal e vertical dentro da mesma página, conforme
    a narrativa visual do site pedir;
  - imagens e mídia tratadas como elementos interativos entre si (parallax, reveal
    progressivo, masking, cursor magnético, transforms amarrados à posição de scroll)
    — a interface deve parecer uma peça só, não widgets isolados;
  - performance não é opcional: alvo de 60fps nas animações, uso de transforms
    acelerados por GPU (`transform`/`opacity`, evitar animar propriedades de layout),
    `will-change` usado com moderação;
  - `prefers-reduced-motion` sempre respeitado com uma versão reduzida/estática da
    experiência;
  - imagens otimizadas (`next/image`, lazy loading, formatos AVIF/WebP).
- **Portabilidade:** mesma regra do `backend-senior` — o código do site nunca depende
  da pasta `.claude/` para buildar ou rodar.

### `ui-ux-accessibility` — UI/UX & Acessibilidade

- **Ferramentas:** somente leitura de código + escrita restrita a relatório de
  auditoria — não corrige código diretamente, aponta o que precisa mudar.
- **Padrão sênior:**
  - consistência visual e hierarquia de informação;
  - responsividade em breakpoints mobile/tablet/desktop;
  - auditoria WCAG 2.1 AA: contraste de cor, navegação completa por teclado, uso
    correto de ARIA, alvos de toque com no mínimo 44×44px;
  - **responsabilidade extra dado o padrão visual do time:** validar que scroll
    horizontal e animações GSAP não quebram navegação por teclado nem leitor de tela, e
    que toda animação tem fallback respeitando `prefers-reduced-motion` — o ponto cego
    mais comum em sites com forte apelo visual/artístico.
  - se uma skill de accessibility-review estiver disponível no ambiente, deve ser
    usada; caso não esteja, aplica o checklist WCAG diretamente.

### `qa-test-strategy` — QA / Estratégia de Testes

- **Ferramentas:** acesso completo a código para escrever e rodar testes (Read, Edit,
  Write, Bash, Grep, Glob).
- **Padrão sênior — pirâmide de testes completa:**
  - unitários para lógica de negócio;
  - integração cobrindo API + banco de dados;
  - e2e (Playwright/Cypress) simulando o fluxo real do usuário.
- Cobre ativamente casos de borda, entradas maliciosas e falhas de rede — não só o
  caminho feliz. Para telas com animação pesada, inclui verificação de que a interação
  (clique, scroll, navegação) continua funcional mesmo com a camada de animação GSAP
  ativa.

### `code-reviewer` — Code Reviewer

- **Ferramentas:** somente leitura (Read, Grep, Glob, Bash restrito a comandos de
  leitura/lint/teste) — nunca edita código, só reporta.
- **Padrão sênior:**
  - segurança: injeção SQL, XSS, CSRF, secrets vazados no código ou em logs;
  - performance: queries ineficientes, renders desnecessários, bundles inchados;
  - correção lógica e aderência aos padrões definidos pelos outros agentes do time;
  - roda em contexto isolado do restante do desenvolvimento para dar uma segunda
    opinião genuinamente independente, sem viés de quem escreveu o código.

## Distribuição, instalação e invocação

**`plugin.json` (mínimo, validado contra a documentação oficial de plugins do Claude
Code):**

```json
{
  "name": "sasa-web-agents",
  "description": "Time de agentes sênior para desenvolvimento de sites de cliente, com interfaces dinâmicas (GSAP, scroll horizontal/vertical) e briefing de descoberta embutido",
  "version": "1.0.0",
  "author": { "name": "<nome do usuário>" },
  "homepage": "https://github.com/<usuário>/sasa-web-agents",
  "repository": "https://github.com/<usuário>/sasa-web-agents",
  "license": "MIT"
}
```

**Como qualquer pessoa instala, a partir do GitHub:**

```
/plugin marketplace add <usuário>/sasa-web-agents
/plugin install sasa-web-agents@sasa-web-agents
```

Nota: o sufixo `@` em `/plugin install` é o campo `name` do **próprio
`marketplace.json`**, não o owner/org do GitHub. Como este repositório se
auto-hospeda (`.claude-plugin/marketplace.json` com `"name": "sasa-web-agents"` e
`"source": "./"`), o sufixo correto é sempre `@sasa-web-agents`, independente de quem
fez o fork ou em qual conta do GitHub o repositório está publicado. Evidência: a chave
do plugin `superpowers` instalado nesta máquina, em
`~/.claude/plugins/installed_plugins.json`, é `"superpowers@superpowers-marketplace"` —
que corresponde ao campo `name` de `superpowers-marketplace`'s
`.claude-plugin/marketplace.json`, não ao owner do GitHub (`obra`).

**Como invocar em cada situação** (isso vai para o README):

| Situação | Como invocar |
|---|---|
| Começar um projeto novo de cliente (ainda sem briefing) | `/sasa-web-agents:start` — dispara a Fase 0 de descoberta e, ao final, o fluxo de orquestração completo |
| Retomar/continuar um projeto que já tem `docs/briefing-cliente.md` | `/sasa-web-agents:start` também — a skill detecta o briefing existente e pula direto para a Triagem |
| Consultar um agente específico avulso, fora do fluxo completo (ex: só uma auditoria de acessibilidade num site que não foi feito com o time) | @-menção direta ou Agent tool no agente específico (ex: `ui-ux-accessibility`), sem passar pela skill |
| Tarefa pequena de manutenção num projeto já existente | Não precisa da skill; o usuário pode chamar a sessão normalmente e, se fizer sentido, ela aciona os agentes relevantes diretamente |

**Nota de validação técnica (a confirmar durante a implementação):** a forma exata como
a skill `start` deve referenciar os 6 agentes do próprio plugin ao despachá-los (nome
simples como `architect` vs. nome namespaced) não está 100% documentada e precisa ser
testada empiricamente com o plugin instalado localmente antes da primeira publicação.
Isso é uma tarefa do plano de implementação, não bloqueia a aprovação deste spec.

Publicar o repositório no GitHub (criar o repositório remoto, dar push) é uma ação
visível externamente — fica a critério do usuário decidir quando fazer isso; esta
iniciativa entrega o plugin pronto localmente, versionado neste repositório git, mas
não cria nem publica o repositório remoto sem confirmação explícita.

## Entregáveis desta iniciativa

1. Este documento de spec, commitado neste repositório.
2. Plano de implementação (`/superpowers:writing-plans`).
3. Execução do plano (`/superpowers:subagent-driven-development`), que produz, dentro
   deste mesmo repositório (a raiz do plugin):
   - `.claude-plugin/plugin.json`;
   - os 6 arquivos `agents/*.md` descritos acima;
   - `skills/start/SKILL.md` com a Fase 0 de Descoberta e o fluxo de orquestração;
   - `README.md` explicando o que cada agente faz e como invocar em cada situação;
   - `LICENSE` (MIT).

## Fora de escopo

- Não inclui a criação de nenhum projeto de site real — apenas a infraestrutura de
  agentes reutilizável.
- Não define pipeline de CI/CD, deploy ou hospedagem — cada projeto de cliente decide
  isso individualmente com apoio do `architect` quando chegar a hora.
- Não inclui criar o repositório remoto no GitHub, dar push, nem submeter o plugin a
  nenhum marketplace público — essas são ações de publicação que o usuário dispara
  quando decidir, fora do escopo desta iniciativa.
