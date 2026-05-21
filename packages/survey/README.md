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

## Qualtrics sync

Coming soon…
