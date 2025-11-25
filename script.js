// --- State Management ---
const state = {
    view: 'onboarding', // onboarding, input, timer, completed, roadmap
    username: localStorage.getItem('code_daily_username') || '',
    credits: parseInt(localStorage.getItem('code_daily_credits') || '0'),
    taskName: '',
    duration: 600, // seconds
    timeLeft: 600,
    isTimerActive: false,
    timerInterval: null
};

// --- Config ---
const FEATURES = [
    { id: 'deep-focus', title: 'Deep Focus Mode', description: 'Unlock 25m & 60m timer options.', cost: 500, icon: '⏱️' },
    { id: 'zen-audio', title: 'Zen Audio', description: 'Background ambient sounds.', cost: 1000, icon: '🎧' },
    { id: 'dark-mode', title: 'Midnight Theme', description: 'Dark aesthetic for night coding.', cost: 1500, icon: '🌙' }
];

const DURATIONS = [
    { label: '10m', seconds: 600, locked: false },
    { label: '25m', seconds: 1500, locked: true }, // Needs 500 credits
    { label: '60m', seconds: 3600, locked: true }, // Needs 500 credits
];

// --- Core Functions ---

function init() {
    if (state.username) {
        state.view = 'input';
    }
    render();
}

function setState(updates) {
    Object.assign(state, updates);
    // Persist specific keys
    if (updates.username !== undefined) localStorage.setItem('code_daily_username', state.username);
    if (updates.credits !== undefined) localStorage.setItem('code_daily_credits', state.credits);
    render();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// --- View Renderers ---

function getHeaderHTML() {
    if (state.view === 'onboarding') return '';
    return `
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-100 animate-fade-in">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3 cursor-pointer group" onclick="goToInput()">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                    &lt;/&gt;
                </div>
                <div>
                    <h1 class="text-xl md:text-2xl font-bold text-emerald-900 tracking-tight font-display">Code Daily</h1>
                    <div class="flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <p class="text-xs text-emerald-600 font-medium">Hi, ${state.username}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="goToRoadmap()" class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-emerald-100/50 transition-colors text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    <span>🚀</span> Upgrades
                </button>
                <div onclick="goToRoadmap()" class="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 bg-emerald-100/50 border border-emerald-200 px-4 py-1.5 rounded-full shadow-sm">
                    <div class="text-xl">💎</div>
                    <div class="flex flex-col items-start leading-none">
                        <span class="font-bold text-emerald-800 font-mono text-lg">${state.credits}</span>
                        <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Credits</span>
                    </div>
                </div>
            </div>
        </div>
    </header>
    `;
}

function renderOnboarding() {
    return `
    <div class="w-full max-w-md mx-auto animate-fade-in-up px-4 pt-20">
        <div class="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 md:p-12 text-center relative overflow-hidden">
            <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-100 rounded-full opacity-50 blur-2xl"></div>
            <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-teal-100 rounded-full opacity-50 blur-2xl"></div>
            <div class="relative z-10">
                <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-6 transform -rotate-6">👋</div>
                <h2 class="text-3xl font-bold text-emerald-900 mb-2 font-display">Welcome to Code Daily</h2>
                <p class="text-gray-500 mb-8">What should we call you?</p>
                <form onsubmit="handleLogin(event)" class="space-y-4">
                    <input id="usernameInput" type="text" placeholder="Enter your name" class="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center font-bold text-lg" required autofocus>
                    <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transform transition hover:scale-[1.02]">Let's Go 🚀</button>
                </form>
            </div>
        </div>
    </div>`;
}

function renderInput() {
    const hasDeepFocus = state.credits >= 500;
    
    // Generate duration buttons HTML
    const durationButtons = DURATIONS.map(opt => {
        const isLocked = opt.locked && !hasDeepFocus;
        const isSelected = state.duration === opt.seconds;
        
        if (isLocked) {
            return `
            <button type="button" class="relative px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                ${opt.label}
            </button>`;
        }
        
        return `
        <button type="button" onclick="setDuration(${opt.seconds})" class="relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isSelected ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'}">
            ${opt.label}
        </button>`;
    }).join('');

    return `
    <div class="w-full animate-fade-in-up max-w-2xl mx-auto text-center pt-10">
        <h2 class="text-4xl md:text-5xl font-bold text-emerald-950 mb-6 leading-tight font-display">Ready to Code, ${state.username}?</h2>
        <p class="text-lg text-emerald-800/70 mb-10">Commit to a session. Earn credits.</p>
        
        <form onsubmit="handleStartTask(event)" class="relative mb-6">
            <div class="relative group mb-6">
                <div class="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <div class="relative bg-white rounded-2xl p-2 shadow-xl flex flex-col md:flex-row items-center gap-2">
                    <input id="taskInput" type="text" placeholder="e.g., Refactor Auth Component..." class="flex-1 w-full p-4 text-gray-700 bg-transparent border-none outline-none text-lg font-medium font-sans" required autofocus>
                    <button type="submit" class="px-8 py-4 rounded-xl font-bold text-white shadow-md bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:scale-[1.02] transition">Start Code</button>
                </div>
            </div>
            
            <div class="flex justify-center gap-4">
                ${durationButtons}
            </div>
            <p class="text-center text-emerald-700/60 mt-4 text-sm font-medium">Set your task and focus for ${state.duration / 60} minutes.</p>
        </form>

        <button onclick="goToRoadmap()" class="mt-12 md:hidden text-emerald-600 font-bold text-sm flex items-center gap-1 mx-auto">
            View Feature Roadmap <span class="text-lg">→</span>
        </button>
    </div>`;
}

function renderTimer() {
    const progress = ((state.duration - state.timeLeft) / state.duration) * 100;
    
    return `
    <div class="w-full max-w-md mx-auto animate-fade-in-up pt-10">
        <div class="bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden relative">
            <div class="absolute top-0 left-0 h-2 bg-emerald-500 transition-all duration-1000" style="width: ${progress}%"></div>
            <div class="p-8 flex flex-col items-center text-center">
                <div class="mb-6">
                    <span class="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">Focus Mode</span>
                    <h2 class="text-2xl font-bold text-gray-800 font-display leading-tight break-words max-w-[300px]">${state.taskName}</h2>
                </div>
                <div class="mb-8">
                    <div class="text-8xl font-black text-emerald-600 font-mono tracking-tighter tabular-nums select-none">${formatTime(state.timeLeft)}</div>
                    <p class="text-emerald-900/40 text-sm font-medium mt-2">${state.isTimerActive ? 'Keep coding...' : 'Paused'}</p>
                </div>
                <div class="flex items-center gap-4 w-full">
                    <button onclick="goToInput()" class="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-colors">Exit</button>
                    <button onclick="toggleTimer()" class="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${state.isTimerActive ? 'bg-amber-400 hover:bg-amber-500' : 'bg-emerald-500 hover:bg-emerald-600'}">
                        ${state.isTimerActive ? 'Pause' : 'Resume'}
                    </button>
                </div>
            </div>
        </div>
        <div class="text-center mt-6 text-emerald-800/50 text-sm italic">"One line of code at a time."</div>
    </div>`;
}

function renderCompleted() {
    return `
    <div class="animate-fade-in-up w-full max-w-md mx-auto pt-10">
        <div class="bg-white p-8 rounded-3xl shadow-2xl border-4 border-emerald-100 text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white to-emerald-50 -z-10"></div>
            <div class="mb-6 relative inline-block">
                <div class="absolute inset-0 bg-yellow-200 blur-xl rounded-full opacity-50 animate-pulse-slow"></div>
                <div class="relative text-6xl animate-bounce">💎</div>
            </div>
            <h2 class="text-3xl font-bold text-emerald-900 mb-2 font-display">Awesome, ${state.username}!</h2>
            <p class="text-gray-600 mb-6">You completed <span class="font-bold text-emerald-700">${state.taskName}</span>.</p>
            <div class="bg-emerald-50 rounded-xl p-4 mb-8 border border-emerald-100">
                <p class="text-sm text-emerald-600 font-bold uppercase tracking-wider mb-1">Reward</p>
                <p class="text-4xl font-black text-emerald-600 font-mono">+10 Credits</p>
            </div>
            <button onclick="collectReward()" class="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg transform transition hover:scale-[1.02]">Continue</button>
        </div>
    </div>`;
}

function renderRoadmap() {
    const nextFeature = FEATURES.find(f => f.cost > state.credits);
    const currentLevelCap = nextFeature ? nextFeature.cost : FEATURES[FEATURES.length - 1].cost;
    const prevLevelCap = FEATURES.reduce((acc, f) => (f.cost <= state.credits && f.cost > acc ? f.cost : acc), 0);
    const progressPercent = nextFeature ? Math.max(5, ((state.credits - prevLevelCap) / (currentLevelCap - prevLevelCap)) * 100) : 100;

    const featuresHuTML = FEATURES.map(feature => {
        const isUnlocked = state.credits >= feature.cost;
        return `
        <div class="relative p-6 rounded-2xl border-2 transition-all duration-300 ${isUnlocked ? 'bg-white border-emerald-200 shadow-md' : 'bg-gray-50 border-gray-200 opacity-80'}">
            <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${isUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400 grayscale'}">${feature.icon}</div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-xl font-bold font-display ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}">${feature.title}</h3>
                        ${isUnlocked 
                            ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full tracking-wide">Unlocked</span>' 
                            : `<span class="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-bold uppercase rounded-full tracking-wide flex items-center gap-1">🔒 Locked • ${feature.cost}</span>`
                        }
                    </div>
                    <p class="text-gray-600 text-sm leading-relaxed">${feature.description}</p>
                </div>
            </div>
        </div>`;
    }).join('');

    return `
    <div class="w-full max-w-2xl mx-auto animate-fade-in-up pb-10 pt-6">
        <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-4">
                <button onclick="goToInput()" class="p-2 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h2 class="text-3xl font-bold text-emerald-900 font-display">Feature Roadmap</h2>
            </div>
            <button onclick="handleLogout()" class="text-xs font-bold text-emerald-600 hover:text-red-500 transition-colors px-3 py-1 rounded-full hover:bg-red-50">Not ${state.username}? Sign Out</button>
        </div>

        <div class="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 mb-8 relative overflow-hidden">
            <div class="flex justify-between items-end mb-4">
                <div>
                    <p class="text-emerald-600 font-bold uppercase tracking-wider text-xs">Current Balance</p>
                    <p class="text-5xl font-black text-emerald-800 font-mono">${state.credits}</p>
                </div>
                <div class="text-right">
                    <p class="text-emerald-600/60 font-medium text-sm">Next Unlock</p>
                    <p class="text-emerald-700 font-bold">${nextFeature ? `${nextFeature.cost} Credits` : 'Max Level'}</p>
                </div>
            </div>
            <div class="h-4 bg-emerald-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out relative" style="width: ${progressPercent}%">
                    <div class="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
            </div>
            <p class="text-center mt-3 text-sm text-emerald-600/70 font-medium">
                ${nextFeature ? `${nextFeature.cost - state.credits} more credits to unlock ${nextFeature.title}` : "You have unlocked everything!"}
            </p>
        </div>

        <div class="space-y-4">
            ${featuresHTML}
        </div>
    </div>`;
}

function render() {
    const app = document.getElementById('app');
    
    // Header is always present unless onboarding
    const headerHTML = getHeaderHTML();
    
    let mainHTML = '';
    switch(state.view) {
        case 'onboarding': mainHTML = renderOnboarding(); break;
        case 'input': mainHTML = renderInput(); break;
        case 'timer': mainHTML = renderTimer(); break;
        case 'completed': mainHTML = renderCompleted(); break;
        case 'roadmap': mainHTML = renderRoadmap(); break;
    }

    app.innerHTML = `
        ${headerHTML}
        <main class="max-w-7xl mx-auto px-4 flex-grow w-full flex flex-col items-center">
            ${mainHTML}
        </main>
    `;
}

// --- Event Handlers ---

window.handleLogin = (e) => {
    e.preventDefault();
    const name = document.getElementById('usernameInput').value;
    if (name.trim()) {
        setState({ username: name.trim(), view: 'input' });
    }
};

window.handleLogout = () => {
    localStorage.removeItem('code_daily_username');
    setState({ username: '', view: 'onboarding' });
};

window.setDuration = (seconds) => {
    setState({ duration: seconds });
};

window.handleStartTask = (e) => {
    e.preventDefault();
    const task = document.getElementById('taskInput').value;
    if (task.trim()) {
        setState({ 
            taskName: task.trim(), 
            view: 'timer', 
            timeLeft: state.duration, 
            isTimerActive: true 
        });
        startTimer();
    }
};

window.startTimer = () => {
    if (state.timerInterval) clearInterval(state.timerInterval);
    
    state.timerInterval = setInterval(() => {
        if (!state.isTimerActive) return;
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            setState({ view: 'completed', isTimerActive: false });
        } else {
            state.timeLeft--;
            // Re-render only the timer part? 
            // For simplicity in this vanilla logic, we re-render the whole view. 
            // Ideally we'd target just the ID, but render() is fast enough for this DOM size.
            render();
        }
    }, 1000);
};

window.toggleTimer = () => {
    state.isTimerActive = !state.isTimerActive;
    render();
};

window.collectReward = () => {
    setState({ 
        credits: state.credits + 10,
        view: 'input',
        taskName: ''
    });
};

window.goToInput = () => {
    if (state.timerInterval) clearInterval(state.timerInterval);
    setState({ view: 'input', taskName: '' });
};

window.goToRoadmap = () => {
    if (state.timerInterval) clearInterval(state.timerInterval);
    setState({ view: 'roadmap' });
};

// --- Start ---
init();