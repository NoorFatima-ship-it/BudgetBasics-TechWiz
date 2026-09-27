# Installation

BudgetBasics is a static website built with HTML5, CSS3 and vanilla JavaScript. It needs no build step, database, paid API, account or package installation.

## Requirements

- A current version of Chrome, Edge, Firefox or Safari (desktop, tablet or mobile)
- Optional: Visual Studio Code with the Live Server extension
- Internet connection only for the Google Fonts (the site still works offline with system fonts)

## Steps

1. Unzip the project folder, keeping the folder structure unchanged.
2. Open `index.html` in a browser by double-clicking it, **or** in VS Code right-click `index.html` and choose **Open with Live Server**.
3. The site opens on the home section; use the top menu (or the ☰ button on smaller screens) to reach every module.

## Notes

- Voice input and read-aloud use the browser's Web Speech API. They need browser support and microphone permission; typed chat always works. Voice input is most reliable over Live Server (`http://localhost`) in Chrome or Edge.
- Expense planner entries are kept in `sessionStorage` for the current tab only and are cleared when the tab closes.
- The theme choice and the simulated visitor counter are kept in `localStorage` on this device.
- Feedback and contact forms only validate and show a confirmation; nothing is submitted or stored.
- Test data for every module is in `data/test-data.json`.

## Testing with Lighthouse

1. Open the site in Chrome or Edge and press `F12` to open DevTools.
2. Open the **Lighthouse** tab, select Performance, Accessibility, Best Practices and SEO, and choose Mobile or Desktop.
3. Click **Analyze page load** and review the report.
