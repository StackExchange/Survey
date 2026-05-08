# Survey generator

Takes the [`/questions`](../../questions) and turns them into this years survey.

## Live preview

A respondent-style render of the questions with hot reload for editing the survey.

```bash
npm run dev -w survey
```

It walks `survey.yaml`'s `flow` (blocks, pages, randomizers, branches), renders each question type with the right input (radio, checkbox, dropdown, NPS, free text, rank, matrix scale), and evaluates `show_if` live as you answer — selecting `daily` on `AIAgents` reveals the agent follow-ups, etc. Every conditional question carries a per-question notice — green "Shown — because …" when its rule passes, dimmed "Hidden — requires …" when it doesn't — and parent question ids inside the rule are clickable buttons that jump to that question. Options that have an explicit `key:` get a small key badge so you can see what's referenceable from `show_if`.

A page dropdown at the top, grouped by block, lets you skip to any page. Back / Reset answers / Next sit in a fixed footer. Answers and the current page index are kept in `sessionStorage`, so HMR full-reloads (and accidental refreshes) don't bounce you back to page one.

The preview's job is to visualise — required fields and `validate:` rules surface as hints, not blockers.

## Qualtrics API

Final output of the survey is done via the [Qualtrics API](https://api.qualtrics.com/5d17de1a27084-example-use-cases-walkthrough) which has [MCP](https://api.qualtrics.com/55231bbc7cd3c-mcp-overview#qualtrics-mcp-servers) support.

1. Visit the [Oauth credentials page from the dashboard](https://stackoverflow.pdx1.qualtrics.com/admin/oauth-client-manager)
2. Create client
3. Add a name
4. Scopes required: `openid`, `manage:surveys`, `write:surveys`, `read:surveys`
5. Grant Type: `Authorization code`
6. Redirect URLs: `http://localhost:8080`
7. Create the client
8. For Claude add your generated `clientId` below and enter into the terminal for [MCP setup](https://code.claude.com/docs/en/mcp#claude-mcp-add-json)

```bash
claude mcp add-json qualtrics \
  '{"type":"http","url":"https://stackoverflow.pdx1.qualtrics.com/API/mcp/survey-definitions","oauth":{"clientId":"your-client-id","callbackPort":8080}}' \
  --client-secret
```

## Scripts

Run from the repo root (npm workspaces). Reads `QUALTRICS_API` and `QUALTRICS_SURVEY_WRITE` from the repo-root `.env`.

```bash
# Push the YAMLs to a Qualtrics survey you've already created by hand.
# The script updates only - it never creates a new survey.
QUALTRICS_SURVEY_WRITE=SV_xxxxxxxxxxxxxxx npm run export -w survey

# Dry run - log planned changes, no API writes
npm run export -w survey -- --dry-run
```

> **The export script is a placeholder.** The TODO block at the top of [`scripts/qualtrics.ts`](./scripts/qualtrics.ts) sketches the planned sync. The CLI plumbing and YAML loading work; the actual API writes are not implemented yet.

```bash
# Validate every question YAML and the survey.yaml flow.
npm run validate -w survey
```

Three sub-steps run in order; the first failure short-circuits:

| Script               | What it checks                                                                            | How                                                 |
| -------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `validate:questions` | Every `questions/**/*.yaml` against the per-question schema                               | [ajv-cli](https://github.com/ajv-validator/ajv-cli) |
| `validate:survey`    | `packages/survey/survey.yaml` against the flow schema                                     | ajv-cli                                             |
| `validate:cross`     | Filename matches `question.id` (extends to `show_if` and flow reference resolution later) | `scripts/validate.ts`                               |

The schemas live alongside what they validate:

- [`questions/question.schema.json`](../../questions/question.schema.json) — per-question shape.
- [`packages/survey/survey.schema.json`](./survey.schema.json) — survey flow shape.

Every YAML carries a `# yaml-language-server: $schema=…` header, so editors with the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) (VSCode), JetBrains, or Zed auto-validate as you type — no command needed.

## File layout

There are two halves to the format:

### `questions/{block}/{id}.yaml` — one file per question

Human-edited content. Filename matches `question.id`, which is the `DataExportTag` in Qualtrics. Files are grouped into one folder per top-level survey block (e.g. `qualifications/`, `tech-and-tech-culture/`) for navigation only — tooling discovers them recursively, so the folder name is not load-bearing.

`title`, option `label`, column `label`, and `scale_labels` are stored as **Markdown** in YAML. The importer converts Qualtrics' HTML to Markdown via [turndown](https://github.com/mixmark-io/turndown); the post-back script reverses with [marked](https://github.com/markedjs/marked). Qualtrics renders the resulting HTML the same way regardless of byte-level differences, so round-trips don't need to preserve the exact tag layout. Use `**bold**`, `*italic*`, `[text](url)`, and `- ` lists.

```yaml
# yaml-language-server: $schema=../question.schema.json
question:
  id: AIAgentOrchWrite
  version: '2025.1'
  title: Was the tool or tools for AI agent orchestration not listed above? ...
  type: free_text
  required: false
  lines: single
  options:
    - When I'm stuck and can't explain the problem # bare string: just a label
    - When I want to fully understand something
    - { label: 'Other (please specify):', text_entry: true } # object: free input
  show_if:
    AIAgents: [daily, weekly, monthly] # references parent options' `key`s
```

`tags`, `rationale`, `history`, and `deprecated` are optional enrichment fields — omit them when they'd be empty. Add as needed:

```yaml
question:
  id: SomeQuestion
  # ...
  tags: [demographics, geography]
  rationale: >
    Tracks year-over-year geographic distribution. First asked in 2011.
  history:
    - { version: '2025.1', changes: 'Added Middle Earth' }
    - { version: '2026.1', changes: 'Renumbered top-10 to use small ids' }
  deprecated: true
```

### Option keys

Options are written as bare label strings by default. An option becomes an object when it needs a flag:

- `key:` — a stable identifier so other questions can reference this choice in their `show_if`
- `text_entry: true` — the "Other (please specify)" free-input choice

Every option has an **implicit key** equal to `slugify(label)` (lowercased, snake*cased). `show_if: AIModelsChoice: [no]` works against the bare-string option `- No` because `slugify("No") = "no"`. Explicit `key:` is only written when you want a \_different* identifier from the implicit one — typically a hand-shortened name like `daily` or `independent` for a long label. Auto-import generates the long form (`yes_i_use_ai_agents_at_work_daily`); rename it once after import. **Re-running the importer overwrites your renames**, so finalize keys after the initial import.

The YAML is the forward-facing source of truth, so per-question Qualtrics overrides (custom configuration, `analyzeChoices`, recode mappings, randomization quirks we can't simplify, etc.) are dropped on import — Qualtrics will use its own defaults at post-back time. The importer logs every dropped override to stderr so you see what wasn't kept.

`randomize: true` means "shuffle the choice order on render, but pin any `text_entry: true` choice (typically `Other (please specify):`) at the end." The post-back script reconstructs the full Qualtrics `Randomization` block from this. For more exotic randomization (sub-sets, scale reversal, even presentation), the importer falls back to a raw `qualtrics.randomization` block.

## Input validation (`validate:`)

For free-text questions that need content checks, write a flat [Zod-style](https://zod.dev/) descriptor:

```yaml
validate: { type: number, min: 1, max: 100 }
validate: { type: number, min: 0 }              # max omitted = unbounded
validate: { type: number, min: 0, max: 10, decimals: 2 }
validate: { type: email }
validate: { type: phone }
validate: { type: zip }
validate: { type: date }
```

Supported `type` values: `number`, `email`, `phone`, `zip`, `date`. The post-back script translates these to Qualtrics `Validation.Settings` and automatically attaches the AI text-analysis checks listed under `defaults.ai_text_checks` in `survey.yaml`.

Questions in the Qualtrics "Trash" block are imported with `deprecated: true` and excluded from the active flow.

### `packages/survey/survey.yaml` — the survey structure

The flow, block grouping, page grouping, branching, randomization, and embedded data are defined once here. Question content lives in `questions/`.

```yaml
flow:
  - block: Qualifications
    pages:
      - [Welcome, MetaInfo] # multiple ids = same page
      - [MainBranch]
      - [Age]
      - [Consent]
  - block: Education + Career
    pages:
      - [EdLevel, Employment]
      - [OrgSize, ICorPM, RemoteWork]
      # … more pages
  - block: Compensation
    pages:
      - [Country, Currency, CompTotal]
  # present `randomize` of the listed blocks per respondent in random order
  - randomize: 3
    even_presentation: true
    blocks:
      - block: Tech and Tech Culture
        pages: [...]
      - block: Community
        pages: [...]
      - block: AI + AI Agents
        pages: [...]
  - block: Final Thoughts
    pages:
      - [SurveyLength, SurveyEase, SurveyIssues]
```

Each entry under `pages:` is a single page; multiple ids in one entry means those questions render on the same page. Question order within the array is the display order.

## Type mapping

The friendly `type` (and optional `display` / `lines` modifiers) maps deterministically to the Qualtrics question-type triple. The post-back script translates one to the other; no per-question YAML needs to carry these values.

| `type`          | modifier            | QuestionType | Selector | SubSelector    |
| --------------- | ------------------- | ------------ | -------- | -------------- |
| `single_select` | _(default)_         | MC           | SAVR     | TX             |
| `single_select` | `display: dropdown` | MC           | DL       | _none_         |
| `multi_select`  | _(default)_         | MC           | MAVR     | TX             |
| `nps`           | _(default)_         | MC           | NPS      | _none_         |
| `free_text`     | `lines: single`     | TE           | SL       | _none_         |
| `free_text`     | `lines: multi`      | TE           | ML       | _none_         |
| `rank`          | _(default)_         | RO           | DND      | TX             |
| `scale`         | `multiple: false`   | Matrix       | Likert   | SingleAnswer   |
| `scale`         | `multiple: true`    | Matrix       | Likert   | MultipleAnswer |
| `display`       | _(default)_         | DB           | TB       | _none_         |
| `meta`          | _(default)_         | Meta         | Browser  | _none_         |

The canonical lookup lives in `TYPE_TABLE` at the top of `scripts/qualtrics.ts`.

### Scale (matrix) questions

A `scale` question is a grid: `options` are the rows, `scale.columns` are the column labels.

```yaml
type: scale
scale:
  multiple: false # one column pick per row (true = checkbox grid)
  columns:
    - Strongly agree
    - Somewhat agree
    - Neutral
    - Somewhat disagree
    - Strongly disagree
options: [...] # the rows
```

Scales are inlined per-question rather than defined centrally. Duplication across questions that share a scale is intentional — each question stays self-contained, and the survey is small enough that the cost is modest.

## Conditional questions (`show_if`)

`show_if` mirrors Qualtrics' display logic. Each leaf is "this parent question has (or doesn't have) one of these choices selected." Parents are referenced by their `id`; choices are referenced by their `key` (the slug on the parent's option). The format scales from compact to explicit:

```yaml
# Compact: one parent, all-Selected, OR-joined
show_if:
  Employment: [employed, retired]

# Negated: one parent, NotSelected
show_if:
  not:
    Employment: [i_prefer_not_to_say]

# OR across multiple parents or mixed Selected/NotSelected
show_if:
  any:
    - { Employment: [employed] }
    - { EmploymentAddl: [paid_work_less_than_10_hours, paid_work_10_19_hours] }
    - { not: { Industry: [other] } }

# AND-joined chain (e.g. "show only when neither X nor Y is selected")
show_if:
  all:
    - { not: { AIAgents: [no_but_i_plan_to] } }
    - { not: { AIAgents: [no_and_i_don_t_plan_to] } }
```

For larger conditional sections (a whole branch of follow-up questions), prefer hoisting the condition to a `branch:` element in the survey-flow rather than repeating `show_if` on each question. The importer creates per-question `show_if` for everything; consolidating into branches is a manual cleanup.

## To-do

- [ ] Implement the actual sync in `scripts/qualtrics.ts` (currently a placeholder)
- [ ] Cross-question validation: `show_if` references, flow references, deprecation warnings
- [ ] Hoist `show_if` runs into block-level `branch:` elements in `survey.yaml`
- [ ] Wire `npm run validate` into CI
