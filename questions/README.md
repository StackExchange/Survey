# Survey questions

One YAML file per question where the filename matches `question.id`, which is the Qualtrics `DataExportTag` and the stable handle for response data and cross-question references.

The tooling for previewing and building the survey from these files is in **[packages/survey/](../packages/survey/)**.

## Why YAML?

- Human-readable by non-engineers (researchers, PMs, community managers).
- Inline `#` comments make review notes and context easy to preserve.
- Multiline strings handle rationale and context cleanly.
- Widely understood; PRs and reviews feel familiar.
- Machine-parseable into any survey tool or rendering engine.

Every YAML carries a `# yaml-language-server: $schema=…` header, so editors with the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) — VS Code, JetBrains, or Zed — auto-validate as you type.

## Question files

`questions/{block}/{id}.yaml`

Files are grouped into one folder per top-level survey block (`qualifications/`, `education-career/`, `compensation/`, `technology/`, `community/`, `ai/`, `meta/`) for navigation only — tooling discovers them recursively, so the folder name is just for organization.

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
    - label: 'Other (please specify):'
      key: other
      text_entry: true
  tags: [demographics, geography]
  rationale: >
    Tracks year-over-year geographic distribution. First asked in 2011.
  history:
    - { version: '2025.1', changes: 'Added Middle Earth' }
    - { version: '2026.1', changes: 'Renumbered top-10 to use small ids' }
  deprecated: true
```

`tags`, `rationale`, `history`, and `deprecated` are optional enrichment fields.

`title`, option `label`, column `label`, and `scale_labels` are stored as **Markdown** in YAML.

### Option keys

Options are written as bare label strings by default. An option becomes an object when it needs a flag:

- `label` – Markdown label
- `key:` — a stable identifier so the flow's `if/then` blocks can reference this choice
- `text_entry: true` — the "Other (please specify)" free-input choice

Every option has an **implicit key** equal to `snake_case(label)` (via lodash's [`snakeCase`](https://lodash.com/docs/#snakeCase)). An `if/then` block of the form `AIModelsChoice: [no]` works against the bare-string option `- No` because `snakeCase("No") = "no"`. Explicit `key:` is only written when you want a _different_ identifier from the implicit one — typically a hand-shortened name like `daily` or `independent` for a long label. Keys are referenced by `if/then` blocks in `survey.yaml`, so once a question is in production, renaming its keys is a breaking change for any downstream reference.

The YAML is the forward-facing source of truth: it does not carry per-question Qualtrics overrides (`analyzeChoices`, recode mappings, etc.). Qualtrics applies its own defaults when the survey is pushed via the export script.

`randomize: true` means "shuffle the choice order on render, but pin any `text_entry: true` choice (typically `Other (please specify):`) at the end." The export script reconstructs the Qualtrics `Randomization` block from this.

### Validation

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

### Type mapping

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

The canonical lookup lives in `TYPE_TABLE` at the top of [`packages/survey/scripts/qualtrics.ts`](../packages/survey/scripts/qualtrics.ts).

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

## Survey structure

`questions/survey.yaml`

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

Each entry under `pages:` is one of:

- a single question id — `MainBranch`
- a list of ids on the same page — `[Welcome, MetaInfo]`
- an `if: <expr>, then: [...]` block — pages inside `then` render only when `if` is true (see [Conditional flow](#conditional-flow) below)

Question order within the array is the display order.

### Conditional flow

All visibility rules live in `survey.yaml` as `if/then` blocks — there is no per-question `show_if` field. Each `if` is a Boolean expression over respondent answers. Leaves are `{ParentQuestionId: [optionKey, …]}` — true iff the parent's current answer is one of the listed keys. Combine with `any`, `all`, `not`:

```yaml
# Compact: one parent, any-of-these-selected
- if:
    Employment: [employed, retired]
  then:
    - [SomePage]

# Negated: parent NOT one of these
- if:
    not:
      Employment: [prefer_not_to_say]
  then:
    - [EmploymentAddl]

# OR across multiple parents
- if:
    any:
      - Employment: [employed]
      - EmploymentAddl: [hrs_under_10, hrs_10_19, hrs_20_29]
  then:
    - [OrgSize, ICorPM, RemoteWork]

# AND-joined chain
- if:
    all:
      - not:
          AIAgents: [plans_to]
      - not:
          AIAgents: [wont_use]
  then:
    - [AIAgent_Uses, AgentUsesGeneral]
```

Parents are referenced by their question `id`; choices by their option `key` (explicit `key:` on the option, or its implicit `snake_case(label)` slug).

Page-level `if/then` blocks can nest inside another `if/then`'s `then:`. The runtime AND-s the conditions, so a deeply nested page is shown only when every ancestor branch passes.
