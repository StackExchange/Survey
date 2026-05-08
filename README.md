# Stack Overflow Developer Survey

> [!NOTE]
> This is a work in progress, please mind the mess. The 2026 survey will be built here, the current question content is from 2025.

This repository contains the question bank, RFC process, versioning conventions, and tooling for the Stack Overflow Annual Developer Survey. The goal is to make the survey instrument transparent, community-auditable, and longitudinally consistent.

## Table of Contents

- [Questions](./questions/): Store of questions for the survey.
- [Survey](./packages/survey/): Utility for creating, validating and previewing.
- [Archive](./packages/archive/): Historical store of survey releases (CSV, HTML etc).

## Why Open Source the Survey?

The survey is fielded primarily through Stack Overflow’s own channels, which creates a self-selection bias toward already-engaged users. Opening the survey instrument to the community addresses several limitations:

- **Bias in question design**: Community PRs can flag leading or ambiguous wording before fielding
- **Geographic blind spots**: Contributors can propose translations and flag culturally specific assumptions
- **Methodological opacity**: Salary normalisation, multi-select weighting, and question changes are currently buried in short methodology notes
- **Missed coverage**: An open RFC process lets researchers, employers, and educators surface topics the internal team may not prioritise

## Versioning

Survey releases follow a yearly-with-patches scheme:

- `v2026` — initial release of the 2026 survey
- `v2026.1`, `v2026.2`, … — patches and errata on the 2026 survey (corrections, metadata fixes, late clarifications)

### Branches

- `main` — current development; targets the next upcoming survey year.
- `release/YYYY` — long-lived branch per survey year, for patching historical releases.

When a survey year locks, `main` is branched to `release/YYYY` and tagged `vYYYY`. Subsequent patches for that year land on its release branch and are tagged as `.N` revisions. `main` continues toward the next year.

### Question

Each question carries a `version: 'YYYY.N'` field matching the release tag it ships under. Once a question ID appears in a tagged release the ID is frozen — substantially different questions get a new ID (e.g. `q_primary_language_v2`). See the [RFC process](./rfcs/) for details.

## Developing

This project is an [NPM workspace](https://docs.npmjs.com/cli/v8/using-npm/workspaces), most commands are run at the root level.

### Installing

```sh
npm i
```

### Linting & formatting

```sh
npm run lint
npm run format
```

# License & data attribution

Data is published under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/); individual cell contents under the [Database Contents License (DbCL) 1.0](https://opendatacommons.org/licenses/dbcl/1-0/). [In summary](https://opendatacommons.org/licenses/odbl/summary/):

You are free:

- **To share:** To copy, distribute and use the database.
- **To create:** To produce works from the database.
- **To adapt:** To modify, transform and build upon the database.

As long as you:

- **Attribute:** You must attribute any public use of the database, or works produced from the database, in the manner specified in the ODbL. For any use or redistribution of the database, or works produced from it, you must make clear to others the license of the database and keep intact any notices on the original database.
- **Share-Alike:** If you publicly use any adapted version of this database, or works produced from an adapted database, you must also offer that adapted database under the ODbL.
- **Keep open:** If you redistribute the database, or an adapted version of it, then you may use technological measures that restrict the work (such as DRM) as long as you also redistribute a version without such measures.

---

**© Copyright 2026 Stack Exchange, Inc.**

Unless otherwise stated, the contents of this folder are licensed under the [Apache License, Version 2.0](./LICENSE.md)

Unless required by applicable law or agreed to in writing, software distributed under the Apache License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

The Stack Overflow name and logo, and associated brand elements, are the protected property of Stack Exchange, Inc. Acceptable use of Stack Overflow trademarks is governed by: https://policies.stackoverflow.co/company/trademark-guidance/. All other use of Stack Overflow trademarks is prohibited without prior written authorization, including without limitation, any use suggesting unauthorized endorsement by or affiliation with Stack Overflow.
