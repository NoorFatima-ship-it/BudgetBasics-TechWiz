/* BudgetBasics / NextGen BudgetBee
   Client-side educational website. Nothing typed into this page is sent to a server:
   planner entries live in sessionStorage (cleared when the tab closes) and forms only
   validate in the browser. Learning content comes from content.js. */
(() => {
    'use strict';

    const content = window.BudgetBasicsContent || {};

    /* ---------- Shared helpers ---------- */

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const money = value => 'Rs. ' + Number(value).toLocaleString('en-PK', { maximumFractionDigits: 2 });
    const rounded = value => money(Math.round(value));
    const plural = (count, word, pluralWord = `${word}s`) => `${count.toLocaleString('en-PK')} ${count === 1 ? word : pluralWord}`;

    // True for a non-empty string that is a finite number of zero or more.
    const isNonNegativeNumber = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;

    // Calendar conversions used by every calculator (stated to the user as assumptions).
    const WEEKS_PER_YEAR = 52, DAYS_PER_YEAR = 365;
    const perWeek = monthly => monthly * 12 / WEEKS_PER_YEAR;
    const perDay = monthly => monthly * 12 / DAYS_PER_YEAR;

    // YYYY-MM-DD in the visitor's own time zone (toISOString would give the UTC date, a day off near midnight).
    const localISODate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const monthYear = date => new Intl.DateTimeFormat('en-PK', { month: 'short', year: 'numeric' }).format(date);
    const monthsFromNow = months => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth() + months, 1); };
    const shortDuration = months => {
        if (months < 12) return plural(months, 'month');
        const years = Math.floor(months / 12), rest = months % 12;
        return `${years}y${rest ? ` ${rest}m` : ''}`;
    };

    function escapeHtml(value) {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value).replace(/[&<>"']/g, character => entities[character]);
    }

    const statTile = (label, value, note = '') =>
        `<div class="calc-stat"><small>${label}</small><strong>${value}</strong>${note ? `<span>${note}</span>` : ''}</div>`;

    const barRow = (label, value, width, marker = null) => {
        const safeWidth = Math.min(100, Math.max(0, width)).toFixed(1);
        const guide = marker === null ? '' : `<em style="left:${marker}%" title="Guideline ${marker}%"></em>`;
        return `<div class="bar-row"><div class="bar-label"><span>${label}</span><b>${value}</b></div><div class="bar-track"><i style="width:${safeWidth}%"></i>${guide}</div></div>`;
    };

    const toast = message => {
        const el = $('#toast');
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
    };

    const setFormMessage = (element, text, ok) => {
        element.textContent = text;
        element.classList.toggle('is-error', !ok);
        element.classList.toggle('is-success', ok);
    };

    // Storage can throw in private mode or when blocked; every access goes through these.
    const storage = {
        get(area, key) { try { return window[area].getItem(key); } catch { return null; } },
        set(area, key, value) { try { window[area].setItem(key, value); return true; } catch { return false; } },
        remove(area, key) { try { window[area].removeItem(key); } catch { } }
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Navigation, theme and page chrome ---------- */

    const menu = $('#mainNav'), menuToggle = $('#menuToggle');

    function setMenuOpen(open) {
        menu.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        menuToggle.textContent = open ? '×' : '☰';
    }

    function initNavigation() {
        menuToggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
        $$('#mainNav a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('open')) { setMenuOpen(false); menuToggle.focus(); } });

        // Active state: highlight the menu link of the section currently in view.
        const links = $$('#mainNav a[href^="#"]');
        const linkFor = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
        const sections = [...linkFor.keys()].map(id => document.getElementById(id)).filter(Boolean);
        const setActive = id => links.forEach(link => {
            const active = link === linkFor.get(id);
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
        });
        if ('IntersectionObserver' in window) {
            const spy = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
            sections.forEach(section => spy.observe(section));
        }
        setActive('home');
    }

    const themeToggle = $('#themeToggle');

    function applyTheme(dark) {
        document.body.classList.toggle('dark', dark);
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
        const suffix = dark ? '-dark' : '';
        $$('[data-bee-logo]').forEach(image => { image.src = `assets/images/budgetbee-logo${suffix}.svg`; });
        $$('[data-bee-avatar]').forEach(image => { image.src = `assets/images/budgetbee-avatar${suffix}.svg`; });
        themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.textContent = dark ? '☼' : '◐';
    }

    function initTheme() {
        const saved = storage.get('localStorage', 'theme') || storage.get('localStorage', 'budgetbasics-theme');
        applyTheme(saved !== 'light');
        themeToggle.addEventListener('click', () => {
            const dark = !document.body.classList.contains('dark');
            applyTheme(dark);
            storage.set('localStorage', 'theme', dark ? 'dark' : 'light');
        });
    }

    function initClockAndCounter() {
        const format = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const tick = () => { const text = format.format(new Date()); $('#liveClock').textContent = text; $('#footerClock').textContent = text; };
        tick();
        setInterval(tick, 1000);
        $('#footerYear').textContent = String(new Date().getFullYear());

        // Simulated visitor counter: a daily number kept only on this device.
        const key = 'budgetbasics-visits-' + localISODate();
        const count = Math.min(999999, Number(storage.get('localStorage', key)) || 1283) + 1;
        storage.set('localStorage', key, String(count));
        $('#visitorCount').textContent = count.toLocaleString();
    }

    function initScrollChrome() {
        const backTop = $('#backTop');
        backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
        const update = () => {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const progress = window.scrollY / maxScroll;
            backTop.classList.toggle('visible', window.scrollY > 500);
            document.body.classList.toggle('scrolled', window.scrollY > 8);
            document.body.classList.toggle('in-bottom', window.scrollY > 40 && progress >= .82);
            document.body.classList.toggle('in-middle', window.scrollY > 40 && progress >= .24 && progress < .82);
        };
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
        const loadingScreen = $('#loadingScreen');
        if (loadingScreen) setTimeout(() => loadingScreen.classList.add('done'), 950);
    }

    /* ---------- Motion: background parallax, reveal, count-up and card tilt ---------- */

    function initAmbientScene() {
        const shapes = $$('#ambientScene [data-depth]');
        if (!shapes.length || reduceMotion) return;
        const motionScale = finePointer ? 1 : .42;
        let targetX = 0, targetY = 0, targetScroll = window.scrollY;
        let currentX = 0, currentY = 0, currentScroll = window.scrollY, frame = 0;
        const requestFrame = () => { if (!frame) frame = requestAnimationFrame(update); };
        function update() {
            frame = 0;
            currentX += (targetX - currentX) * .085;
            currentY += (targetY - currentY) * .085;
            currentScroll += (targetScroll - currentScroll) * .09;
            shapes.forEach(shape => {
                const depth = Number(shape.dataset.depth) * motionScale;
                shape.style.setProperty('--parallax-x', `${(currentX * depth * 62).toFixed(2)}px`);
                shape.style.setProperty('--parallax-y', `${(currentY * depth * 62 - currentScroll * depth * .42).toFixed(2)}px`);
                shape.style.setProperty('--tilt-x', `${(-currentY * depth * 18).toFixed(2)}deg`);
                shape.style.setProperty('--tilt-y', `${(currentX * depth * 18 + currentScroll * depth * .012).toFixed(2)}deg`);
            });
            if (Math.abs(targetX - currentX) > .008 || Math.abs(targetY - currentY) > .008 || Math.abs(targetScroll - currentScroll) > .3) requestFrame();
        }
        if (finePointer) {
            window.addEventListener('pointermove', event => {
                targetX = (event.clientX / window.innerWidth - .5) * 2;
                targetY = (event.clientY / window.innerHeight - .5) * 2;
                requestFrame();
            }, { passive: true });
            document.documentElement.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; requestFrame(); });
        }
        window.addEventListener('scroll', () => { targetScroll = window.scrollY; requestFrame(); }, { passive: true });
    }

    function initRevealAndCountUp() {
        if (reduceMotion || !('IntersectionObserver' in window)) return;
        const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('reveal-ready');
            reveal.unobserve(entry.target);
        }), { threshold: .08 });
        $$('.section').forEach(section => reveal.observe(section));

        const countUp = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const number = entry.target, target = Number(number.textContent.replace(/[^0-9]/g, ''));
            const start = performance.now(), duration = 900;
            const animate = now => {
                const progress = Math.min(1, (now - start) / duration);
                number.textContent = 'Rs. ' + Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString('en-PK');
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
            countUp.unobserve(number);
        }), { threshold: .6 });
        $$('.snapshot-card strong').forEach(number => countUp.observe(number));
    }

    function initCardTilt() {
        if (reduceMotion || !finePointer) return;
        $$('.concept-card, .calculator-card, .visual-card, .contact-card, .snapshot-card, .goal-card, .item-card').forEach(card => {
            card.classList.add('tilt-card');
            card.addEventListener('pointermove', event => {
                const bounds = card.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width - .5;
                const y = (event.clientY - bounds.top) / bounds.height - .5;
                card.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    }

    /* ---------- Tips and quick facts ticker ---------- */

    function initTicker() {
        const track = $('#tickerTrack'), toggle = $('#tickerToggle');
        const items = content.tickerItems || [];
        if (!track || !items.length) return;
        const html = items.map(item => `<li><b>${escapeHtml(item.type)}</b>${escapeHtml(item.text)}</li>`).join('');
        // The list is rendered twice so the scroll can loop seamlessly; the copy is hidden from screen readers.
        track.innerHTML = `<ul>${html}</ul><ul aria-hidden="true">${html}</ul>`;
        const ticker = $('#tipsTicker');
        const setPaused = paused => {
            ticker.classList.toggle('paused', paused);
            toggle.setAttribute('aria-pressed', String(paused));
            toggle.setAttribute('aria-label', paused ? 'Play tips ticker' : 'Pause tips ticker');
            toggle.textContent = paused ? '▶' : '❚❚';
        };
        toggle.addEventListener('click', () => setPaused(!ticker.classList.contains('paused')));
        setPaused(reduceMotion);
    }

    /* ---------- Knowledge check and needs vs wants practice ---------- */

    function initKnowledgeCheck() {
        $$('[data-quiz]').forEach(button => button.addEventListener('click', () => {
            const right = button.dataset.quiz === 'right';
            const feedback = $('#quizFeedback');
            feedback.textContent = right ? 'Correct! A textbook needed for class is an education essential.' : 'Not quite. A class textbook is usually the need in this example.';
            feedback.classList.toggle('is-success', right);
            feedback.classList.toggle('is-error', !right);
        }));
    }

    function initNeedsWantsGame() {
        const items = content.needsWantsItems || [];
        if (!items.length) return;
        const card = $('.item-card'), feedback = $('#sortFeedback'), buttons = $$('.sort-buttons button');
        let index = 0, score = 0, answered = 0;
        const show = () => {
            const item = items[index];
            $('#itemName').textContent = item.name;
            $('#itemEmoji').textContent = item.emoji;
            $('#gameScore').textContent = `${score} / ${answered}`;
            feedback.textContent = 'Tap a choice to begin';
            card.classList.remove('answer-correct', 'answer-incorrect');
            buttons.forEach(button => { button.disabled = false; });
        };
        buttons.forEach(button => button.addEventListener('click', () => {
            const item = items[index], correct = button.dataset.sort === item.type;
            if (correct) score++;
            answered++;
            $('#gameScore').textContent = `${score} / ${answered}`;
            feedback.textContent = `${correct ? 'That makes sense!' : `This example is usually a ${item.type.toLowerCase()}.`} ${item.why}`;
            card.classList.add(correct ? 'answer-correct' : 'answer-incorrect');
            buttons.forEach(b => { b.disabled = true; });
            setTimeout(() => { index = (index + 1) % items.length; show(); }, 2300);
        }));
        show();
    }

    /* ---------- 50/30/20 calculator ---------- */

    const SPLITS = [
        { label: 'Needs', share: .5, tone: 'needs' },
        { label: 'Wants', share: .3, tone: 'wants' },
        { label: 'Savings', share: .2, tone: 'savings' }
    ];

    function renderBudgetSplit(income) {
        const spending = income * .8, needs = income * .5, savings = income * .2, safetyNet = needs * 3;
        $('#budgetResults').innerHTML = SPLITS.map(({ label, share, tone }) => {
            const amount = income * share;
            return `<div class="result-row"><span><i class="dot split-${tone}"></i>${label} <em>${share * 100}%</em></span><b>${money(amount)}</b><small>${rounded(perWeek(amount))} / week · ${rounded(perDay(amount))} / day</small></div>`;
        }).join('');

        const formula = SPLITS.map(({ label, share }) => `<li><b>${label}</b> = ${money(income)} × ${share * 100}% = ${money(income * share)}</li>`).join('');
        const details = $('#budgetDetails');
        details.innerHTML = `<div class="split-bar" role="img" aria-label="50 percent needs, 30 percent wants, 20 percent savings"><i class="split-needs" style="flex:50"></i><i class="split-wants" style="flex:30"></i><i class="split-savings" style="flex:20"></i></div>
            <div class="formula-box"><span class="card-label">FORMULA USED</span><ul>${formula}</ul></div>
            <div class="calc-stats">${[
                statTile('Spend / week', rounded(perWeek(spending)), 'needs + wants'),
                statTile('Spend / day', rounded(perDay(spending)), 'needs + wants'),
                statTile('Saved / year', money(savings * 12), 'savings × 12'),
                statTile('Safety net', money(safetyNet), `3 × needs · ${Math.ceil(safetyNet / savings)} months to build`)
            ].join('')}</div>
            <p class="calc-assumptions">Assumptions: week = monthly × 12 ÷ 52, day = monthly × 12 ÷ 365. Amounts are rounded for display.</p>
            <button type="button" class="use-budget" data-budget="${income}">Use ${money(income)} as my planner budget →</button>`;
        details.hidden = false;
    }

    // Invalid input must never leave an older result on screen, so the results reset to placeholders.
    function clearBudgetSplit() {
        $('#budgetResults').innerHTML = SPLITS.map(({ label }) => `<div class="result-row"><span>${label}</span><b>Rs. —</b></div>`).join('');
        const details = $('#budgetDetails');
        details.innerHTML = '';
        details.hidden = true;
    }

    function initBudgetCalculator() {
        const input = $('#incomeInput'), error = $('#budgetError');
        $('#budgetForm').addEventListener('submit', event => {
            event.preventDefault();
            const value = input.value.trim();
            if (!isNonNegativeNumber(value) || Number(value) <= 0) {
                error.textContent = value === '' ? 'Enter a monthly income to calculate your sample split.' : 'Enter a number greater than zero.';
                input.setAttribute('aria-invalid', 'true');
                clearBudgetSplit();
                return;
            }
            error.textContent = '';
            input.removeAttribute('aria-invalid');
            renderBudgetSplit(Number(value));
        });
        input.addEventListener('input', () => { error.textContent = ''; input.removeAttribute('aria-invalid'); });
        $('#budgetDetails').addEventListener('click', event => {
            const button = event.target.closest('.use-budget');
            if (!button) return;
            planner.setBudget(Number(button.dataset.budget));
            $('#planner').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
            toast('Planner budget updated.');
        });
    }

    /* ---------- Savings goal estimator ---------- */

    function savingsDetails(target, current, contribution, remaining, months) {
        const chip = (label, value) => `<div><small>${label}</small><b>${value}</b></div>`;
        if (remaining === 0) return `<div class="goal-stats">${chip('Target', money(target))}${chip('Saved', money(current))}${chip('Extra', money(current - target))}</div>`;
        const steps = [25, 50, 75, 100].map(step => {
            const amount = target * step / 100;
            if (current >= amount) return `<li class="done"><b>${step}%</b><span>✓ Done</span></li>`;
            return `<li><b>${step}%</b><span>${monthYear(monthsFromNow(Math.ceil((amount - current) / contribution)))}</span></li>`;
        }).join('');
        return `<div class="goal-stats">${[
            chip('Duration', shortDuration(months)),
            chip('Target', monthYear(monthsFromNow(months))),
            chip('To save', money(remaining)),
            chip('Weekly', rounded(perWeek(contribution)))
        ].join('')}</div><ol class="goal-steps" aria-label="Milestones">${steps}</ol>
        <p class="calc-assumptions">Months = ${money(remaining)} ÷ ${money(contribution)}, rounded up. Assumes contributions start next month.</p>`;
    }

    function savingsTip(remaining, contribution, months) {
        if (remaining === 0) return 'Goal reached! Pick a new goal or enjoy what you achieved.';
        const boosted = contribution * 1.25, boostedMonths = Math.ceil(remaining / boosted);
        return boostedMonths < months
            ? `Save ${rounded(boosted)} a month instead and you finish ${plural(months - boostedMonths, 'month')} sooner.`
            : 'Set aside your contribution as soon as you receive your income.';
    }

    function initSavingsGoal() {
        const error = $('#savingsError'), result = $('#savingsResult');
        const emptyPreview = result.innerHTML;
        const fields = ['#goalName', '#targetAmount', '#currentAmount', '#contribution'].map(id => $(id));
        fields.forEach(field => field.addEventListener('input', () => { error.textContent = ''; field.removeAttribute('aria-invalid'); }));

        $('#savingsForm').addEventListener('submit', event => {
            event.preventDefault();
            const [nameField, targetField, currentField, contributionField] = fields;
            const name = nameField.value.trim();
            const values = [targetField, currentField, contributionField].map(field => field.value.trim());
            const fail = (message, field) => {
                error.textContent = message;
                result.innerHTML = emptyPreview;
                // The saved preview may hold the other theme's bee; match the current theme.
                $$('[data-bee-logo]', result).forEach(image => { image.src = `assets/images/budgetbee-logo${document.body.classList.contains('dark') ? '-dark' : ''}.svg`; });
                field?.setAttribute('aria-invalid', 'true');
                field?.focus();
            };

            const empty = fields.find(field => !field.value.trim());
            if (empty) return fail('Please complete all four fields to make a goal plan.', empty);
            const invalidIndex = values.findIndex(value => !isNonNegativeNumber(value));
            if (invalidIndex !== -1) return fail('Amounts must be numbers of zero or more (no negative values).', [targetField, currentField, contributionField][invalidIndex]);
            const [target, current, contribution] = values.map(Number);
            if (target <= 0) return fail('The target amount must be greater than zero.', targetField);
            if (current < target && contribution <= 0) return fail('Add a monthly contribution greater than zero to estimate a timeline.', contributionField);

            error.textContent = '';
            const remaining = Math.max(0, target - current);
            const percent = Math.min(100, (current / target) * 100);
            const months = remaining === 0 ? 0 : Math.ceil(remaining / contribution);
            result.innerHTML = `<span class="card-label">YOUR GOAL PLAN</span>
                <div class="goal-head"><div><h3>${escapeHtml(name)}</h3><p>${remaining === 0 ? 'Target reached. Well done!' : `${money(remaining)} left of ${money(target)}`}</p></div>
                    <div class="goal-ring" role="img" aria-label="${percent.toFixed(0)} percent of ${escapeHtml(name)} savings goal complete" style="--goal-progress:${percent * 3.6}deg"><span>${percent.toFixed(0)}<small>%</small></span></div></div>
                <div class="goal-progress" role="progressbar" aria-label="Goal progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent.toFixed(0)}"><span style="width:${percent}%"></span></div>
                <div class="goal-foot"><span>${money(current)} saved</span><b>${money(target)} goal</b></div>
                ${savingsDetails(target, current, contribution, remaining, months)}
                <div class="tip-box">💡 <span><b>Bee's tip</b><br>${savingsTip(remaining, contribution, months)}</span></div>`;
        });
    }

    /* ---------- Expense planner (session only) ---------- */

    const NEEDS_CATEGORIES = ['Food', 'Transport', 'Education', 'Utilities'];
    const PLANNER_KEYS = { expenses: 'budgetbasics-expenses', budget: 'budgetbasics-planner-budget' };

    const planner = {
        expenses: [],
        budget: 50000,
        editingId: null,

        load() {
            try {
                const saved = JSON.parse(storage.get('sessionStorage', PLANNER_KEYS.expenses) || '[]');
                if (Array.isArray(saved)) this.expenses = saved.filter(item => item && typeof item.description === 'string' && Number.isFinite(item.amount) && item.amount > 0);
            } catch { this.expenses = []; }
            const savedBudget = Number(storage.get('sessionStorage', PLANNER_KEYS.budget));
            if (Number.isFinite(savedBudget) && savedBudget > 0) this.budget = savedBudget;
            // Earlier versions kept entries in localStorage; remove them so nothing outlives the session.
            storage.remove('localStorage', PLANNER_KEYS.expenses);
            storage.remove('localStorage', PLANNER_KEYS.budget);
        },

        save() {
            storage.set('sessionStorage', PLANNER_KEYS.expenses, JSON.stringify(this.expenses));
            storage.set('sessionStorage', PLANNER_KEYS.budget, String(this.budget));
        },

        total() { return this.expenses.reduce((sum, expense) => sum + expense.amount, 0); },

        // Totals per category, largest first: [[name, { amount, count }], ...]
        byCategory() {
            const map = {};
            this.expenses.forEach(expense => {
                const entry = map[expense.category] || (map[expense.category] = { amount: 0, count: 0 });
                entry.amount += expense.amount;
                entry.count++;
            });
            return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
        },

        setBudget(value, fromInput = false) {
            this.budget = value;
            if (!fromInput) $('#plannerBudget').value = String(value);
            this.render();
        },

        visibleExpenses() {
            const filter = $('#categoryFilter').value;
            const query = $('#expenseSearch').value.trim().toLowerCase();
            const sort = $('#expenseSort').value;
            const sorters = {
                newest: (a, b) => b.date.localeCompare(a.date),
                oldest: (a, b) => a.date.localeCompare(b.date),
                high: (a, b) => b.amount - a.amount,
                low: (a, b) => a.amount - b.amount
            };
            return this.expenses
                .filter(expense => (filter === 'all' || expense.category === filter) && `${expense.category} ${expense.description} ${expense.date}`.toLowerCase().includes(query))
                .sort(sorters[sort] || sorters.newest);
        },

        render() {
            const rows = $('#expenseRows'), visible = this.visibleExpenses();
            rows.innerHTML = visible.length
                ? visible.map(expense => `<tr><td>${escapeHtml(expense.date || '—')}</td><td>${escapeHtml(expense.category)}</td><td>${escapeHtml(expense.description)}</td><td>${money(expense.amount)}</td><td><button type="button" class="row-action" data-edit="${expense.id}" aria-label="Edit ${escapeHtml(expense.description)}">Edit</button><button type="button" class="row-action delete-action" data-delete="${expense.id}" aria-label="Delete ${escapeHtml(expense.description)}">Delete</button></td></tr>`).join('')
                : `<tr class="empty-row"><td colspan="5">${this.expenses.length ? 'No matching expenses.' : 'Your practice list is empty. Add a sample expense above.'}</td></tr>`;
            const total = this.total();
            $('#expenseTotal').textContent = money(total);
            $('#remainingBalance').textContent = money(this.budget - total);
            ['#clearExpenses', '#printPlan', '#downloadPlan'].forEach(id => { $(id).disabled = !this.expenses.length; });
            renderPlannerInsights(total);
            this.save();
        }
    };

    const dayNumber = date => {
        const [year, month, day] = String(date).split('-').map(Number);
        return year && month && day ? Date.UTC(year, month - 1, day) / 86400000 : null;
    };

    // A tip chosen from the planner's biggest category, used by the stats panel and the chatbot.
    function spendingTip() {
        const [top] = planner.byCategory();
        if (!top) return null;
        const share = top[1].amount / planner.total() * 100;
        const tip = (content.categoryTips || {})[top[0]];
        return tip ? `${tip} (${top[0]} is ${share.toFixed(0)}% of your planned spending.)` : null;
    }

    // Every figure about the current plan, shared by the on-screen stats, the printout and the CSV.
    function planSummary() {
        const expenses = planner.expenses, budget = planner.budget, total = planner.total();
        const remaining = budget - total, used = total / budget * 100;
        const largest = expenses.reduce((top, expense) => expense.amount > top.amount ? expense : top, expenses[0]);
        const days = expenses.map(expense => dayNumber(expense.date)).filter(day => day !== null);
        const span = days.length ? Math.max(...days) - Math.min(...days) + 1 : 1;
        const daily = total / span, projected = daily * 30;
        const [tone, statusText] = used > 100 ? ['over', `Over budget by ${money(-remaining)}`]
            : used >= 80 ? ['close', 'Getting close to your limit']
            : projected > budget ? ['close', 'Spending pace is above budget']
            : ['ok', 'On track'];
        const needs = expenses.filter(expense => NEEDS_CATEGORIES.includes(expense.category)).reduce((sum, expense) => sum + expense.amount, 0);
        const guide = [['Needs', needs, 50], ['Wants', total - needs, 30], ['Savings', Math.max(0, remaining), 20]].map(([label, amount, target], index) => {
            const share = amount / budget * 100;
            return { label, amount, target, share, fits: index === 2 ? share >= target : share <= target };
        });
        return { expenses, budget, total, remaining, used, largest, span, daily, projected, tone, statusText, categories: planner.byCategory(), guide };
    }

    function renderPlannerInsights(total) {
        const box = $('#plannerInsights');
        if (!planner.expenses.length) {
            box.innerHTML = '<p class="insights-empty">Add a few expenses to see budget usage, spending pace, a category breakdown, a 50/30/20 check and a personal tip.</p>';
            return;
        }
        const { expenses, remaining, used, largest, span, daily, projected, tone, statusText, categories, guide } = planSummary();

        const categoryRows = categories.map(([name, entry]) => {
            const share = entry.amount / total * 100;
            return barRow(`${escapeHtml(name)} <small>${entry.count}×</small>`, `${money(entry.amount)} <small>${share.toFixed(0)}%</small>`, share);
        }).join('');
        const guideRows = guide.map(({ label, amount, target, share, fits }) =>
            barRow(`${label} <small>${fits ? '✓' : '!'} ${target}% guide</small>`, `${money(amount)} <small>${share.toFixed(0)}%</small>`, share, target)).join('');

        box.innerHTML = `<div class="insights-head"><div><span class="card-label">PLAN STATS</span><h4>How your month is tracking</h4></div><span class="status-pill status-${tone}">${statusText}</span></div>
            <div class="usage usage-${tone}"><div class="bar-track"><i style="width:${Math.min(100, used).toFixed(1)}%"></i></div><div class="usage-foot"><span>${used.toFixed(0)}% used · 30-day pace ${rounded(projected)}</span><b>${remaining >= 0 ? `${money(remaining)} left` : `${money(-remaining)} over`}</b></div></div>
            <div class="calc-stats">${[
                statTile('Per day', rounded(daily), `over ${plural(span, 'day')}`),
                statTile('Average', rounded(total / expenses.length), plural(expenses.length, 'entry', 'entries')),
                statTile('Largest', money(largest.amount), escapeHtml(largest.description)),
                statTile('Lasts', remaining <= 0 ? 'Used up' : plural(Math.floor(remaining / daily), 'day'), 'at this pace')
            ].join('')}</div>
            <div class="insights-grid">
                <div class="calc-block"><span class="card-label">BY CATEGORY</span>${categoryRows}</div>
                <div class="calc-block"><span class="card-label">50 / 30 / 20 CHECK</span>${guideRows}</div>
            </div>
            <div class="tip-box planner-tip">💡 <span><b>BudgetBee tip</b><br>${escapeHtml(spendingTip() || '')}</span></div>
            <p class="calc-assumptions">Per day = total ÷ days from first to last entry. 30-day pace = per day × 30. Needs = Food, Transport, Education and Utilities; other categories count as wants.</p>`;
    }

    /* Save the plan: a print-ready report (print or "Save as PDF") and a CSV file that opens in Excel.
       Both are built in the browser from the session's entries; nothing is uploaded anywhere. */

    const todayLabel = () => new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const fileDate = () => localISODate();

    function buildPlanReport() {
        const s = planSummary();
        const byDate = [...s.expenses].sort((a, b) => a.date.localeCompare(b.date));
        const rows = byDate.map(expense => `<tr><td>${escapeHtml(expense.date)}</td><td>${escapeHtml(expense.category)}</td><td>${escapeHtml(expense.description)}</td><td class="num">${money(expense.amount)}</td></tr>`).join('');
        const categoryRows = s.categories.map(([name, entry]) => `<tr><td>${escapeHtml(name)}</td><td class="num">${entry.count}</td><td class="num">${money(entry.amount)}</td><td class="num">${(entry.amount / s.total * 100).toFixed(0)}%</td></tr>`).join('');
        const guideRows = s.guide.map(g => `<tr><td>${g.label}</td><td class="num">${money(g.amount)}</td><td class="num">${g.share.toFixed(0)}%</td><td class="num">${g.target}%</td><td>${g.fits ? '✓ ' + (g.label === 'Savings' ? 'Meets' : 'Within') : '! ' + (g.label === 'Savings' ? 'Below' : 'Above')} guide</td></tr>`).join('');
        return `<header class="report-head"><div><h1>BudgetBasics · Monthly plan</h1><p>Prepared on ${todayLabel()} · Practice plan for learning, not financial advice</p></div><span class="report-status">${escapeHtml(s.statusText)}</span></header>
            <section class="report-summary">
                <div><small>Monthly budget</small><b>${money(s.budget)}</b></div>
                <div><small>Planned spending</small><b>${money(s.total)}</b></div>
                <div><small>${s.remaining >= 0 ? 'Balance left' : 'Over budget'}</small><b>${money(Math.abs(s.remaining))}</b></div>
                <div><small>Budget used</small><b>${s.used.toFixed(0)}%</b></div>
                <div><small>Per day</small><b>${rounded(s.daily)}</b></div>
                <div><small>30-day pace</small><b>${rounded(s.projected)}</b></div>
            </section>
            <h2>Expenses (${s.expenses.length})</h2>
            <table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody>
                <tfoot><tr><th colspan="3">Total</th><th class="num">${money(s.total)}</th></tr></tfoot></table>
            <div class="report-grid">
                <div><h2>By category</h2><table><thead><tr><th>Category</th><th class="num">Entries</th><th class="num">Amount</th><th class="num">Share</th></tr></thead><tbody>${categoryRows}</tbody></table></div>
                <div><h2>50 / 30 / 20 check</h2><table><thead><tr><th>Part</th><th class="num">Amount</th><th class="num">Of budget</th><th class="num">Guide</th><th>Result</th></tr></thead><tbody>${guideRows}</tbody></table></div>
            </div>
            <p class="report-tip"><b>BudgetBee tip:</b> ${escapeHtml(spendingTip() || '')}</p>
            <p class="report-note">Per day = total ÷ days from first to last entry (${plural(s.span, 'day')}). 30-day pace = per day × 30. Needs = Food, Transport, Education and Utilities; other categories count as wants. Educational estimate only.</p>`;
    }

    function printPlan() {
        if (!planner.expenses.length) return;
        let report = $('#printReport');
        if (!report) {
            report = document.createElement('article');
            report.id = 'printReport';
            report.className = 'print-report';
            document.body.append(report);
        }
        report.innerHTML = buildPlanReport();
        document.body.classList.add('printing-plan');
        const done = () => document.body.classList.remove('printing-plan');
        window.addEventListener('afterprint', done, { once: true });
        window.print();
        setTimeout(done, 1000);   // fallback for browsers that do not fire afterprint
    }

    function downloadPlanCsv() {
        if (!planner.expenses.length) return;
        const s = planSummary();
        // Quote every cell and double inner quotes so commas or quotes in a description stay in one column.
        const cell = value => `"${String(value).replace(/"/g, '""')}"`;
        const line = values => values.map(cell).join(',');
        const lines = [
            line(['BudgetBasics monthly plan', `Prepared ${fileDate()}`]),
            '',
            line(['Date', 'Category', 'Description', 'Amount (PKR)']),
            ...[...s.expenses].sort((a, b) => a.date.localeCompare(b.date)).map(e => line([e.date, e.category, e.description, e.amount])),
            '',
            line(['Monthly budget', s.budget]),
            line(['Planned spending', s.total]),
            line([s.remaining >= 0 ? 'Balance left' : 'Over budget', Math.abs(s.remaining)]),
            line(['Budget used (%)', s.used.toFixed(1)]),
            line(['Status', s.statusText]),
            '',
            line(['Category', 'Entries', 'Amount (PKR)', 'Share (%)']),
            ...s.categories.map(([name, entry]) => line([name, entry.count, entry.amount, (entry.amount / s.total * 100).toFixed(1)])),
            '',
            line(['50/30/20 part', 'Amount (PKR)', 'Of budget (%)', 'Guide (%)']),
            ...s.guide.map(g => line([g.label, g.amount, g.share.toFixed(1), g.target]))
        ];
        // The byte-order mark makes Excel read the file as UTF-8.
        const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `budgetbasics-plan-${fileDate()}.csv`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        toast('Plan downloaded as a CSV file.');
    }

    function initPlanner() {
        planner.load();
        $('#printPlan').addEventListener('click', printPlan);
        $('#downloadPlan').addEventListener('click', downloadPlanCsv);
        const form = $('#expenseForm'), error = $('#expenseError'), submit = $('#expenseForm button[type="submit"]');
        $('#expenseDate').value = localISODate();
        $('#plannerBudget').value = String(planner.budget);

        const resetForm = () => {
            planner.editingId = null;
            submit.textContent = '+ Add expense';
            $('#expenseDescription').value = '';
            $('#expenseAmount').value = '';
        };

        form.addEventListener('submit', event => {
            event.preventDefault();
            const date = $('#expenseDate').value, category = $('#expenseCategory').value;
            const amountText = $('#expenseAmount').value.trim();
            // Description is optional; an empty one falls back to the category name.
            const description = $('#expenseDescription').value.trim() || `${category} expense`;
            if (!date || !amountText) { error.textContent = 'Add a date and an amount.'; return; }
            if (!isNonNegativeNumber(amountText) || Number(amountText) <= 0) { error.textContent = 'Enter an expense amount greater than zero.'; return; }
            const record = { id: planner.editingId || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`), date, category, description, amount: Number(amountText) };
            if (planner.editingId) {
                planner.expenses = planner.expenses.map(item => item.id === planner.editingId ? record : item);
                toast('Sample expense updated.');
            } else {
                planner.expenses.push(record);
            }
            error.textContent = '';
            resetForm();
            planner.render();
        });

        // One delegated listener handles every Edit and Delete button in the table.
        $('#expenseRows').addEventListener('click', event => {
            const editButton = event.target.closest('[data-edit]'), deleteButton = event.target.closest('[data-delete]');
            if (editButton) {
                const expense = planner.expenses.find(item => item.id === editButton.dataset.edit);
                if (!expense) return;
                planner.editingId = expense.id;
                $('#expenseDate').value = expense.date;
                $('#expenseCategory').value = expense.category;
                $('#expenseDescription').value = expense.description;
                $('#expenseAmount').value = expense.amount;
                submit.textContent = 'Save changes';
                $('#expenseDescription').focus();
            } else if (deleteButton) {
                planner.expenses = planner.expenses.filter(item => item.id !== deleteButton.dataset.delete);
                if (planner.editingId === deleteButton.dataset.delete) resetForm();
                planner.render();
                toast('Sample expense removed.');
            }
        });

        $('#clearExpenses').addEventListener('click', () => {
            if (!planner.expenses.length || !window.confirm('Remove all practice expenses from this tab?')) return;
            planner.expenses = [];
            resetForm();
            planner.render();
            toast('All practice expenses cleared.');
        });

        const budgetInput = $('#plannerBudget');
        budgetInput.addEventListener('input', () => {
            const value = budgetInput.value.trim();
            if (isNonNegativeNumber(value) && Number(value) > 0) planner.setBudget(Number(value), true);
        });
        budgetInput.addEventListener('blur', () => { if (!(Number(budgetInput.value) > 0)) budgetInput.value = String(planner.budget); });
        ['#categoryFilter', '#expenseSort'].forEach(id => $(id).addEventListener('change', () => planner.render()));
        $('#expenseSearch').addEventListener('input', () => planner.render());
        planner.render();
    }

    /* ---------- Infographics gallery filter ---------- */

    function initGalleryFilter() {
        const buttons = $$('[data-filter]');
        buttons.forEach(button => button.addEventListener('click', () => {
            buttons.forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
            const topic = button.dataset.filter;
            $$('.visual-card').forEach(card => { card.hidden = topic !== 'all' && card.dataset.topic !== topic; });
        }));
    }

    /* ---------- BudgetBee rule-based chatbot with optional voice ---------- */

    const chat = {
        answers: (content.chatAnswers || []).map(item => ({ pattern: new RegExp(item.pattern, 'i'), answer: item.answer })),
        shortcuts: (content.chatShortcuts || []).map(item => ({ pattern: new RegExp(item.pattern, 'i'), target: item.target, reply: item.reply })),
        muted: false,
        recognition: null,
        voices: [],
        voice: 'female'
    };
    const VOICE_NAMES = { female: 'Novai', male: 'Leo' };
    const IDLE_STATUS = 'Click the microphone to ask BudgetBee';

    // Tips based on the student's own planner data first, then a general tip.
    function chatTip() {
        const personal = spendingTip();
        if (personal) return `Based on your expense planner: ${personal}`;
        const tips = content.generalTips || [];
        const tip = tips[Math.floor(Math.random() * tips.length)] || '';
        return `${tip} Add a few expenses to the planner and I can tailor the next tip to your spending.`;
    }

    function respond(text) {
        if (/\b(tip|tips|advice|suggest|mashwara)\b/i.test(text)) return chatTip();
        const match = chat.answers.find(item => item.pattern.test(text));
        return match ? match.answer : content.chatFallback;
    }

    function initChatbot() {
        const panel = $('#chatPanel'), launcher = $('#chatLauncher'), messages = $('#chatMessages'), input = $('#chatInput'), voiceStatus = $('#voiceStatus');
        document.body.append(panel);

        const setStatus = (message, state = '') => {
            voiceStatus.textContent = message;
            panel.classList.toggle('listening', state === 'listening');
            panel.classList.toggle('speaking', state === 'speaking');
        };

        const loadVoices = () => { chat.voices = window.speechSynthesis?.getVoices?.() || []; };
        const chooseVoice = gender => {
            const english = chat.voices.filter(voice => /^en(-|_)/i.test(voice.lang));
            const pattern = gender === 'female'
                ? /female|woman|zira|susan|samantha|karen|moira|fiona|victoria|ava|allison|aria|jenny|libby|sara/i
                : /male|man|david|mark|daniel|alex|george|guy|ryan|brian|arthur|fred/i;
            return english.find(voice => pattern.test(voice.name)) || english.find(voice => voice.lang.toLowerCase().startsWith('en-us')) || english[0];
        };
        loadVoices();
        if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

        const speak = text => {
            if (chat.muted || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`${VOICE_NAMES[chat.voice]} here. ${text}`);
            const voice = chooseVoice(chat.voice);
            utterance.lang = voice?.lang || 'en-US';
            if (voice) utterance.voice = voice;
            utterance.rate = .96;
            utterance.pitch = chat.voice === 'female' ? 1.08 : .92;
            utterance.onstart = () => setStatus('🔊 BudgetBee is speaking...', 'speaking');
            utterance.onend = utterance.onerror = () => setStatus(IDLE_STATUS);
            window.speechSynthesis.speak(utterance);
        };

        // Messages are built with textContent so user input can never inject HTML.
        const addMessage = (text, who, shouldSpeak = false) => {
            const node = document.createElement('div');
            node.className = `message ${who}-message`;
            if (who === 'bot') {
                const avatar = document.createElement('img');
                avatar.className = 'message-avatar';
                avatar.dataset.beeAvatar = '';
                avatar.src = `assets/images/budgetbee-avatar${document.body.classList.contains('dark') ? '-dark' : ''}.svg`;
                avatar.alt = '';
                node.append(avatar);
            }
            const body = document.createElement('span');
            body.className = 'message-text';
            body.textContent = text;
            node.append(body);
            if (who === 'bot') {
                const listen = document.createElement('button');
                listen.type = 'button';
                listen.className = 'speak-button';
                listen.setAttribute('aria-label', 'Read response aloud');
                listen.title = 'Read response aloud';
                listen.textContent = '🔊 Listen';
                node.append(listen);
            }
            const time = document.createElement('time');
            time.textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date());
            node.append(time);
            messages.append(node);
            messages.scrollTop = messages.scrollHeight;
            if (shouldSpeak) speak(text);
        };

        const runShortcut = text => {
            const normalized = text.toLowerCase().replace(/[?.!,]/g, '').trim();
            if (/^(stop speaking|stop talking)$/.test(normalized)) { window.speechSynthesis?.cancel(); setStatus('Speech stopped. ' + IDLE_STATUS); return true; }
            const found = chat.shortcuts.find(item => item.pattern.test(normalized));
            if (!found) return false;
            addMessage(found.reply, 'bot', true);
            closeChat();
            document.querySelector(found.target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
            return true;
        };

        const send = (text, { fromVoice = false } = {}) => {
            const clean = text.trim();
            if (!clean) return;
            addMessage(clean, 'user');
            input.value = '';
            if (runShortcut(clean)) return;
            setStatus('Thinking...');
            const typing = document.createElement('div');
            typing.className = 'message bot-message typing-message';
            typing.textContent = 'Thinking...';
            messages.append(typing);
            messages.scrollTop = messages.scrollHeight;
            setTimeout(() => {
                typing.remove();
                // Reset the status first; speech (if any) replaces it with "speaking" when it starts.
                setStatus(fromVoice ? IDLE_STATUS : 'Ask BudgetBee anything');
                addMessage(respond(clean), 'bot', true);
            }, 450);
        };

        const openChat = () => {
            panel.classList.add('open');
            panel.classList.remove('minimized');
            launcher.classList.add('tip-hidden');
            launcher.setAttribute('aria-expanded', 'true');
            launcher.setAttribute('aria-label', 'Close BudgetBee');
            setTimeout(() => input.focus(), 180);
        };
        function closeChat(restoreFocus = false) {
            panel.classList.remove('open', 'minimized');
            launcher.setAttribute('aria-expanded', 'false');
            launcher.setAttribute('aria-label', 'Open BudgetBee');
            if (restoreFocus) launcher.focus();
        }

        $('#chatForm').addEventListener('submit', event => { event.preventDefault(); send(input.value); });
        $$('[data-prompt]').forEach(button => button.addEventListener('click', () => { openChat(); send(button.dataset.prompt); }));
        messages.addEventListener('click', event => {
            const button = event.target.closest('.speak-button');
            if (button) speak(button.parentElement.querySelector('.message-text')?.textContent || '');
        });
        launcher.addEventListener('click', () => panel.classList.contains('open') ? closeChat() : openChat());
        $$('a[href="#chatbot"]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); setMenuOpen(false); openChat(); }));
        $('#chatClose').addEventListener('click', () => closeChat(true));
        $('#chatMinimize').addEventListener('click', () => closeChat());
        $('#clearChat').addEventListener('click', () => { messages.replaceChildren(); addMessage(content.chatWelcome, 'bot'); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel.classList.contains('open')) closeChat(true); });
        document.addEventListener('pointerdown', event => {
            if (panel.classList.contains('open') && !panel.contains(event.target) && !launcher.contains(event.target) && !event.target.closest('a[href="#chatbot"], [data-prompt]')) closeChat();
        });
        setTimeout(() => launcher.classList.add('tip-hidden'), 6500);

        $('#voiceGender').addEventListener('change', event => {
            chat.voice = event.target.value;
            window.speechSynthesis?.cancel();
            setStatus(`${VOICE_NAMES[chat.voice]}'s voice selected. Ask BudgetBee anything`);
        });
        $('#muteToggle').addEventListener('click', event => {
            chat.muted = !chat.muted;
            const button = event.currentTarget;
            button.setAttribute('aria-pressed', String(chat.muted));
            button.setAttribute('aria-label', chat.muted ? 'Unmute speech' : 'Mute speech');
            button.textContent = chat.muted ? '🔇' : '🔊';
            if (chat.muted) { window.speechSynthesis?.cancel(); setStatus('Speech muted. Text chat is still available.'); }
        });
        $('#stopSpeaking').addEventListener('click', () => { window.speechSynthesis?.cancel(); setStatus('Speech stopped. ' + IDLE_STATUS); });

        // Voice input via the Web Speech API where the browser supports it.
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const mic = $('#micButton');
        if (Recognition) {
            mic.addEventListener('click', () => {
                if (chat.recognition) { chat.recognition.stop(); return; }
                const recognition = chat.recognition = new Recognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                recognition.onstart = () => setStatus('🎤 Listening...', 'listening');
                recognition.onresult = event => {
                    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
                    if (!transcript) { setStatus("Sorry, I couldn't hear you. Please try again."); return; }
                    send(transcript, { fromVoice: true });
                };
                recognition.onerror = event => {
                    const permission = ['not-allowed', 'service-not-allowed'].includes(event.error);
                    setStatus(permission ? 'Microphone permission is required for voice commands.' : "Sorry, I couldn't hear you. Please try again.");
                };
                recognition.onend = () => { chat.recognition = null; panel.classList.remove('listening'); };
                try { recognition.start(); } catch { chat.recognition = null; setStatus("Sorry, I couldn't hear you. Please try again."); }
            });
        } else {
            mic.disabled = true;
            mic.setAttribute('aria-disabled', 'true');
            setStatus('Voice commands are not supported in this browser. You can still use the text chatbot.');
        }
        if (!('speechSynthesis' in window)) { $('#muteToggle').disabled = true; $('#stopSpeaking').disabled = true; }
    }

    /* ---------- Search, sort and filter learning topics ---------- */

    function initSearch() {
        const index = content.searchIndex || [];
        const input = $('#searchInput'), sort = $('#searchSort'), result = $('#searchResults');
        const chips = $$('[data-search]');

        // Relevance: a title match counts most, then keywords, then the description.
        const score = (item, query) => {
            const words = query.split(/\s+/).filter(Boolean);
            return words.reduce((total, word) => total
                + (item.title.toLowerCase().includes(word) ? 3 : 0)
                + (item.keywords.toLowerCase().includes(word) ? 2 : 0)
                + (item.description.toLowerCase().includes(word) ? 1 : 0), 0);
        };

        const run = () => {
            const query = input.value.trim().toLowerCase();
            if (!query) { result.textContent = 'Enter a topic to search the learning guide.'; return; }
            const words = query.split(/\s+/).filter(Boolean);
            const matches = index
                .map(item => ({ item, score: score(item, query) }))
                .filter(({ item }) => words.every(word => `${item.title} ${item.description} ${item.keywords} ${item.topic}`.toLowerCase().includes(word)));
            const order = {
                relevance: (a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title),
                az: (a, b) => a.item.title.localeCompare(b.item.title),
                za: (a, b) => b.item.title.localeCompare(a.item.title)
            };
            matches.sort(order[sort.value] || order.relevance);
            result.innerHTML = matches.length
                ? `<p>${plural(matches.length, 'result')} for “${escapeHtml(query)}”</p>` + matches.map(({ item }) => `<div class="search-result"><a href="${item.href}"><b>${escapeHtml(item.title)}</b> →</a><span class="result-topic">${escapeHtml(item.topic)}</span><br>${escapeHtml(item.description)}</div>`).join('')
                : `<p>No learning topics found for “${escapeHtml(query)}”. Try budget, needs, wants, expenses, goals, or saving.</p>`;
        };

        $('#searchForm').addEventListener('submit', event => { event.preventDefault(); chips.forEach(chip => chip.classList.toggle('active', chip.dataset.search === input.value.trim().toLowerCase())); run(); });
        sort.addEventListener('change', () => { if (input.value.trim()) run(); });
        chips.forEach(chip => chip.addEventListener('click', () => {
            input.value = chip.dataset.search;
            chips.forEach(item => item.classList.toggle('active', item === chip));
            run();
        }));
    }

    /* ---------- Feedback and contact forms (client-side validation only) ---------- */

    const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    function initForms() {
        $('#feedbackForm').addEventListener('submit', event => {
            event.preventDefault();
            const name = $('#feedbackName').value.trim(), email = $('#feedbackEmail').value.trim();
            const rating = $('#feedbackRating').value, comment = $('#feedbackComment').value.trim(), out = $('#feedbackMessage');
            if (!name || !email || !rating || !comment) return setFormMessage(out, 'Please complete each field before submitting.', false);
            if (!validEmail(email)) return setFormMessage(out, 'Please enter a valid email address.', false);
            if (comment.length < 10 || comment.length > 500) return setFormMessage(out, 'Comments must be between 10 and 500 characters.', false);
            setFormMessage(out, `Thank you, ${name}! Your feedback has been received.`, true);
            event.currentTarget.reset();
        });

        $('#contactForm').addEventListener('submit', event => {
            event.preventDefault();
            const name = $('#contactName').value.trim(), email = $('#contactEmail').value.trim();
            const message = $('#contactMessageInput').value.trim(), out = $('#contactMessage');
            if (!name || !email || !message) return setFormMessage(out, 'Please complete each field before submitting.', false);
            if (!validEmail(email)) return setFormMessage(out, 'Please enter a valid email address.', false);
            if (message.length < 10) return setFormMessage(out, 'Please write a message with at least 10 characters.', false);
            setFormMessage(out, `Thanks for reaching out, ${name}! Your message has been received.`, true);
            event.currentTarget.reset();
        });
    }

    /* ---------- Custom cursor (mouse and trackpad only) ---------- */

    // A dot that follows the pointer exactly and a ring that trails it. The ring grows over
    // anything clickable and steps aside over text fields so the normal text caret shows.
    // It switches on at the first real mouse/pen movement (not a media query, which many
    // touchscreen laptops misreport) and hands back the normal cursor on touch.
    // Reduced-motion users get no trailing.
    function initCustomCursor() {
        const root = document.documentElement;
        const dot = document.createElement('div'), ring = document.createElement('div');
        dot.className = 'cursor-dot';
        ring.className = 'cursor-ring';
        dot.setAttribute('aria-hidden', 'true');
        ring.setAttribute('aria-hidden', 'true');
        document.body.append(ring, dot);

        document.addEventListener('pointerdown', event => {
            if (event.pointerType === 'touch') root.classList.remove('has-custom-cursor', 'cursor-visible');
        }, { passive: true });

        const INTERACTIVE = 'a, button, summary, label, select, [role="button"], [data-prompt], [data-search], [data-filter], [data-quiz], .visual-card, .prompt-card, .concept-card, .snapshot-card, .contact-card';
        const PRIMARY = '.button.primary, .nav-cta, .ask-button, .add-expense';
        const TEXT_FIELD = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="date"]), textarea, [contenteditable="true"]';
        const follow = reduceMotion ? 1 : .18;   // ring easing: lower = more trailing
        const MAGNET = .35;                        // how far the ring is pulled toward a small target's centre
        let x = -100, y = -100, ringX = -100, ringY = -100, frame = 0;
        let magnet = null;                         // centre of the small clickable element under the pointer

        const render = () => {
            frame = 0;
            // Magnetic feel: over a button or link the ring settles between the pointer and its centre.
            const aimX = magnet ? x + (magnet.x - x) * MAGNET : x;
            const aimY = magnet ? y + (magnet.y - y) * MAGNET : y;
            ringX += (aimX - ringX) * follow;
            ringY += (aimY - ringY) * follow;
            dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
            if (Math.abs(aimX - ringX) > .1 || Math.abs(aimY - ringY) > .1) frame = requestAnimationFrame(render);
        };
        const request = () => { if (!frame) frame = requestAnimationFrame(render); };

        document.addEventListener('pointermove', event => {
            if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
            x = event.clientX;
            y = event.clientY;
            if (ringX < -50) { ringX = x; ringY = y; }
            root.classList.add('has-custom-cursor', 'cursor-visible');
            const target = event.target instanceof Element ? event.target : null;
            const onText = !!target?.closest(TEXT_FIELD);
            const onInteractive = !onText && !!target?.closest(INTERACTIVE);
            const disabled = onInteractive && !!target.closest('button:disabled, [aria-disabled="true"]');
            // Only small targets (buttons, links, chips) pull the ring; large cards would drag it too far.
            const hoverEl = onInteractive && !disabled ? target.closest(INTERACTIVE) : null;
            const box = hoverEl?.getBoundingClientRect();
            magnet = box && box.width < 360 && box.height < 140 ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : null;
            ring.classList.toggle('is-hover', onInteractive && !disabled);
            ring.classList.toggle('is-primary', onInteractive && !disabled && !!target.closest(PRIMARY));
            ring.classList.toggle('is-disabled', disabled);
            root.classList.toggle('cursor-on-text', onText);
            request();
        }, { passive: true });

        // Click: the ring presses in and a small ripple pulses out from the click point.
        document.addEventListener('pointerdown', event => {
            if (event.pointerType === 'touch' || !root.classList.contains('has-custom-cursor')) return;
            ring.classList.add('is-pressed');
            if (reduceMotion) return;
            const ripple = document.createElement('span');
            ripple.className = 'cursor-ripple';
            ripple.setAttribute('aria-hidden', 'true');
            ripple.style.setProperty('--ripple-pos', `translate3d(${event.clientX}px, ${event.clientY}px, 0)`);
            document.body.append(ripple);
            const remove = () => ripple.remove();
            ripple.addEventListener('animationend', remove, { once: true });
            setTimeout(remove, 800);
        });
        document.addEventListener('pointerup', () => ring.classList.remove('is-pressed'));
        // Scrolling moves elements under a still pointer, so drop any stale magnet target.
        window.addEventListener('scroll', () => { if (magnet) { magnet = null; request(); } }, { passive: true });
        root.addEventListener('pointerleave', () => root.classList.remove('cursor-visible'));
        window.addEventListener('blur', () => root.classList.remove('cursor-visible'));
    }

    /* ---------- Start ---------- */

    initNavigation();
    initTheme();
    initClockAndCounter();
    initScrollChrome();
    initAmbientScene();
    initRevealAndCountUp();
    initCardTilt();
    initTicker();
    initKnowledgeCheck();
    initNeedsWantsGame();
    initBudgetCalculator();
    initSavingsGoal();
    initPlanner();
    initGalleryFilter();
    initChatbot();
    initSearch();
    initForms();
    initCustomCursor();
})();
