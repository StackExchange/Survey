# Contributing

This repo is maintained by Stack Overflow employees, but we welcome the help of others looking to improve the survey for all.

You do not need to know GitHub, YAML, npm, or code to participate in survey-content discussions. Plain-English suggestions are welcome.

## Bugs

If you spot a bug — whether in the results pages, the historical data, the question YAMLs, or the tooling — please [open an issue](../../issues/new). A useful report includes:

- What you saw and what you expected to see.
- A link or path to the page, file, or query that’s wrong (e.g. `questions/compensation/Country.yaml`, `https://survey.stackoverflow.co/2024/...`).
- For data discrepancies, the year and the metric or question id.
- A screenshot or copy-paste of any error message.

For anything sensitive (suspected PII, security issues) please [follow the process here](https://stackexchange.com/about/security).

## Questions

For suggestions about **survey content** — adding a question, rewording one, deprecating one, or restructuring the flow — please [start a Discussion](https://github.com/StackExchange/Survey/discussions) rather than opening a PR or issue. Content changes benefit from community input before they’re worth coding up. Useful posts include:

- The question or change you’re discussing, in plain English.
- Why it matters: who benefits, what gap it fills, what story the data would tell.
- Any prior art (other surveys that ask this, academic work, related Stack Overflow posts).
- If it’s a change to an existing question, how might it affect or improve the year-over-year comparability?

Comments and upvotes on Discussion posts are encouraged. They help signal interest, sharpen wording, and identify tradeoffs. They are not binding votes: the final survey remains at Stack Overflow’s discretion.

## Pull requests

PRs are welcome for:

- **Bug fixes** with a linked issue.
- **Tooling improvements** in `packages/` (importers, validators, results site, analyzer).
- **Documentation fixes** anywhere.

A few conventions that make review faster:

- Keep PRs focused and reasonably sized — one thing per PR. A PR that touches one thing is much easier to review than one that touches many.
- Run `npm run format` before pushing.
- For changes to `questions/`, run `npm run import -w @devsurvey/survey -- /tmp/survey-def.json` (or your own) and check the diff is what you expected.
- How we can test it.
