
// --- State Management ---
const state = {
    view: 'onboarding', // onboarding, input, timer, completed, roadmap
    username: localStorage.getItem('code_daily_username') || '',
    credits: parseInt(localStorage.getItem('code_daily_credits') || '0'),
    taskName: '',
    duration: 600, // seconds
    selectedDuration: 600,
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
    { label: '25m', seconds: 1500, locked: true }, 
    { label: '60m', seconds: 3600, locked: true }, 
];

// --- Initialization ---
window.onload = function() {
    // Determine initial view
    if (state.username) {
        state.view = 'input';
    } else {
        state.view = 'onboarding';
    }
    render();
};

// --- Action Handlers ---

window.handleLogin = function(e) {
    e.preventDefault();
    const input = document.getElementById('username-input');
    const name = input.value.trim();
    if (name) {
        state.username = name;
        localStorage.setItem('code_daily_username', name);
        state.view = 'input';
        render();
    }
};

window.handleLogout = function() {
    state.username = '';
    localStorage.removeItem('code_daily_username');
    state.view = 'onboarding';
    render();
};

window.setView = function(viewName) {
    state.view = viewName;
    render();
};

window.selectDuration = function(seconds) {
    state.selectedDuration = seconds;
    render(); // Re-render to update the styling of the selected button
};

window.handleStartTask = function(e) {
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
        // Start the timer logic immediately
        startTimerLoop();
    }
};

window.toggleTimer = function() {
    state.isTimerActive = !state.isTimerActive;
    
    // Update button text directly
    const btn = document.getElementById('btn-pause');
    if (btn) btn.innerText = state.isTimerActive ? 'Pause' : 'Resume';
    if (btn) btn.className = state.isTimerActive 
        ? 'flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-amber-400 hover:bg-amber-500'
        : 'flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-emerald-500 hover:bg-emerald-600';

    // Update status text
    const status = document.getElementById('timer-status');
    if (status) status.innerText = state.isTimerActive ? 'Keep coding...' : 'Paused';

    if (state.isTimerActive) {
        startTimerLoop();
    } else {
        if (state.timerInterval) clearInterval(state.timerInterval);
    }
};

window.cancelTimer = function() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.isTimerActive = false;
    state.taskName = '';
    state.view = 'input';
    render();
};

window.collectReward = function() {
    state.credits += 10;
    localStorage.setItem('code_daily_credits', state.credits.toString());
    state.view = 'input';
    state.taskName = '';
    render();
};

// --- Timer Logic ---

function startTimerLoop() {
    if (state.timerInterval) clearInterval(state.timerInterval);

    state.timerInterval = setInterval(() => {
        if (state.timeLeft > 0) {
            state.timeLeft--;
            
            // DIRECT DOM UPDATE - No re-render
            const display = document.getElementById('timer-display');
            const bar = document.getElementById('timer-bar');
            
            if (display) {
                display.innerText = formatTime(state.timeLeft);
            }
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

// --- HTML Generators ---

function render() {
    const app = document.getElementById('app');
    
    // Clear any existing intervals if we are moving AWAY from the timer view
    if (state.view !== 'timer' && state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    let html = '';

    if (state.view === 'onboarding') {
        html = getOnboardingHTML();
    } else {
        // Shared layout for internal views
        html += getHeaderHTML();
        html += `<main class="max-w-7xl mx-auto px-4 pt-8 md:pt-12 flex flex-col items-center justify-center min-h-[60vh]">`;
        
        if (state.view === 'input') {
            html += getInputHTML();
        } else if (state.view === 'roadmap') {
            html += getRoadmapHTML();
        } else if (state.view === 'timer') {
            html += getTimerHTML();
        } else if (state.view === 'completed') {
            html += getCompletedHTML();
        }
        
        html += `</main>`;
    }

    app.innerHTML = html;
}

function getHeaderHTML() {
    return `
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-100 transition-all duration-300 animate-fade-in">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3 cursor-pointer group" onclick="setView('input')">
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
                <button onclick="setView('roadmap')" class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-emerald-100/50 transition-colors text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    <span>🚀</span> Upgrades
                </button>
                <div onclick="setView('roadmap')" class="cursor-pointer hover:opacity-80 transition-opacity">
                   <div class="flex items-center gap-2 bg-emerald-100/50 border border-emerald-200 px-4 py-1.5 rounded-full shadow-sm">
                      <div class="text-xl">💎</div>
                      <div class="flex flex-col items-start leading-none">
                        <span class="font-bold text-emerald-800 font-mono text-lg">${state.credits}</span>
                        <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Credits</span>
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
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md mx-auto animate-fade-in-up">
            <div class="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 md:p-12 text-center relative overflow-hidden">
                <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-100 rounded-full opacity-50 blur-2xl"></div>
                <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-teal-100 rounded-full opacity-50 blur-2xl"></div>

                <div class="relative z-10">
                    <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-6 transform -rotate-6">👋</div>
                    <h2 class="text-3xl font-bold text-emerald-900 mb-2 font-display">Welcome to Code Daily</h2>
                    <p class="text-gray-500 mb-8">Let's personalize your focus journey. What should we call you?</p>
                    
                    <form onsubmit="handleLogin(event)" class="space-y-4">
                        <input id="username-input" type="text" placeholder="Enter your name" class="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 placeholder-emerald-800/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all text-center font-bold text-lg" autofocus required />
                        <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-200 transform bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:scale-[1.02] active:scale-95">Let's Go 🚀</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
}

function getInputHTML() {
    const hasDeepFocus = state.credits >= 500;
    
    // Duration Buttons Logic
    const buttonsHTML = DURATIONS.map(opt => {
        const isLocked = opt.locked && !hasDeepFocus;
        const isSelected = state.selectedDuration === opt.seconds;
        
        let classes = "relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 ";
        if (isLocked) {
            classes += "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent";
        } else if (isSelected) {
            classes += "bg-emerald-100 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm";
        } else {
            classes += "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 cursor-pointer";
        }

        const onclick = isLocked ? '' : `onclick="selectDuration(${opt.seconds})"`;
        const lockIcon = isLocked ? '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>' : '';

        return `<button type="button" ${onclick} class="${classes}">${lockIcon}${opt.label}</button>`;
    }).join('');

    return `
    <div class="w-full animate-fade-in-up">
        <div class="text-center mb-10">
            <h2 class="text-4xl md:text-5xl font-bold text-emerald-950 mb-6 leading-tight font-display">Ready to Code, ${state.username}?</h2>
            <p class="text-lg text-emerald-800/70 max-w-2xl mx-auto">Commit to a session. Earn credits to unlock new tools.</p>
            ${!hasDeepFocus ? `<p class="text-sm text-emerald-600/60 mt-2 font-medium">${500 - state.credits} more credits to unlock Deep Focus Mode</p>` : ''}
        </div>
        
        <div class="w-full max-w-2xl mx-auto">
            <form onsubmit="handleStartTask(event)" class="relative">
                <div class="relative group mb-6">
                    <div class="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                    <div class="relative bg-white rounded-2xl p-2 shadow-xl flex flex-col md:flex-row items-center gap-2">
                        <input id="task-input" type="text" placeholder="e.g., Refactor Auth Component..." class="flex-1 w-full p-4 text-gray-700 bg-transparent border-none outline-none focus:ring-0 placeholder-gray-400 text-lg font-medium font-sans" autofocus required />
                        <button type="submit" class="px-8 py-4 rounded-xl font-bold text-white shadow-md transition-all duration-200 flex items-center justify-center min-w-[160px] font-display bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:scale-[1.02] active:scale-95">Start Code</button>
                    </div>
                </div>

                <div class="flex justify-center gap-4">
                    ${buttonsHTML}
                </div>

                <p class="text-center text-emerald-700/60 mt-4 text-sm font-medium">Set your task and focus for ${state.selectedDuration / 60} minutes.</p>
            </form>
        </div>
        
        <button onclick="setView('roadmap')" class="mt-12 md:hidden text-emerald-600 font-bold text-sm flex items-center gap-1 mx-auto">View Feature Roadmap <span class="text-lg">→</span></button>
    </div>
    `;
}

function getTimerHTML() {
    const progress = ((state.duration - state.timeLeft) / state.duration) * 100;

    return `
    <div class="w-full max-w-md mx-auto animate-fade-in-up">
        <div class="bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden relative">
            <div id="timer-bar" class="absolute top-0 left-0 h-2 bg-emerald-500 transition-all duration-1000 linear" style="width: ${progress}%"></div>
            
            <div class="p-8 flex flex-col items-center text-center">
                <div class="mb-6">
                    <span class="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">Focus Mode</span>
                    <h2 class="text-2xl font-bold text-gray-800 font-display leading-tight break-words max-w-[300px]">${state.taskName}</h2>
                </div>

                <!-- Fixed height container to prevent flickering -->
                <div class="mb-8 relative flex items-center justify-center h-32 w-full">
                    <div id="timer-display" class="text-8xl font-black text-emerald-600 font-mono tracking-tighter tabular-nums leading-none select-none">${formatTime(state.timeLeft)}</div>
                    <p id="timer-status" class="text-emerald-900/40 text-sm font-medium absolute -bottom-6 left-0 right-0">${state.isTimerActive ? 'Keep coding...' : 'Paused'}</p>
                </div>

                <div class="flex items-center gap-4 w-full mt-8">
                    <button onclick="cancelTimer()" class="flex-1 py-3 px-4 rounded-xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 transition-colors">Exit</button>
                    <button id="btn-pause" onclick="toggleTimer()" class="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-amber-400 hover:bg-amber-500">Pause</button>
                </div>
            </div>
        </div>
        <div class="text-center mt-6 text-emerald-800/50 text-sm italic">"One line of code at a time."</div>
    </div>
    `;
}

function getCompletedHTML() {
    return `
    <div class="animate-fade-in-up w-full max-w-md">
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
            
            <button onclick="collectReward()" class="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-95">Continue</button>
        </div>
    </div>
    `;
}

function getRoadmapHTML() {
    // Calculate progress
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
        const iconClass = isUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400 grayscale';
        const cardClass = isUnlocked ? 'bg-white border-emerald-200 shadow-md' : 'bg-gray-50 border-gray-200 opacity-80';
        
        featuresHTML += `
        <div class="relative p-6 rounded-2xl border-2 transition-all duration-300 ${cardClass}">
            <div class="flex items-start gap-4">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${iconClass}">${feature.icon}</div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-xl font-bold font-display ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}">${feature.title}</h3>
                        ${isUnlocked 
                            ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full tracking-wide">Unlocked</span>'
                            : `<span class="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-bold uppercase rounded-full tracking-wide flex items-center gap-1">Locked • ${feature.cost}</span>`
                        }
                    </div>
                    <p class="text-gray-600 text-sm leading-relaxed">${feature.description}</p>
                </div>
            </div>
        </div>
        `;
    });

    return `
    <div class="w-full max-w-2xl mx-auto animate-fade-in-up pb-10">
        <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-4">
                <button onclick="setView('input')" class="p-2 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors">
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
                    <p class="text-emerald-700 font-bold">${nextFeature ? nextFeature.cost + ' Credits' : 'Max Level'}</p>
                </div>
            </div>
            
            <div class="h-4 bg-emerald-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out relative" style="width: ${progressPercent}%">
                    <div class="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                </div>
            </div>
            <p class="text-center mt-3 text-sm text-emerald-600/70 font-medium">
                ${nextFeature ? (nextFeature.cost - state.credits) + ' more credits to unlock ' + nextFeature.title : 'You have unlocked everything!'}
            </p>
        </div>

        <div class="space-y-4">
            ${featuresHTML}
        </div>
    </div>
    `;
}
