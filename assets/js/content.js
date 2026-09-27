/* BudgetBasics / NextGen BudgetBee — pre-populated learning content.
   All text the interactive modules use lives here, separate from the logic in Nexgen.js,
   so tips, answers and search topics can be extended without touching any code.
   Chatbot patterns are regular-expression strings (case-insensitive). */
window.BudgetBasicsContent = {
    // Rotating ticker: featured budgeting tips and quick facts.
    tickerItems: [
        { type: 'Tip', text: 'Pay yourself first: move your savings amount aside the day you receive your allowance.' },
        { type: 'Fact', text: 'Rs. 150 a day on snacks adds up to about Rs. 4,500 a month.' },
        { type: 'Tip', text: 'Wait 24 hours before any unplanned purchase over Rs. 2,000.' },
        { type: 'Fact', text: 'The 50/30/20 guideline splits income into needs, wants and savings.' },
        { type: 'Tip', text: 'Review your subscriptions each month and cancel the ones you no longer use.' },
        { type: 'Fact', text: 'Saving Rs. 5,000 a month builds Rs. 60,000 in one year.' },
        { type: 'Tip', text: 'Set reminders for shared bills so a busy exam week never causes a late payment.' },
        { type: 'Quote', text: '“Do not save what is left after spending; spend what is left after saving.” — Warren Buffett' }
    ],

    // Tips BudgetBee gives, matched to the category a student spends most on in the planner.
    categoryTips: {
        Food: 'Food is your biggest spend. Packing lunch two days a week or cooking with friends can cut it noticeably.',
        Transport: 'Transport is your biggest spend. A monthly pass or shared rides can cost less than daily fares.',
        Education: 'Education is your biggest spend. Check the library, seniors or second-hand shops before buying new books.',
        Entertainment: 'Entertainment is your biggest spend. Set a weekly fun limit and look for free campus events.',
        Shopping: 'Shopping is your biggest spend. Try the 24-hour rule before buying anything you had not planned.',
        Utilities: 'Utilities are your biggest spend. Agree on a fair split with roommates and switch off unused devices.',
        Miscellaneous: 'Miscellaneous is your biggest spend. Give these costs a clearer category so you can see where they go.'
    },

    // General tips for the chatbot when there is no planner data yet.
    generalTips: [
        'Track every expense for one week. Small daily spends are often bigger than they feel.',
        'Keep a small emergency fund so a surprise cost does not break your monthly plan.',
        'Plan your month before it starts: needs first, then savings, then wants.',
        'Use cash or a fixed card limit for fun spending so it cannot creep into your needs.',
        'Celebrate small savings milestones; they keep you motivated for the bigger goal.'
    ],

    // Needs vs wants practice items. Each answer comes with an explanation, not a universal rule.
    needsWantsItems: [
        { name: 'Textbooks', emoji: '📚', type: 'Need', why: 'Course materials support your current studies.' },
        { name: 'Gaming subscription', emoji: '🎮', type: 'Want', why: 'Entertainment can be enjoyable, but it is usually optional.' },
        { name: 'Groceries', emoji: '🥬', type: 'Need', why: 'Food is an everyday essential.' },
        { name: 'New headphones', emoji: '🎧', type: 'Want', why: 'A replacement may be a need if your old pair is essential for study; an upgrade is often a want.' },
        { name: 'Bus fare to class', emoji: '🚌', type: 'Need', why: 'Transport to class can be an essential study cost.' },
        { name: 'Movie ticket', emoji: '🎟️', type: 'Want', why: 'A movie is a fun optional activity.' },
        { name: 'Rent', emoji: '🏠', type: 'Need', why: 'A safe place to live is a basic necessity.' },
        { name: 'Designer shoes', emoji: '👟', type: 'Want', why: 'A premium style choice is usually optional; practical footwear can be a need.' }
    ],

    // Rule-based chatbot answers, checked in order; the first matching pattern wins.
    chatAnswers: [
        { pattern: 'what is (a )?need|\\bneeds?\\b.*(mean|kya)|zaroorat|zaroori cheez', answer: 'A need (zaroorat) is something essential for wellbeing or responsibilities, such as food, a safe home, or required study materials. Context matters: your situation can change what is essential.' },
        { pattern: 'what is (a )?want|\\bwants?\\b.*(mean|kya)|khwahish', answer: 'A want (khwahish) is something you would like but can usually live without, such as a movie ticket or premium upgrade. It is okay to enjoy wants when they fit your plan.' },
        { pattern: 'overspend|spend too|impulse|impulsive|fazool kharch|zyada kharch', answer: 'Try pausing before a non-essential purchase, setting a comfortable spending plan, and checking a few small expenses. A 24-hour wait can help with impulse buys.' },
        { pattern: '50\\s*\\/\\s*30\\s*\\/\\s*20|50\\s+30\\s+20|fifty.*thirty|rule kya', answer: 'It is a flexible budgeting guideline: about 50% for needs, 30% for wants, and 20% for savings. It is a starting point, not a rule; adjust it to fit your circumstances.' },
        { pattern: 'how much.*(save|saving)|kitna.*(save|bacha)', answer: 'A common starting point is 20% of your income, as in the 50/30/20 guideline. If that is too much right now, start with 5–10% and increase it as your budget allows. Savings Goals can estimate how long a goal will take.' },
        { pattern: 'budget|budgeting|mahina.*plan|paise ka plan', answer: 'A budget is a simple plan for the money you receive and the expenses you expect. It can help you make room for needs, wants, and goals. Open the 50/30/20 calculator to try a sample plan.' },
        { pattern: 'goal|target|contribut|set.*saving|savings goal|saving goal', answer: 'Give your goal a name and target, subtract what you have already saved, then choose a monthly contribution that feels manageable. The Savings Goals tool estimates months by dividing what remains by that contribution.' },
        { pattern: 'save|saving|savings|bachane|bachao|paise.*bach|paisa.*save', answer: 'There is no single right amount to save. The 50/30/20 guideline suggests 20% when it fits, but start with an amount that works for your circumstances and goals. Try Savings Goals to estimate a monthly amount.' },
        { pattern: 'subscription', answer: 'Unused subscriptions quietly drain your budget. List every monthly charge, cancel the ones you rarely use, and set a reminder before free trials end.' },
        { pattern: 'expense|kharcha|kharchay|spending', answer: 'An expense (kharcha) is money spent on something, such as transport, food, or course materials. Grouping expenses in the planner can help you understand your habits.' },
        { pattern: 'income|allowance|pocket money|aamdani', answer: 'Income (aamdani) is money you receive, such as an allowance, wages, or a scholarship. A budget gives that money a plan.' },
        { pattern: 'hello|^hi\\b|salam|assalam', answer: 'Hi! I can explain budgeting, saving, needs and wants, expenses, and the 50/30/20 guideline. You can ask in English or Roman Urdu, or ask me for a tip.' }
    ],

    chatFallback: 'I can help with budgeting, saving, needs and wants, expenses, income, and the 50/30/20 guideline. Try asking "budget kya hota hai?", "give me a tip", or use one of the suggested questions.',

    chatWelcome: "Hey! I'm BudgetBee. I can help you understand budgeting, saving, expenses and the 50/30/20 rule. What would you like to learn?",

    // Voice or typed commands that jump to a section instead of answering.
    chatShortcuts: [
        { pattern: '(open )?(budget calculator|calculator|hisab kitab)$', target: '#rule', reply: 'Opening the 50/30/20 budget calculator.' },
        { pattern: '(open )?(savings goals?|saving goals?|saving target|bachat goal)$', target: '#savings', reply: 'Opening Savings Goals.' },
        { pattern: '(open )?(expense planner|expenses planner|kharcha planner)$', target: '#planner', reply: 'Opening the Expense Planner.' },
        { pattern: '(show |open )?(money mistakes|mistakes)$', target: '#mistakes', reply: 'Opening Money Mistakes.' },
        { pattern: '(open )?(needs and wants|needs & wants|needs vs wants)$', target: '#needs', reply: 'Opening Needs vs Wants.' },
        { pattern: '^(go )?(to )?home$', target: '#home', reply: 'Going to the home section.' }
    ],

    // Searchable learning topics. "topic" drives the filter chips and "keywords" improve matching.
    searchIndex: [
        { title: 'Budgeting basics', description: 'A budget is a simple plan for your income, needs, wants, expenses, and savings.', href: '#basics', topic: 'Planning', keywords: 'budget income expenses fixed variable' },
        { title: 'Income', description: 'Money you receive from an allowance, part-time work, or a scholarship.', href: '#basics', topic: 'Planning', keywords: 'income allowance scholarship earnings' },
        { title: 'Fixed and variable expenses', description: 'Fixed costs stay the same each month; variable costs change with your choices.', href: '#basics', topic: 'Spending', keywords: 'expenses fixed variable costs' },
        { title: 'Needs vs wants', description: 'Needs are essentials; wants are optional choices. Context matters for each person.', href: '#needs', topic: 'Spending', keywords: 'needs wants spending essentials' },
        { title: '50/30/20 guideline', description: 'Explore a flexible starting point: 50% needs, 30% wants, 20% savings.', href: '#rule', topic: 'Planning', keywords: '50 30 20 budget savings calculator split' },
        { title: 'Savings goals', description: 'Estimate how monthly contributions can move a student savings goal forward.', href: '#savings', topic: 'Saving', keywords: 'saving savings goals target months' },
        { title: 'Expense planner', description: 'Practice listing sample expenses by date and category and see your plan stats.', href: '#planner', topic: 'Spending', keywords: 'expenses planner food transport categories' },
        { title: 'Impulse buying', description: 'Pause for 24 hours before unplanned purchases to protect your plan.', href: '#mistakes', topic: 'Spending', keywords: 'mistakes impulse overspending shopping' },
        { title: 'Unused subscriptions', description: 'Review monthly charges and cancel services you rarely use.', href: '#mistakes', topic: 'Spending', keywords: 'mistakes subscriptions recurring' },
        { title: 'Money mistakes', description: 'Learn about impulse buying, small expenses, late payments, and planning.', href: '#mistakes', topic: 'Spending', keywords: 'spending tips mistakes late payments' },
        { title: 'Visual learning gallery', description: 'Quick guides to saving, expense categories, needs, and the budget cycle.', href: '#gallery', topic: 'Saving', keywords: 'infographics saving needs cycle' },
        { title: 'Ask BudgetBee', description: 'A rule-based helper for introductory budgeting questions and tips.', href: '#chatbot', topic: 'Planning', keywords: 'chatbot ai tips income needs saving' }
    ]
};
