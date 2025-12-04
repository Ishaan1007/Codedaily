// ---------------- STATE ----------------
const state = {
    view: 'onboarding', // onboarding, hub, input, timer, completed, roadmap (upgrades), aiRoadmap
    username: localStorage.getItem('code_daily_username') || '',
    credits: parseInt(localStorage.getItem('code_daily_credits') || '0'),
    taskName: '',
    duration: 600,
    selectedDuration: 600,
    timeLeft: 600,
    isTimerActive: false,
    timerInterval: null,
    aiRoadmap: {
        track: '',
        level: '',
        weeks: 8,
        plan: [] // [{week, theme, bullets[]}]
    }
};

const FEATURES = [
    { id: 'deep-focus', title: 'Deep Focus Mode', description: 'Unlock 25m & 60m Deep Focus sessions.', cost: 500, icon: '⏱️' },
    { id: 'zen-audio', title: 'Zen Audio', description: 'Ambient background soundscapes while you code.', cost: 1000, icon: '🎧' },
    { id: 'dark-mode', title: 'Midnight Theme', description: 'Extra polished visual themes & layouts.', cost: 1500, icon: '🌙' }
];

const DURATIONS = [
    { label: '10m', seconds: 600, locked: false },
    { label: '25m', seconds: 1500, locked: true },
    { label: '60m', seconds: 3600, locked: true }
];

// --------------- INIT ------------------
window.onload = function () {
    if (state.username) {
        state.view = 'hub';
    } else {
        state.view = 'onboarding';
    }
    render();
};

// --------------- GLOBAL ACTIONS ------------------
window.handleLogin = function (e) {
    e.preventDefault();
    const input = document.getElementById('username-input');
    const name = input.value.trim();
    if (name) {
        state.username = name;
        localStorage.setItem('code_daily_username', name);
        state.view = 'hub';
        render();
    }
};

window.handleLogout = function () {
    state.username = '';
    localStorage.removeItem('code_daily_username');
    state.view = 'onboarding';
    render();
};

window.setView = function (viewName) {
    state.view = viewName;
    render();
};

window.selectDuration = function (seconds) {
    state.selectedDuration = seconds;
    render();
};

// --------------- FOCUS TIMER ACTIONS -------------
window.handleStartTask = function (e) {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const taskName = input.value.trim();
    if (taskName) {
        state.taskName = taskName;
        state.duration = state.selectedDuration;
        state.timeLeft = state.selectedDuration;
        state.isTimerActive = true;
        state.view = 'timer';
        render();
        startTimerLoop();
    }
};

window.toggleTimer = function () {
    state.isTimerActive = !state.isTimerActive;

    const btn = document.getElementById('btn-pause');
    if (btn) {
        btn.innerText = state.isTimerActive ? 'Pause' : 'Resume';
        btn.className = state.isTimerActive
            ? 'flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 shadow-lg transition-transform active:scale-95 bg-amber-400 hover:bg-amber-500'
            : 'flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 shadow-lg transition-transform active:scale-95 bg-orange-500 hover:bg-orange-600';
    }

    const status = document.getElementById('timer-status');
    if (status) status.innerText = state.isTimerActive ? 'Keep coding...' : 'Paused';

    if (state.isTimerActive) {
        startTimerLoop();
    } else if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }
};

window.cancelTimer = function () {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.isTimerActive = false;
    state.taskName = '';
    state.view = 'hub';
    render();
};

window.collectReward = function () {
    state.credits += 10;
    localStorage.setItem('code_daily_credits', state.credits.toString());
    state.view = 'hub';
    state.taskName = '';
    render();
};

// --------------- AI ROADMAP ACTIONS ---------------
window.handleRoadmapGenerate = function (e) {
    e.preventDefault();
    const track = document.getElementById('track-select').value;
    const level = document.getElementById('level-select').value;
    const weeks = parseInt(document.getElementById('weeks-select').value || '8');

    state.aiRoadmap.track = track;
    state.aiRoadmap.level = level;
    state.aiRoadmap.weeks = weeks;
    state.aiRoadmap.plan = generateRoadmap(track, level, weeks);

    state.view = 'aiRoadmap';
    render();
};

function generateRoadmap(track, level, weeks) {
    // very lightweight "AI style" rule-based generator
    const plan = [];
    const difficultyBoost = level === 'advanced' ? 2 : level === 'intermediate' ? 1 : 0;

    const TRACK_TOPICS = {
        frontend: [
            'HTML fundamentals',
            'CSS layout & Flexbox',
            'Responsive design & media queries',
            'JavaScript basics & DOM',
            'Component-based UI thinking',
            'APIs & data fetching',
            'State management & architecture',
            'Performance & best practices'
        ],
        backend: [
            'HTTP & REST basics',
            'Node.js runtime & npm',
            'Express / routing',
            'Databases & SQL basics',
            'Authentication & security',
            'APIs & documentation',
            'Scaling & caching concepts',
            'Testing & deployment'
        ],
        dsa: [
            'Time & space complexity',
            'Arrays / Strings patterns',
            'Hash maps & sets',
            'Two pointers & sliding window',
            'Recursion & backtracking',
            'Trees & graphs basics',
            'Dynamic programming patterns',
            'Mixed problem sets & contests'
        ]
    };

    const baseTopics = TRACK_TOPICS[track] || TRACK_TOPICS.frontend;
    const topicsPerWeek = Math.max(1, Math.round(baseTopics.length / weeks));

    let topicIndex = 0;
    for (let i = 1; i <= weeks; i++) {
        const slice = baseTopics.slice(topicIndex, topicIndex + topicsPerWeek);
        topicIndex += topicsPerWeek;

        const intensity = difficultyBoost + (i > weeks * 0.7 ? 1 : 0);
        const practiceLabel =
            intensity === 0 ? 'Light practice & notes' :
            intensity === 1 ? 'Daily coding practice' :
            intensity === 2 ? 'Timed challenges & mini projects' :
            'Interview-style questions & revision';

        plan.push({
            week: i,
            theme: slice.join(' • ') || 'Mixed revision & project polish',
            bullets: [
                `Study: ${slice.length ? slice.join(', ') : 'Consolidate previous weeks.'}`,
                practiceLabel,
                'End-of-week reflection: log what felt easy vs confusing.'
            ]
        });
    }

    return plan;
}

// --------------- TIMER CORE -----------------------
function startTimerLoop() {
    if (state.timerInterval) clearInterval(state.timerInterval);

    state.timerInterval = setInterval(() => {
        if (state.timeLeft > 0) {
            state.timeLeft--;

            const display = document.getElementById('timer-display');
            const bar = document.getElementById('timer-bar');

            if (display) display.innerText = formatTime(state.timeLeft);
            if (bar) {
                const pct = ((state.duration - state.timeLeft) / state.duration) * 100;
                bar.style.width = `${pct}%`;
            }
        } else {
            clearInterval(state.timerInterval);
            state.isTimerActive = false;
            state.view = 'completed';
            render();
        }
    }, 1000);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --------------- RENDER ---------------------------
function render() {
    const app = document.getElementById('app');

    if (state.view !== 'timer' && state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    let html = '';

    if (state.view === 'onboarding') {
        html = getOnboardingHTML();
    } else {
        html += getHeaderHTML();
        html += `<main class="max-w-7xl mx-auto px-4 pt-8 md:pt-12 flex flex-col min-h-[60vh]">`;

        if (state.view === 'hub') {
            html += getHubHTML();
        } else if (state.view === 'input') {
            html += getInputHTML();
        } else if (state.view === 'timer') {
            html += getTimerHTML();
        } else if (state.view === 'completed') {
            html += getCompletedHTML();
        } else if (state.view === 'roadmap') {
            html += getUpgradesHTML();
        } else if (state.view === 'aiRoadmap') {
            html += getAiRoadmapHTML();
        }

        html += `</main>`;
    }

    app.innerHTML = html;
}

// --------------- UI SECTIONS ----------------------

function getHeaderHTML() {
    return `
    <header class="bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-500/40 shadow-[0_0_25px_rgba(249,115,22,0.45)] animate-fade-in">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3 cursor-pointer group" onclick="setView('hub')">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-xl shadow-[0_0_18px_rgba(249,115,22,0.9)] transform group-hover:rotate-12 transition-transform duration-300">
                    &lt;/&gt;
                </div>
                <div>
                    <h1 class="text-xl md:text-2xl font-bold text-orange-100 tracking-tight font-display">Code Daily</h1>
                    <div class="flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.9)]"></span>
                        <p class="text-xs text-orange-200 font-medium">Hi, ${state.username}</p>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button onclick="setView('roadmap')" class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-800/80 transition-colors text-xs font-bold text-orange-300 uppercase tracking-wide">
                    <span>🚀</span> Upgrades
                </button>
                <div onclick="setView('roadmap')" class="cursor-pointer hover:opacity-80 transition-opacity">
                   <div class="flex items-center gap-2 bg-slate-900 border border-orange-500/60 px-4 py-1.5 rounded-full shadow-[0_0_18px_rgba(249,115,22,0.7)]">
                      <div class="text-xl">💎</div>
                      <div class="flex flex-col items-start leading-none">
                        <span class="font-bold text-orange-300 font-mono text-lg">${state.credits}</span>
                        <span class="text-[10px] text-orange-400/80 font-bold uppercase tracking-wider">Credits</span>
                      </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
    `;
}

function getOnboardingHTML() {
    return `
    <div class="min-h-screen flex items-center justify-center p-4 hero-grid">
        <div class="w-full max-w-md mx-auto animate-fade-in-up">
            <div class="bg-slate-900 rounded-3xl shadow-[0_0_35px_rgba(249,115,22,0.45)] border border-orange-500/40 p-8 md:p-12 text-center relative overflow-hidden">
                <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-orange-500/20 rounded-full opacity-70 blur-2xl"></div>
                <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-amber-400/20 rounded-full opacity-70 blur-2xl"></div>

                <div class="relative z-10">
                    <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-[0_0_28px_rgba(249,115,22,1)] mb-6 transform -rotate-6">👋</div>
                    <h2 class="text-3xl font-bold text-orange-100 mb-2 font-display">Welcome to Code Daily</h2>
                    <p class="text-slate-300 mb-8">Let&apos;s personalize your focus journey. What should we call you?</p>
                    
                    <form onsubmit="handleLogin(event)" class="space-y-4">
                        <input id="username-input" type="text" placeholder="Enter your name" class="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-orange-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-slate-950 transition-all text-center font-bold text-lg" autofocus required />
                        <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-slate-950 shadow-[0_0_22px_rgba(249,115,22,0.9)] transition-all duration-200 transform bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-500 hover:to-amber-500 hover:scale-[1.02] active:scale-95">Enter Workspace 🚀</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
}

// ---- HUB (two big tools) ----
function getHubHTML() {
    return `
    <section class="flex-1 hero-grid pb-12">
        <div class="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div class="flex-1 pt-4 md:pt-8">
                <p class="text-xs font-bold tracking-[0.25em] uppercase text-orange-400/80 mb-3">Coding Companion</p>
                <h2 class="text-4xl md:text-6xl font-black text-orange-100 font-display leading-tight mb-4 drop-shadow-[0_0_26px_rgba(249,115,22,0.7)]">
                    Code Daily
                </h2>
                <p class="text-slate-300 text-base md:text-lg max-w-xl mb-6">
                    Switch between deep-focus coding sessions and an AI-style roadmap generator that maps your learning weeks ahead.
                </p>
                <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
                    <span class="px-3 py-1 rounded-full border border-orange-500/60 bg-slate-950/70 text-orange-300 font-semibold uppercase tracking-wide">Neon Dark UI</span>
                    <span class="px-3 py-1 rounded-full border border-slate-700 bg-slate-900/70">No login, just browser memory</span>
                </div>
            </div>

            <div class="flex-1 w-full max-w-xl mx-auto">
                <div class="grid gap-4 md:grid-cols-2">
                    <!-- Deep Focus Lab -->
                    <button onclick="setView('input')" class="relative group text-left rounded-2xl border border-orange-500/60 bg-slate-950/90 p-5 shadow-[0_0_26px_rgba(249,115,22,0.5)] overflow-hidden transition-transform duration-200 hover:-translate-y-1">
                        <div class="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl opacity-60 group-hover:opacity-90"></div>
                        <div class="relative z-10">
                            <p class="text-xs font-bold text-orange-300 uppercase tracking-[0.2em] mb-1">Tool 01</p>
                            <h3 class="text-xl font-display font-bold text-orange-100 mb-2 flex items-center gap-2">
                                Deep Focus Lab
                                <span class="text-base">⏱️</span>
                            </h3>
                            <p class="text-sm text-slate-300 mb-4">
                                Create a clear task, lock in a timer, and earn credits every time you finish a focused coding sprint.
                            </p>
                            <p class="text-xs text-orange-300 flex items-center gap-1">
                                Start a sprint <span>→</span>
                            </p>
                        </div>
                    </button>

                    <!-- PathForge AI -->
                    <button onclick="setView('aiRoadmap')" class="relative group text-left rounded-2xl border border-slate-700 bg-slate-950/80 p-5 shadow-[0_0_22px_rgba(15,23,42,0.9)] overflow-hidden transition-transform duration-200 hover:-translate-y-1">
                        <div class="absolute -bottom-12 -left-10 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl opacity-70 group-hover:opacity-95"></div>
                        <div class="relative z-10">
                            <p class="text-xs font-bold text-orange-300/80 uppercase tracking-[0.2em] mb-1">Tool 02</p>
                            <h3 class="text-xl font-display font-bold text-orange-100 mb-2 flex items-center gap-2">
                                PathForge AI
                                <span class="text-base">🧠</span>
                            </h3>
                            <p class="text-sm text-slate-300 mb-4">
                                Pick your track, level and weeks. Get a week-by-week skill roadmap that feels like an AI coach planned it.
                            </p>
                            <p class="text-xs text-orange-300 flex items-center gap-1">
                                Forge my roadmap <span>→</span>
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>

        <button onclick="setView('roadmap')" class="mt-10 self-start text-orange-300 font-bold text-xs flex items-center gap-1">
            View upgrade roadmap <span class="text-base">→</span>
        </button>
    </section>
    `;
}

// ---- Original focus timer setup screen ----
function getInputHTML() {
    const hasDeepFocus = state.credits >= 500;

    const buttonsHTML = DURATIONS.map(opt => {
        const isLocked = opt.locked && !hasDeepFocus;
        const isSelected = state.selectedDuration === opt.seconds;

        let classes = "relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ";
        if (isLocked) {
            classes += "bg-slate-800 text-slate-500 cursor-not-allowed border border-transparent";
        } else if (isSelected) {
            classes += "bg-slate-900 text-orange-300 border border-orange-500 ring-2 ring-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.6)]";
        } else {
            classes += "bg-slate-900 text-slate-300 border border-slate-700 hover:border-orange-500 hover:text-orange-300 cursor-pointer";
        }

        const onclick = isLocked ? '' : `onclick="selectDuration(${opt.seconds})"`;
        const lockIcon = isLocked ? '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>' : '';

        return `<button type="button" ${onclick} class="${classes}">${lockIcon}${opt.label}</button>`;
    }).join('');

    return `
    <div class="w-full animate-fade-in-up">
        <div class="text-center mb-10">
            <p class="text-xs uppercase tracking-[0.25em] text-orange-400/80 mb-3">Tool 01 · Deep Focus Lab</p>
            <h2 class="text-3xl md:text-4xl font-bold text-orange-100 mb-3 leading-tight font-display">Set your next coding sprint</h2>
            <p class="text-lg text-slate-300 max-w-2xl mx-auto">Define one clear task. Commit to a short, intense timer. Earn credits when you ship.</p>
            ${!hasDeepFocus ? `<p class="text-sm text-orange-400/80 mt-2 font-medium">${500 - state.credits} more credits to unlock 25m & 60m Deep Focus.</p>` : ''}
        </div>

        <div class="w-full max-w-2xl mx-auto">
            <form onsubmit="handleStartTask(event)" class="relative">
                <div class="relative group mb-6">
                    <div class="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-200"></div>
                    <div class="relative bg-slate-950 rounded-2xl p-2 shadow-[0_0_32px_rgba(249,115,22,0.35)] flex flex-col md:flex-row items-center gap-2">
                        <input id="task-input" type="text" placeholder="e.g., Build navbar for landing page..." class="flex-1 w-full p-4 text-slate-100 bg-transparent border-none outline-none focus:ring-0 placeholder-slate-500 text-lg font-medium font-sans" autofocus required />
                        <button type="submit" class="px-8 py-4 rounded-xl font-bold text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.9)] transition-all duration-200 flex items-center justify-center min-w-[160px] font-display bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-500 hover:to-amber-500 hover:scale-[1.02] active:scale-95">Start sprint</button>
                    </div>
                </div>

                <div class="flex justify-center gap-4">
                    ${buttonsHTML}
                </div>

                <p class="text-center text-slate-400 mt-4 text-sm font-medium">You’re planning a ${state.selectedDuration / 60}-minute focus window.</p>
            </form>
        </div>
    </div>
    `;
}

function getTimerHTML() {
    const progress = ((state.duration - state.timeLeft) / state.duration) * 100;

    return `
    <div class="w-full max-w-md mx-auto animate-fade-in-up">
        <div class="bg-slate-950 rounded-3xl shadow-[0_0_40px_rgba(249,115,22,0.4)] border border-orange-500/40 overflow-hidden relative">
            <div id="timer-bar" class="absolute top-0 left-0 h-2 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 transition-all duration-1000 linear" style="width: ${progress}%"></div>
            
            <div class="p-8 flex flex-col items-center text-center">
                <div class="mb-6">
                    <span class="inline-block px-3 py-1 rounded-full bg-slate-900 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/50 shadow-[0_0_16px_rgba(249,115,22,0.6)]">Deep Focus Lab</span>
                    <h2 class="text-2xl font-bold text-slate-50 font-display leading-tight break-words max-w-[300px]">${state.taskName}</h2>
                </div>

                <div class="mb-8 relative flex items-center justify-center h-32 w-full">
                    <div id="timer-display" class="text-8xl font-black text-orange-400 font-mono tracking-tighter tabular-nums leading-none select-none drop-shadow-[0_0_24px_rgba(249,115,22,0.9)]">${formatTime(state.timeLeft)}</div>
                    <p id="timer-status" class="text-orange-300/70 text-sm font-medium absolute -bottom-6 left-0 right-0">${state.isTimerActive ? 'Keep coding...' : 'Paused'}</p>
                </div>

                <div class="flex items-center gap-4 w-full mt-8">
                    <button onclick="cancelTimer()" class="flex-1 py-3 px-4 rounded-xl border-2 border-slate-700 text-slate-300 font-bold hover:bg-slate-900 hover:text-orange-200 transition-colors">Exit</button>
                    <button id="btn-pause" onclick="toggleTimer()" class="flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 shadow-lg transition-transform active:scale-95 bg-amber-400 hover:bg-amber-500">Pause</button>
                </div>
            </div>
        </div>
        <div class="text-center mt-6 text-slate-500 text-sm italic">"One focused sprint beats ten distracted hours."</div>
    </div>
    `;
}

function getCompletedHTML() {
    return `
    <div class="animate-fade-in-up w-full max-w-md">
        <div class="bg-slate-950 p-8 rounded-3xl shadow-[0_0_40px_rgba(249,115,22,0.4)] border-4 border-orange-500/50 text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-slate-950 -z-10"></div>
            
            <div class="mb-6 relative inline-block">
                <div class="absolute inset-0 bg-orange-400/50 blur-2xl rounded-full opacity-70 animate-pulse-slow"></div>
                <div class="relative text-6xl drop-shadow-[0_0_25px_rgba(249,115,22,1)]">💎</div>
            </div>

            <h2 class="text-3xl font-bold text-orange-100 mb-2 font-display">Nice session, ${state.username}!</h2>
            <p class="text-slate-300 mb-6">You completed <span class="font-bold text-orange-300">${state.taskName}</span>.</p>
            
            <div class="bg-slate-900 rounded-xl p-4 mb-8 border border-orange-500/40">
                <p class="text-sm text-orange-400 font-bold uppercase tracking-wider mb-1">Reward</p>
                <p class="text-4xl font-black text-orange-300 font-mono drop-shadow-[0_0_20px_rgba(249,115,22,0.9)]">+10 Credits</p>
            </div>
            
            <button onclick="collectReward()" class="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-slate-950 font-bold text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.9)] transform transition-all duration-200 hover:scale-[1.02] active:scale-95">Back to hub</button>
        </div>
    </div>
    `;
}

// ---- Upgrade roadmap (old roadmap view) ----
function getUpgradesHTML() {
    const nextFeature = FEATURES.find(f => f.cost > state.credits);
    const currentLevelCap = nextFeature ? nextFeature.cost : FEATURES[FEATURES.length - 1].cost;
    const prevLevelCap = FEATURES.reduce((acc, f) => (f.cost <= state.credits && f.cost > acc ? f.cost : acc), 0);
    
    let progressPercent = 100;
    if (nextFeature) {
        progressPercent = Math.max(5, ((state.credits - prevLevelCap) / (currentLevelCap - prevLevelCap)) * 100);
    }

    let featuresHTML = '';
    FEATURES.forEach(feature => {
        const isUnlocked = state.credits >= feature.cost;
        const iconClass = isUnlocked ? 'bg-slate-900 text-orange-300 shadow-[0_0_18px_rgba(249,115,22,0.7)]' : 'bg-slate-800 text-slate-500 grayscale';
        const cardClass = isUnlocked ? 'bg-slate-950 border-orange-500/50 shadow-[0_0_24px_rgba(249,115,22,0.45)]' : 'bg-slate-900 border-slate-700 opacity-80';
        
        featuresHTML += `
        <div class="relative p-6 rounded-2xl border-2 transition-all duration-300 ${cardClass}">
            <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${iconClass}">${feature.icon}</div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-xl font-bold font-display ${isUnlocked ? 'text-orange-100' : 'text-slate-500'}">${feature.title}</h3>
                        ${isUnlocked 
                            ? '<span class="px-2 py-0.5 bg-slate-900 text-orange-300 text-[10px] font-bold uppercase rounded-full tracking-wide border border-orange-500/60">Unlocked</span>'
                            : `<span class="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-full tracking-wide flex items-center gap-1 border border-slate-700">Locked • ${feature.cost}</span>`
                        }
                    </div>
                    <p class="text-slate-300 text-sm leading-relaxed">${feature.description}</p>
                </div>
            </div>
        </div>
        `;
    });

    return `
    <div class="w-full max-w-2xl mx-auto animate-fade-in-up pb-10">
        <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-4">
                <button onclick="setView('hub')" class="p-2 rounded-full hover:bg-slate-800 text-orange-300 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m7 7h18" /></svg>
                </button>
                <h2 class="text-3xl font-bold text-orange-100 font-display">Upgrade Roadmap</h2>
            </div>
            <button onclick="handleLogout()" class="text-xs font-bold text-orange-300 hover:text-red-400 transition-colors px-3 py-1 rounded-full hover:bg-red-500/10">Not ${state.username}? Sign Out</button>
        </div>

        <div class="bg-slate-950 rounded-3xl shadow-[0_0_35px_rgba(249,115,22,0.5)] border border-orange-500/40 p-8 mb-8 relative overflow-hidden">
            <div class="flex justify-between items-end mb-4">
                <div>
                    <p class="text-orange-400 font-bold uppercase tracking-wider text-xs">Current Balance</p>
                    <p class="text-5xl font-black text-orange-200 font-mono drop-shadow-[0_0_20px_rgba(249,115,22,0.9)]">${state.credits}</p>
                </div>
                <div class="text-right">
                    <p class="text-slate-400 font-medium text-sm">Next Unlock</p>
                    <p class="text-orange-300 font-bold">${nextFeature ? nextFeature.cost + ' credits' : 'All tools unlocked'}</p>
                </div>
            </div>
            
            <div class="h-4 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 transition-all duration-1000 ease-out relative" style="width: ${progressPercent}%">
                    <div class="absolute top-0 left-0 w-full h-full bg-white/10 animate-pulse"></div>
                </div>
            </div>
            <p class="text-center mt-3 text-sm text-slate-300 font-medium">
                ${nextFeature ? (nextFeature.cost - state.credits) + ' more credits to unlock ' + nextFeature.title : 'You’ve reached the current max level.'}
            </p>
        </div>

        <div class="space-y-4">
            ${featuresHTML}
        </div>
    </div>
    `;
}

// ---- AI Roadmap Maker UI ----
function getAiRoadmapHTML() {
    const { track, level, weeks, plan } = state.aiRoadmap;

    const prettyTrack =
        track === 'frontend' ? 'Frontend' :
        track === 'backend' ? 'Backend' :
        track === 'dsa' ? 'DSA / Problem Solving' :
        'Choose a track';

    const prettyLevel =
        level === 'beginner' ? 'Beginner' :
        level === 'intermediate' ? 'Intermediate' :
        level === 'advanced' ? 'Advanced' :
        'Select level';

    const hasPlan = plan && plan.length > 0;

    return `
    <section class="w-full animate-fade-in-up pb-10">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
                <button onclick="setView('hub')" class="p-2 rounded-full hover:bg-slate-800 text-orange-300 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m7 7h18" /></svg>
                </button>
                <div>
                    <p class="text-xs uppercase tracking-[0.25em] text-orange-400/80 mb-1">Tool 02 · PathForge AI</p>
                    <h2 class="text-3xl font-bold text-orange-100 font-display">Roadmap prediction</h2>
                </div>
            </div>
            <span class="hidden md:inline-block text-xs text-slate-400 max-w-xs text-right">
                100% frontend-based logic. No external AI calls. Still feels like an AI planning your journey.
            </span>
        </div>

        <div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
            <!-- Form -->
            <form onsubmit="handleRoadmapGenerate(event)" class="bg-slate-950 rounded-3xl border border-orange-500/40 shadow-[0_0_28px_rgba(249,115,22,0.4)] p-6 space-y-4">
                <p class="text-sm text-slate-300 mb-1">Tell PathForge what you want to master.</p>

                <label class="block text-sm font-semibold text-orange-200 mb-1">Track</label>
                <select id="track-select" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="frontend" ${track === 'frontend' ? 'selected' : ''}>Frontend (HTML / CSS / JS)</option>
                    <option value="backend" ${track === 'backend' ? 'selected' : ''}>Backend (Node / APIs)</option>
                    <option value="dsa" ${track === 'dsa' ? 'selected' : ''}>DSA / Problem Solving</option>
                </select>

                <label class="block text-sm font-semibold text-orange-200 mb-1 mt-2">Current Level</label>
                <select id="level-select" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="beginner" ${level === 'beginner' ? 'selected' : ''}>Beginner (just starting)</option>
                    <option value="intermediate" ${level === 'intermediate' ? 'selected' : ''}>Intermediate (built a few projects)</option>
                    <option value="advanced" ${level === 'advanced' ? 'selected' : ''}>Advanced (confident, want polish)</option>
                </select>

                <label class="block text-sm font-semibold text-orange-200 mb-1 mt-2">Duration</label>
                <select id="weeks-select" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="4" ${weeks === 4 ? 'selected' : ''}>4 weeks – sprint</option>
                    <option value="8" ${weeks === 8 ? 'selected' : ''}>8 weeks – balanced</option>
                    <option value="12" ${weeks === 12 ? 'selected' : ''}>12 weeks – deep dive</option>
                    <option value="16" ${weeks === 16 ? 'selected' : ''}>16 weeks – slow & steady</option>
                </select>

                <button type="submit" class="mt-4 w-full py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-500 hover:to-amber-500 shadow-[0_0_24px_rgba(249,115,22,0.9)] transform transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm">
                    <span>Predict my roadmap</span>
                    <span class="text-lg">⚡</span>
                </button>

                <p class="text-[11px] text-slate-500 mt-2">
                    Hint: Generate a roadmap, then open <span class="text-orange-300 font-semibold">Deep Focus Lab</span> and convert each week into sessions.
                </p>
            </form>

            <!-- Plan -->
            <div class="space-y-4">
                ${hasPlan ? `
                <div class="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-[0_0_22px_rgba(15,23,42,0.9)]">
                    <p class="text-xs text-orange-300 uppercase tracking-[0.25em] mb-1">Prediction summary</p>
                    <h3 class="text-lg font-semibold text-orange-100 mb-1">${prettyTrack} · ${prettyLevel}</h3>
                    <p class="text-xs text-slate-400">${weeks} week roadmap generated just now.</p>
                </div>

                <div class="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    ${plan.map(block => `
                        <div class="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 relative">
                            <div class="absolute -left-2 top-4 w-1 h-10 rounded-full bg-gradient-to-b from-orange-500 to-amber-400 shadow-[0_0_12px_rgba(249,115,22,0.9)]"></div>
                            <div class="pl-3">
                                <p class="text-[11px] uppercase tracking-[0.2em] text-orange-400/80 mb-1">Week ${block.week}</p>
                                <h4 class="text-sm font-semibold text-orange-100 mb-2">${block.theme}</h4>
                                <ul class="text-xs text-slate-300 space-y-1 list-disc list-inside">
                                    ${block.bullets.map(b => `<li>${b}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : `
                <div class="h-full flex flex-col items-center justify-center text-center bg-slate-950 rounded-3xl border border-slate-800 shadow-[0_0_22px_rgba(15,23,42,0.9)] p-6">
                    <div class="mb-4 text-4xl">🧠</div>
                    <h3 class="text-lg font-semibold text-orange-100 mb-2">No roadmap yet</h3>
                    <p class="text-sm text-slate-300 max-w-md mb-2">
                        Choose your track, level and duration on the left, then hit <span class="text-orange-300 font-semibold">Predict my roadmap</span>. You’ll get a week-by-week plan instantly.
                    </p>
                    <p class="text-[11px] text-slate-500">
                        Everything runs right in your browser. No external AI calls, no account needed.
                    </p>
                </div>
                `}
            </div>
        </div>
    </section>
    `;
}