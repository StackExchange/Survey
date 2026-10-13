# Stack Overflow Developer Survey 2026 — Data & files

This folder contains the public archive for the 2026 Stack Overflow Developer Survey. View the [2026 results](https://survey.stackoverflow.co/2026), or follow the instructions below to run an interactive copy of the survey questionnaire on your own machine.

The interactive questionnaire shows the questions, answer options, and branching logic. It serves as the survey instrument archive in place of a PDF.

## Files and source

- [survey_results_public.csv](./survey_results_public.csv) — public response data.
- [survey_results_schema.csv](./survey_results_schema.csv) — documentation for the response data columns.
- [json/](./json/) — chapter-level data used by the results website.
- [2026 question bank](https://github.com/StackExchange/Survey/tree/releases/2026/questions) — questionnaire wording, answer options, and survey flow.
- [2026 preview application](https://github.com/StackExchange/Survey/tree/releases/2026/packages/survey) — code that renders the interactive questionnaire.

The CSV files are for data analysis. Running the questionnaire preview requires the repository's question files and application code; it does not require the CSV files.

## Run the 2026 questionnaire locally

Install **Node.js 24** (with npm), **Git**, and use a terminal. The repository's `.nvmrc` specifies the Node.js version.

1. Download the archived 2026 source:

   ```sh
   git clone --branch releases/2026 --single-branch https://github.com/StackExchange/Survey.git Survey-2026
   cd Survey-2026
   ```

   Alternatively, [download the 2026 source ZIP](https://github.com/StackExchange/Survey/archive/refs/heads/releases/2026.zip), extract it, and open a terminal in the extracted folder containing `package.json`. This option does not require Git.

2. Install dependencies from that folder:

   ```sh
   npm ci
   ```

3. Start the questionnaire preview:

   ```sh
   npm run dev -w survey
   ```

4. Open the local URL printed in the terminal, usually **http://localhost:5173/**. Leave the terminal running while using the preview. Press **Ctrl+C** to stop it.

This runs the same questionnaire preview application as [stackoverflow-survey-preview.netlify.app](https://stackoverflow-survey-preview.netlify.app/), using the archived 2026 source. The hosted preview may change over time; use `releases/2026` to inspect the 2026 instrument.

No Netlify account, Qualtrics account, API credentials, or `.env` file is needed. Internet access is needed to download the source and install dependencies. Preview answers are stored in your browser's session storage; they are not submitted as survey responses.

## Build a static copy

From the repository root, after installing dependencies:

```sh
npm run build -w survey
npm run preview -w survey
```

Open the URL printed in the terminal, usually **http://localhost:4173/**. The generated files are in `packages/survey/dist/`. Serve them through a web server rather than opening `index.html` directly.

## Inspect the questionnaire

Question definitions live in `questions/<section>/<QuestionId>.yaml`. The ordering and branching are defined in `questions/survey.yaml`. See the [question format documentation](https://github.com/StackExchange/Survey/blob/releases/2026/questions/README.md) for details.

To validate the question files and survey flow, run from the repository root:

```sh
npm run validate -w survey
```

## Troubleshooting

- **Node or npm is not found:** install Node.js 24, reopen your terminal, and check `node --version` and `npm --version`.
- **Workspace or package files are not found:** run the commands from the repository root containing `package.json`, `package-lock.json`, `questions/`, and `packages/`.
- **Port 5173 is already in use:** open the URL Vite prints; it may choose another port.
- **You see a different year's questions:** download or clone `releases/2026` rather than `main`, which continues to change for future surveys.

## License and attribution

For data licensing and attribution, see the [archive license notice](../README.md#licence). Application code is covered by the repository's [LICENSE.md](../../../LICENSE.md).
