![Stack Overflow Developer Survey](https://github.com/user-attachments/assets/b77c3ec9-a097-4359-b9d9-a4cf06288212)

# Stack Overflow Developer Survey

This repository contains the public question bank, survey flow, validation schemas, preview tooling, and historical archive for the Stack Overflow Annual Developer Survey. The goal is to make the survey instrument easier to inspect, discuss, improve, and maintain over time.

You can view the current live survey preview at [stackoverflow-survey-preview.netlify.app](https://stackoverflow-survey-preview.netlify.app/). It reflects the latest deployed copy of the survey preview from this repository.

## Start here

You do not need to know GitHub, YAML, npm, or code to help shape the survey.

If you want to suggest a question, answer option, wording change, or insight for the 2026 survey, start a post in [GitHub Discussions](https://github.com/StackExchange/Survey/discussions). You can write it in plain English. Comments, refinements, and upvotes on other suggestions are also helpful because they show where there is community interest or concern.

Stack Overflow reviews suggestions and community feedback, but inclusion in the final survey is at Stack Overflow's discretion. Some good ideas may not fit the survey's scope, timing, methodology, legal/privacy requirements, or need for year-over-year comparability.

### Example suggestion

```text
Title: Ask whether developers are using AI agents in production workflows

Suggestion:
Add a question about whether respondents use AI agents for production work,
experimentation, learning, or not at all.

Why this matters:
The current AI conversation often mixes casual use with production use. This
would help readers understand how widely agentic tools are actually embedded
in day-to-day professional work.

Possible answers:
- Yes, for production work
- Yes, for experiments or prototypes
- Yes, for learning or personal projects
- No, but I plan to
- No, and I do not plan to
```

## What is in this repo?

- [questions/](./questions/) — YAML source files for survey questions, plus the top-level [`questions/survey.yaml`](./questions/survey.yaml) flow definition.
- [packages/survey/](./packages/survey/) — Svelte/Vite tooling for previewing the survey, validating YAML, and preparing the survey for Qualtrics.
- [packages/results/](./packages/results/) — The results site for the current survey year, built from the question bank, the year's data export, and editorial copy.
- [packages/archive/](./packages/archive/) — Historical survey releases, including results data, schemas, PDFs, and static result pages.

## Help shape the 2026 survey

We welcome community recommendations for questions, answer choices, wording changes, and insights the survey should be able to produce this year.

For survey content ideas, please start with [GitHub Discussions](https://github.com/StackExchange/Survey/discussions) rather than opening a pull request right away. A good Discussion gives the community and maintainers room to refine the idea before anyone turns it into YAML.

Useful suggestions usually include:

- The question, answer option, or insight you want the survey to capture.
- Why it matters and who would use the result.
- Whether it is new, replaces an existing question, or changes wording/options.
- Any prior art, such as related research, other surveys, or past Stack Overflow survey results.
- For changes to recurring questions, how the change affects year-over-year comparability.

Comments and upvotes on suggestions are encouraged. They help signal interest, identify unclear wording, and surface tradeoffs. They are not votes that automatically determine the final survey; Stack Overflow is responsible for the final instrument.

Use issues for bugs and PRs for focused implementation or documentation changes. See [CONTRIBUTING.md](./CONTRIBUTING.md) for more detail.

## How the survey is modeled

Questions live as individual YAML files under `questions/{section}/{QuestionId}.yaml`. Each file's `question.id` is the stable handle used for response data and cross-question references.

The survey order and branching live in [`questions/survey.yaml`](./questions/survey.yaml). The flow file defines blocks, pages, randomization, and `if/then` logic. Conditional visibility is centralized there rather than stored on individual question files.

See [questions/README.md](./questions/README.md) for the YAML format, option keys, validation descriptors, question type mapping, and survey flow syntax.

## Local development

This project is an [npm workspace](https://docs.npmjs.com/cli/using-npm/workspaces). Install dependencies from the repo root:

```sh
npm install
```

Run the live survey preview:

```sh
npm run dev -w survey
```

Validate the question files and survey flow:

```sh
npm run validate -w survey
```

Check formatting:

```sh
npm run lint
```

Apply formatting:

```sh
npm run format
```

The survey package also includes:

```sh
npm run check -w survey
npm run build -w survey
npm run gen:types -w survey
```

Run the live survey result site preview:

```sh
npm run dev -w results
```

## Process

1. **Gather** — Stack Overflow decides what ships, including suggestions in [Discussions](https://github.com/StackExchange/Survey/discussions).
2. **Author** — `questions/{section}/{QuestionId}.yaml`, flow in [`questions/survey.yaml`](./questions/survey.yaml). Dropped questions move to `questions/retired/` rather than being deleted, so their IDs stay claimed.
3. **Check** — `npm run validate -w survey`; `npm run dev -w survey` to walk the flow; `npm run gen:types -w survey` after a schema change.
4. **Field** — `npm run sync:qualtrics:dry -w survey`, then `npm run sync:qualtrics -w survey`.
5. **Build** — the export lands in `packages/archive/<year>/json/`, copy syncs with `npm run content -w results`, `npm run dev -w results` previews. On `main`, while the survey is in the field.
6. **Publish** — merging to `main` is what goes live, so the order matters:
   1. Merge into `main` with `--no-ff`.
   2. Cut `releases/YYYY` there and push **the branch first** — the site links to its Netlify deploy.
   3. The archive should be at `releases-YYYY.questions.survey.stackoverflow.co`
   4. Push `main`. The site is live.
7. **Wind down** — `results.csv`, `schema.csv` and `survey.pdf` land on `main` whenever they are ready after release; `/YYYY/results.csv` redirects to `main`, so nothing needs to be on the release branch for the download to work. Add the year's row to [`index.json`](./packages/archive/index.json) and the archive [README](./packages/archive/README.md). Corrections keep merging into `releases/YYYY` until `main` turns to the next year.

## Versioning

Feature branches merge into `main` as usual. Each year gets one branch — `releases/YYYY` — cut from `main` at the results release, open for corrections until `main` turns to the next year, and holding that year's final state from then on.

**Release branches are never deleted:** the results site links every question into the branch's Netlify deploy. See [packages/survey](./packages/survey/README.md#deployed-preview).

`releases/v2025-questions` predates this. 2025 ran from a previous repository, so it holds only the imported question bank.

Each question carries `version: 'YYYY.N'` — the survey year, and a revision that resets with it. Bump `N` when changing a question that has already shipped; authoring edits do not count. IDs freeze at the same point, so a change that breaks comparison with earlier answers gets a new ID instead.

## Why open the survey instrument?

The survey is fielded primarily through Stack Overflow's own channels, which means the respondent pool is self-selecting and weighted toward already-engaged users. Opening the instrument helps the community review and improve it before fielding.

This is especially useful for:

- Flagging ambiguous or leading wording.
- Identifying missing answer choices.
- Surfacing geographic, cultural, or professional blind spots.
- Preserving longitudinal comparability when questions change.
- Making methodology and survey structure easier to audit.

## License and data attribution

Data is published under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/); individual cell contents are published under the [Database Contents License (DbCL) 1.0](https://opendatacommons.org/licenses/dbcl/1-0/).

In summary, you are free to share, create, and adapt the database as long as you attribute it, preserve the license notice, share adapted databases under the ODbL, and keep redistributed database versions open.

---

**© Copyright 2026 Stack Exchange, Inc.**

Unless otherwise stated, the contents of this repository are licensed under the [Apache License, Version 2.0](./LICENSE.md).

Unless required by applicable law or agreed to in writing, software distributed under the Apache License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

The Stack Overflow name and logo, and associated brand elements, are the protected property of Stack Exchange, Inc. Acceptable use of Stack Overflow trademarks is governed by the [Stack Overflow trademark guidance](https://policies.stackoverflow.co/company/trademark-guidance/). All other use of Stack Overflow trademarks is prohibited without prior written authorization, including without limitation any use suggesting unauthorized endorsement by or affiliation with Stack Overflow.
