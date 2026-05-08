# Survey questions

One YAML file per question. The filename matches `question.id`, which is the Qualtrics `DataExportTag` and the stable handle for response data and cross-question references.

The file format, type system, validation rules, and tooling are documented in the survey package README:
**[packages/survey/README.md](../packages/survey/README.md)**

Editor support is automatic — every YAML carries a `# yaml-language-server: $schema=../question.schema.json` header, so VSCode (with the Red Hat YAML extension), JetBrains, and Zed validate as you type.

## Why YAML?

- Human-readable by non-engineers (researchers, PMs, community managers).
- Inline `#` comments make RFC annotation natural.
- Multiline strings handle rationale and context cleanly.
- Widely understood; PRs and reviews feel familiar.
- Machine-parseable into any survey tool or rendering engine.

## Deprecation, not deletion

Questions are never removed from the repository. To retire one, set `deprecated: true` on the question and remove its references from `packages/survey/survey.yaml`. The file stays in `main`, preserving the historical record. RFCs that retire a question should explain why in `rationale:` and add a `history:` entry.

```yaml
question:
  id: q_blockchain_usage
  # ...
  deprecated: true
  rationale: >
    Retired after consistent sub-5% response rates across 3 years.
    See RFC-2026-003.
  history:
    - { version: '2026.1', changes: 'Deprecated; superseded by q_distributed_systems' }
```
