# Survey generator

Takes the [`/questions`](../../questions) and turns them into this years survey using the flow defined in [`/questions/survey.yaml`](../../questions/survey.yaml).

## Live preview

A respondent-style render of the questions with hot reload for editing the survey.

```bash
npm run dev -w survey
```

## Validation

Validate every question YAML and the survey.yaml flow.

```bash
npm run validate -w survey
```

Three sub-steps run in order; the first failure short-circuits:

| Script               | What it checks                                                                            | How                                                 |
| -------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `validate:questions` | Every `questions/**/*.yaml` against the per-question schema                               | [ajv-cli](https://github.com/ajv-validator/ajv-cli) |
| `validate:survey`    | `questions/survey.yaml` against the flow schema                                           | ajv-cli                                             |
| `validate:cross`     | Filename matches `question.id` (extends to `show_if` and flow reference resolution later) | `scripts/validate.ts`                               |

The schemas live alongside what they validate:

- [`questions/question.schema.json`](../../questions/question.schema.json) — per-question shape.
- [`questions/survey.schema.json`](../../questions/survey.schema.json) — survey flow shape.

## Qualtrics API

Final output of the survey is done via the [Qualtrics API](https://api.qualtrics.com/5d17de1a27084-example-use-cases-walkthrough).

### Sync

`packages/survey/scripts/qualtrics-sync.ts` pushes this YAML into an **existing** Qualtrics survey via the [Survey Definitions API](https://api.qualtrics.com/). It transforms each question with the [type mapping](../../questions/README.md#type-mapping) and reconciles **idempotently keyed on `DataExportTag`** (which equals `question.id` / the filename):

- in YAML, not in the survey → **created**,
- in both → **updated only when the content changed**,
- in the survey, not in YAML → reported as an **orphan**, deleted only with `--prune`.

Qualtrics `QID`s are preserved across runs, so a re-run with no edits is a no-op. New questions are created with a minimal payload and then immediately updated with the full payload (`DataExportTag`, recodes, randomization) — the create-then-update sequence avoids the API's create-time validation errors.

Configure via environment variables (set in a `.env` file at root):

```sh
QUALTRICS_API_TOKEN=...     # X-API-TOKEN
QUALTRICS_DATACENTER=...    # e.g. iad1, fra1, syd1
QUALTRICS_SURVEY_ID=SV_...  # the target existing survey
```

Then, from the repo root:

```sh
npm run sync:qualtrics:dry -w survey           # read-only GET + reconcile, prints WOULD-write actions
npm run sync:qualtrics -w survey               # apply changes
npm run sync:qualtrics -w survey -- --prune    # also delete orphaned questions/blocks
npm run sync:qualtrics -w survey -- --verbose  # per-question decisions
```

With no `QUALTRICS_API_TOKEN`, the script runs **offline** and just prints the transformed payloads — handy for eyeballing the transforms without credentials.

**Phase 1 scope:** questions, blocks, page breaks, and ensuring every block is reachable from the flow (new blocks are appended; existing flow is never rewritten). The flow-level `if/then` branching and the `randomize: N` BlockRandomizer are printed as "not synced yet" and left for a later phase.

### MCP server

[See Qualtrics docs](https://api.qualtrics.com/55231bbc7cd3c-mcp-overview#qualtrics-mcp-servers) for more info.

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
