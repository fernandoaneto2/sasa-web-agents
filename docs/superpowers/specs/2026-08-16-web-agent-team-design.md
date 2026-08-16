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

## Decisões de escopo

- **Agentes executáveis, não só documentação.** O resultado final são subagentes reais
  do Claude Code (`.claude/agents/*.md`), invocáveis via Agent tool, não apenas uma
  descrição textual de requisitos.
- **Escopo global.** Os agentes ficam em `~/.claude/agents/`, disponíveis em qualquer
  projeto/cliente futuro na máquina — não amarrados a este repositório.
- **Tech Lead não é um subagente separado.** A orquestração (decompor tarefa, decidir
  quem chamar e em que ordem, disparar trabalho em paralelo, consolidar resultado) é o
  papel que a própria sessão principal do Claude Code já exerce ao usar a ferramenta
  Agent. Criar um subagente "tech-lead" que por sua vez chama outros subagentes
  adicionaria uma camada de indireção sem benefício real. Em vez disso, o comportamento
  de orquestração é documentado como instrução permanente em `~/.claude/CLAUDE.md`.
- **Stack padrão para sites de cliente:** Next.js + React + TypeScript. GSAP (com
  ScrollTrigger) é a biblioteca padrão de animação; Lenis (ou equivalente) para smooth
  scroll. Esse padrão pode ser ajustado caso a caso por projeto, mas é o ponto de
  partida assumido pelo Frontend Sênior e cobrado pelo UI/UX.

## Arquitetura

```
~/.claude/
├── CLAUDE.md                  (instruções globais existentes + novo bloco
│                                "Orquestração de Projetos Web")
└── agents/
    ├── architect.md
    ├── backend-senior.md
    ├── frontend-senior.md
    ├── ui-ux-accessibility.md
    ├── qa-test-strategy.md
    └── code-reviewer.md
```

Cada arquivo de agente segue o formato padrão de subagente do Claude Code:
frontmatter (`name`, `description`, `tools`, opcionalmente `model`) seguido do prompt
de sistema do agente.

## Fluxo de orquestração (bloco a ser adicionado no CLAUDE.md global)

Quando uma tarefa de projeto web é recebida:

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

## Entregáveis desta iniciativa

1. Este documento de spec, commitado neste repositório.
2. Plano de implementação (`/superpowers:writing-plans`).
3. Execução do plano (`/superpowers:subagent-driven-development`), que produz:
   - os 6 arquivos `~/.claude/agents/*.md` descritos acima;
   - o novo bloco "Orquestração de Projetos Web" em `~/.claude/CLAUDE.md`.

## Fora de escopo

- Não inclui a criação de nenhum projeto de site real — apenas a infraestrutura de
  agentes reutilizável.
- Não define pipeline de CI/CD, deploy ou hospedagem — cada projeto de cliente decide
  isso individualmente com apoio do `architect` quando chegar a hora.
