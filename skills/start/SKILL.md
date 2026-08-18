---
name: start
description: Use to kick off or resume a client web project with the sasa-web-agents team — runs the client discovery briefing (once per project) then orchestrates architect, backend-senior, frontend-senior, qa-test-strategy, ui-ux-accessibility, code-reviewer, and consolidator through triage, parallel implementation, quality, review, and consolidation.
---

# sasa-web-agents: start

You are acting as the Tech Lead for a client web project built with the sasa-web-agents team: `architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`, `consolidator`. You orchestrate them directly using the Agent tool — you do not delegate orchestration itself to a subagent.

## Step 0 — Discovery (once per new client project)

Check whether `docs/briefing-cliente.md` already exists in the current project.

- **If it exists:** read it, treat it as current, and skip straight to Step 1 (Triage). Do not re-ask questions already answered there.
- **If it doesn't exist and this is a new client project:** run the discovery briefing below before touching any code.

### How to ask

Default to the structured multiple-choice question tool (chip/checkbox picker) for every question below — the client marks options, they don't type answers. Batch by category, up to 4 questions per tool call (its hard limit), and never dump all ~30 questions in one message. Each question below already lists its options (max 4 each, the tool's hard limit); `multiSelect` is called out where more than one answer can apply. The tool always offers a free-text "Other" escape hatch on top of the listed options, so nothing is ever a dead end — use it for anything not covered by the options (a specific color hex, an extra page name, a gateway not listed). Only the handful of questions marked **(texto livre)** skip the picker entirely — they ask for a proper noun (company name, competitor names, keywords) that no fixed option list could cover. Skip any category that's clearly not applicable (e.g. don't ask about payment gateways for a simple institutional site). "Não sei / decisão da equipe" is offered as an explicit option on most questions — when picked, the relevant agent (`architect` or `frontend-senior`) decides using best practice and records the decision explicitly in its output for the client to validate later. Never let an unanswered question block starting the project.

### Categories and questions

**Negócio & objetivo** (feeds `architect`):
- Nome da empresa/marca? **(texto livre)**
- Ramo de atuação — o que a empresa faz? **(texto livre)** — a fixed list can't cover every business type; ask as one short open question.
- Objetivo principal do site? → MC, multiSelect: Institucional / Geração de leads / Venda online (e-commerce) / Portfólio — "Other" covers agendamento or a goal not listed.
- Público-alvo? → MC, multiSelect: B2B (empresas) / B2C (consumidor final) / Ambos / Ainda não definido.
- Principais concorrentes ou referências de mercado? **(texto livre)** — specific company/site names.
- Diferencial competitivo / proposta de valor? → MC, multiSelect: Preço competitivo / Qualidade ou atendimento superior / Inovação e tecnologia / Marca e reputação — "Other" for anything more specific.

**Identidade visual & marca** (feeds `frontend-senior`, `ui-ux-accessibility`):
- Já existe marca/logo pronta? → MC: Sim, em vetor (AI/SVG) / Sim, só em PNG ou JPG / Não, precisa ser criada / Não sei.
- Existe manual de marca / guia de estilo? → MC: Sim, completo / Sim, parcial / Não existe.
- Paleta de cores? → MC: Já tenho paleta definida (informar via "Other") / Quero algo minimalista e neutro / Quero algo vibrante e colorido / Decisão da equipe.
- Tipografia? → MC: Serifada clássica / Sans-serif moderna e limpa / Display expressiva/autoral / Decisão da equipe.
- Personalidade da marca? → MC, multiSelect (pick as many as apply): Séria e confiável / Descontraída e acessível / Ousada e inovadora / Sofisticada e premium.

**Conteúdo & copy** (feeds `frontend-senior`):
- O copy já está pronto? → MC: Pronto / Parcialmente pronto / Precisa ser escrito do zero.
- Tom de voz desejado? → MC: Formal / Descontraído / Técnico / Inspirador.
- Densidade de texto por seção? → MC: Mais textual/explicativo / Equilibrado / Minimalista (visual conduz a mensagem).
- Idiomas do site? → MC, multiSelect: Português / Inglês / Espanhol — "Other" for any idioma adicional.

**Mídia & assets** (feeds `frontend-senior`):
- Existem fotos/vídeos próprios de qualidade profissional? → MC: Sim, tenho tudo que preciso / Tenho parcialmente / Não tenho nada.
- Precisa de banco de imagens ou geração de imagem? → MC: Banco de imagens (stock) / Geração de imagem por IA / Já tenho o que preciso / Não sei.
- Existem vídeos institucionais ou materiais de campanha reaproveitáveis? → MC: Sim / Não / Não sei.
- Há necessidade de galeria/portfólio com múltiplas imagens por item? → MC: Sim / Não.

**Estrutura & funcionalidades** (feeds `architect`, `backend-senior`):
- Páginas/seções essenciais? → MC, multiSelect: Home / Sobre / Serviços ou produtos / Contato — "Other" for anything not listed.
- Páginas/seções adicionais? → MC, multiSelect: Blog / Portfólio ou galeria / FAQ / Depoimentos — "Other" for anything not listed.
- Precisa de formulário de contato/orçamento? → MC: Sim, formulário simples / Sim, formulário detalhado (orçamento) / Não precisa.
  - Se sim, quais campos? → MC, multiSelect: Nome e e-mail / Telefone/WhatsApp / Empresa e cargo / Mensagem livre — "Other" for extras (upload de arquivo, etc.).
- Precisa de integrações? → MC, multiSelect: CRM / WhatsApp / E-mail marketing / Agendamento online — "Other" for anything else (pagamento is covered by the e-commerce question below).
- Precisa de blog/CMS editável pelo próprio cliente? → MC: Sim / Não / Não sei.
- Precisa de área logada? → MC: Sim / Não.
- É e-commerce? → MC: Sim / Não.
  - Se sim, qual gateway de pagamento? → MC: Mercado Pago / Stripe / PagSeguro / Ainda não decidido — "Other" for a gateway not listed. Also ask quantidade aproximada de produtos as free text (a number, not a fixed choice).

**Estilo de interação & experiência** (feeds `frontend-senior`, `ui-ux-accessibility`):
- Nível de animação desejado? → MC: Altamente animada e imersiva (estilo Lando Norris) / Equilíbrio entre animação e sobriedade / Sóbria e institucional, pouca animação / Decisão da equipe.
- Há seção que pede scroll horizontal (portfólio, timeline, produtos)? → MC: Sim / Não / Não sei, decisão da equipe.
- Existe conteúdo que se beneficia de storytelling visual (scrollytelling de processo, linha do tempo, cases)? → MC: Sim / Não / Não sei, decisão da equipe.
- Sites de referência que o cliente admira? → MC: Sim, vou informar (use "Other" to name them) / Não tenho referências específicas / Prefiro que a equipe pesquise referências.

**Técnico & operacional** (feeds `architect`):
- Já existe domínio/hospedagem contratados? → MC: Sim, ambos / Só domínio / Não tenho nenhum / Não sei.
- Quem vai manter o site depois do lançamento? → MC: O cliente, via CMS/editor visual / Sempre via desenvolvedor / Não sei ainda.
- Prazo desejado? → MC: Até 2 semanas / 2 a 4 semanas / 1 a 2 meses / Sem prazo definido.
- Orçamento de referência? → MC: Até R$5.000 / R$5.000–15.000 / R$15.000–30.000 / Acima de R$30.000 — "Other" covers "prefiro não informar".

**SEO & metas de conversão** (feeds `architect`, `qa-test-strategy`):
- Já tem palavras-chave definidas? → MC: Sim, vou informar (use "Other" to list them) / Não, quero sugestão da equipe / Não sei o que é isso.
- Meta de conversão principal? → MC: Formulário de contato / Compra online / Ligação telefônica / Agendamento.
- Existe site anterior? → MC: Sim, quero manter conteúdo/SEO dele / Sim, mas quero refazer do zero / Não existe site anterior.

### After discovery

Save everything collected to `docs/briefing-cliente.md` in the client's project repository, organized by the categories above. This file is the direct input for `architect` and `frontend-senior` going forward.

Also make sure the project's folder structure keeps `.claude/` (if versioned at all) as a sibling of the site's source code, never containing it — see the portability rule below.

## Step 1 — Triage

Decide whether this task is big/structural enough to need `architect` before any code: new stack, new integration, database decision, auth strategy, REST vs. GraphQL vs. tRPC, etc. Small tasks skip straight to Step 2.

If `architect` is needed, dispatch it and wait for its ADR(s) in `docs/adr/` before proceeding.

## Step 2 — Parallel implementation

When the task touches both backend and frontend, dispatch `backend-senior` and `frontend-senior` in the background, in parallel, each with a clear, non-overlapping scope of files/routes/components to avoid conflicts.

## Step 3 — Quality

Once implementation is done, dispatch `qa-test-strategy` (writes unit/integration/e2e tests) and `ui-ux-accessibility` (audits visual consistency, responsiveness, WCAG, and animation accessibility) — these can run in parallel with each other, since both are read-mostly consumers of the code that was just implemented.

## Step 4 — Final review

Dispatch `code-reviewer` last, in an isolated context, read-only — security, performance, logical correctness, adherence to the team's standards.

## Step 5 — Consolidate

Do not read `docs/audits/*.md` or any other on-disk QA/audit artifact yourself. Dispatch `consolidator`, passing it inline whatever `qa-test-strategy` and `code-reviewer` already returned in Steps 3–4, plus the path to the on-disk report `ui-ux-accessibility` wrote (e.g. `docs/audits/ui-ux-accessibility-<date>.md`). It reads that report directly, in its own isolated context, and returns one compact, prioritized fix list.

Decide what from that list must be fixed before considering the task done. Only then report the result back to the user — never hand over unreviewed ("raw") code.

Small, single-file tasks don't need the full flow — Step 1's triage sets how much of this process a given task actually needs.

## Model policy

All seven subagents (`architect`, `backend-senior`, `frontend-senior`, `ui-ux-accessibility`, `qa-test-strategy`, `code-reviewer`, `consolidator`) are pinned to `model: sonnet`. None are downgraded to `haiku` — every one of them produces or judges senior-level code, architecture, or review output, which benefits from stronger reasoning than a classification/summarization model provides. None are escalated to `opus` — nothing in this team's current scope (client web projects: architecture decisions, implementation, tests, accessibility audits, code review) has shown a need for it, and doing so would raise cost without a matching quality requirement. Revisit only if a future task class clearly needs the extra capability.

## Portability rule (applies to every project this skill touches)

Client site code must never depend on `.claude/` to build, run, or deploy. If the user versions a project-local `.claude/` folder, it stays a sibling of the site's source code, never inside it. This is what keeps a client's repository safely shareable on GitHub, independent of the user's personal Claude Code / sasa-web-agents tooling. See `backend-senior` and `frontend-senior` for the same rule stated as their acceptance criteria.
