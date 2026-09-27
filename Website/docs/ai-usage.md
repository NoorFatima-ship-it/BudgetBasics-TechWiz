# AI usage acknowledgement

As the SRS asks, this project acknowledges the AI tools that supported its development.

| Tool | Used for |
|---|---|
| Claude (Anthropic), through Claude Code in VS Code | Code assistance: reviewing the site against the SRS, suggesting fixes, refactoring JavaScript into modules, calculator detail panels, accessibility checks and automated browser testing |
| *(Team: add any other tools you used, e.g. ChatGPT, Canva AI, Figma AI)* | *(what you used it for)* |

AI suggestions were reviewed, modified and tested by the team. Every team member should be able to explain the page structure, the calculator formulas, validation rules, the expense planner, the rule-based chatbot, the search/sort/filter logic, the voice features and the accessibility choices.

## About the "AI" chatbot

BudgetBee is a rule-based educational assistant, as the SRS allows ("pre-defined responses, keyword matching, or rule-based JavaScript logic"). Its answers and tips come from `assets/js/content.js`. Personalised tips are chosen from the category a student spends most on in the expense planner. It does not call an online AI service, does not send any data anywhere and does not give professional financial advice.
