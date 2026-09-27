# BudgetBasics | NextGen BudgetBee

A responsive, single-page educational website that helps students learn budgeting, saving, smart spending and financial awareness. Built by **NEX GEN CODERS** for the TechWiz 7 "Web Innovation Unleashed" category.

**Team:** Noor Fatima (team leader), Asfad Mubarak Ali, Shanza Zahid, Iqbal Tahir, Kashaf Zahid

## Run

Open `index.html` in a current browser (Chrome, Edge, Firefox or Safari), or serve the folder with any static server such as VS Code Live Server. There is no build step, backend, database, login or API key. See [installation](docs/installation.md).

## Modules (mapped to the SRS)

| SRS module | Where on the page | What it does |
|---|---|---|
| Home | `#home`, ticker, header, footer | Logo, tagline, welcome banner, calls to action, tips & quick facts ticker, visitor counter, live date/time, sitemap link |
| 1. Budgeting Basics | `#basics` | Income, fixed/variable expenses, needs, wants, savings cards; sample budget table; knowledge check |
| 2. Needs vs Wants | `#needs` | Classify sample items with explained feedback; four-question decision guide |
| 3. 50-30-20 Budget | `#rule` | Validated calculator with labels, split bar, formula used, stated assumptions and educational note |
| 4. Savings Goals | `#savings` | Remaining amount, estimated months, target date, milestones, progress bar and ring, encouraging tip |
| 5. Expense Planner | `#planner` | Add, edit, delete, search, filter, sort, clear all; totals, remaining balance, plan stats, 50/30/20 check and a personal tip |
| 6. Money Mistakes | `#mistakes` | Five accordions, each with a student scenario and corrective action |
| 7. Infographics | `#gallery` | Original CSS infographics with captions and alt text, filterable by topic |
| 8. AI Chatbot | `#chatbot` (floating panel) | Rule-based keyword answers, suggested prompts, Ask button, tips based on planner spending, fallback message, disclaimer, optional voice |
| 9. Search, Sort, Filter | `#search` | Keyword search with relevance/A–Z/Z–A sorting, topic chips, no-result message |
| 10. About, Feedback, Contact | `#about`, `#feedback`, `#contact` | Team, validated feedback (name, email, rating, comments) and contact forms, email, phone, address and social links |
| 11. Extras | whole site | Responsive menu with active/hover/focus states, dark/light mode, animations, back-to-top, keyboard support, reduced-motion support |

## Project files

- `index.html` — page structure and all sections
- `assets/css/style.css` — layout, themes, responsive rules and motion preferences
- `assets/js/content.js` — pre-populated learning content (tips, quick facts, chatbot answers, search topics, practice items)
- `assets/js/Nexgen.js` — interactions, calculators, planner, chatbot, search and form validation
- `assets/images/` — BudgetBee logo and avatar (light and dark)
- `data/test-data.json` — test inputs and expected outputs for every module
- `docs/installation.md` — setup instructions
- `docs/ai-usage.md` — AI tools used and how
- `ReadMe.doc` — submission read-me with assumptions

## Privacy and educational use

BudgetBasics is not a bank or a transaction service and gives no professional financial advice. Nothing typed on the page is sent anywhere. Expense planner entries are kept in `sessionStorage` and are cleared when the tab is closed, or earlier with **Clear all**. Only the theme choice and the simulated visitor counter use `localStorage`. Feedback and contact forms validate in the browser and show a confirmation; they do not submit or store data. All calculator results are educational estimates.
