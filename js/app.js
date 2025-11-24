// ======================================
// VIT Cyber - Application Logic
// ======================================

// ======================================
// Safe Storage Manager
// ======================================
const SafeStorage = {
    // In-memory cache per performance
    cache: new Map(),

    getItem(key, defaultValue = null) {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }

            const parsed = JSON.parse(item);
            this.cache.set(key, parsed);
            return parsed;
        } catch (e) {
            console.error(`❌ Error reading ${key} from localStorage:`, e);
            return defaultValue;
        }
    },

    setItem(key, value) {
        try {
            const stringified = JSON.stringify(value);
            localStorage.setItem(key, stringified);
            this.cache.set(key, value);
            return true;
        } catch (e) {
            console.error(`❌ Error writing ${key} to localStorage:`, e);

            if (e.name === 'QuotaExceededError') {
                showToast('Spazio di archiviazione esaurito. Elimina alcuni dati dalle statistiche.');
            } else {
                showToast('Errore nel salvare i dati. Riprova.');
            }
            return false;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            this.cache.delete(key);
            return true;
        } catch (e) {
            console.error(`❌ Error removing ${key} from localStorage:`, e);
            return false;
        }
    },

    clearCache() {
        this.cache.clear();
    },

    invalidateKey(key) {
        this.cache.delete(key);
    }
};

// ======================================
// Loading Manager
// ======================================
const LoadingManager = {
    overlay: null,
    message: null,

    init() {
        this.overlay = document.getElementById('loading-overlay');
        this.message = document.getElementById('loading-message');
    },

    show(message = 'Caricamento...') {
        if (!this.overlay) this.init();
        if (this.message) {
            this.message.textContent = message;
        }
        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
    },

    hide() {
        if (!this.overlay) this.init();
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    }
};

// Global State
let allQuestions = [];
let config = { areas: {}, version: '1.0' };
let currentQuiz = {
    questions: [],
    currentIndex: 0,
    answers: [],
    startTime: null,
    timer: null,
    timerDuration: 30,
    requireConfirmation: true
};

// ======================================
// Global Error Handler
// ======================================
function setupGlobalErrorHandler() {
    // Catch all unhandled JavaScript errors
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('❌ Global Error:', {
            message,
            source,
            lineno,
            colno,
            error
        });

        // Show user-friendly error message
        showToast('Si è verificato un errore. L\'app continuerà a funzionare.', 'error');

        // Log to SafeStorage for debugging
        logError({
            type: 'JavaScript Error',
            message,
            source,
            lineno,
            colno,
            timestamp: new Date().toISOString()
        });

        // Prevent default browser error handling
        return true;
    };

    // Catch all unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('❌ Unhandled Promise Rejection:', event.reason);

        // Show user-friendly error message
        showToast('Si è verificato un errore durante un\'operazione.', 'error');

        // Log to SafeStorage for debugging
        logError({
            type: 'Promise Rejection',
            reason: event.reason?.toString() || 'Unknown',
            timestamp: new Date().toISOString()
        });

        // Prevent default browser error handling
        event.preventDefault();
    });
}

function logError(errorData) {
    try {
        const errorLog = SafeStorage.getItem('errorLog', []);
        errorLog.push(errorData);

        // Keep only last 50 errors
        if (errorLog.length > 50) {
            errorLog.shift();
        }

        SafeStorage.setItem('errorLog', errorLog);
    } catch (e) {
        console.error('Failed to log error:', e);
    }
}

// ======================================
// Initialization
// ======================================
document.addEventListener('DOMContentLoaded', () => {
    setupGlobalErrorHandler();
    setupServiceWorker();
    initApp();
    attachEventListeners();
});

function initApp() {
    loadEmbeddedData();
    loadThemePreference();
    updateDashboard();
    setupKeyboardShortcuts();
    setupBottomNavigation();
    checkOnboardingStatus();
}

// ======================================
// Service Worker Registration & Update Handling
// ======================================
let updateAvailableRegistration = null;

function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Check if we're running from file:// protocol (local development)
        const isFileProtocol = window.location.protocol === 'file:';

        if (isFileProtocol) {
            console.log('ℹ️ Running from file:// protocol - Service Worker not available (normal for local testing)');
            console.log('💡 To enable offline features, serve from http:// or https:// (e.g., with a local server)');
            return;
        }

        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);

                // Check for updates every 60 seconds
                setInterval(() => {
                    registration.update();
                }, 60000);

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Service Worker update found!');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available - auto-update
                            console.log('✨ New Service Worker installed, updating automatically...');
                            updateAvailableRegistration = registration;

                            // Auto-update: skip waiting immediately
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            })
            .catch(error => {
                console.error('❌ Service Worker registration failed:', error);
            });

        // Handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Controller changed, reloading page...');
            window.location.reload();
        });
    }
}

function showUpdateNotification() {
    const updateToast = document.getElementById('update-toast');
    const toast = new bootstrap.Toast(updateToast);
    toast.show();
}

function updateApp() {
    if (updateAvailableRegistration && updateAvailableRegistration.waiting) {
        // Tell the service worker to skip waiting
        updateAvailableRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}

// ======================================
// Keyboard Shortcuts
// ======================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't capture when typing in inputs
        if (e.target.matches('input, textarea, select')) {
            return;
        }

        // Check if we're in quiz view
        const quizView = document.getElementById('quiz-view-container');
        const isQuizActive = quizView && !quizView.classList.contains('hidden');

        if (isQuizActive) {
            // Space to pause/resume quiz
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                togglePauseQuiz();
                return;
            }

            // Don't allow other shortcuts while paused
            if (currentQuiz && currentQuiz.isPaused) {
                return;
            }

            // Number keys 1-3 to select answers (all questions have exactly 3 answers)
            if (/^[1-3]$/.test(e.key)) {
                const answerButtons = document.querySelectorAll('.answer-btn:not([disabled])');
                const index = parseInt(e.key) - 1;
                if (answerButtons[index]) {
                    e.preventDefault();
                    answerButtons[index].click();
                }
            }

            // Enter key behavior depends on quiz state
            if ((e.key === 'Enter' || e.key === 'n' || e.key === 'N') && !e.shiftKey) {
                e.preventDefault();

                // If confirm button is visible, confirm the answer
                const confirmBtn = document.getElementById('confirm-answer-btn');
                const confirmContainer = document.getElementById('confirm-answer-container');
                if (confirmContainer && !confirmContainer.classList.contains('hidden')) {
                    confirmBtn.click();
                    return;
                }

                // Otherwise, if next button is visible, go to next question
                const nextBtn = document.getElementById('next-question-btn');
                if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('hidden')) {
                    nextBtn.click();
                }
            }
        }

        // Global shortcuts
        // Escape to close modals or go back
        if (e.key === 'Escape') {
            // Check if there's a visible back button
            const backButtons = document.querySelectorAll('[id*="back-"]:not(.hidden)');
            if (backButtons.length > 0) {
                backButtons[0].click();
            }
        }
    });
}

// ======================================
// Data Loading (from embedded data)
// ======================================
function loadEmbeddedData() {
    // Carica dati da window.QUIZ_DATA (embedded da data-embedded.js)
    if (window.QUIZ_DATA) {
        allQuestions = window.QUIZ_DATA;
        console.log(`📱 VIT Cyber: Caricati ${allQuestions.length} domande`);
    } else {
        console.error('❌ window.QUIZ_DATA not found!');
        allQuestions = [];
    }

    // Carica config da localStorage usando SafeStorage
    const savedConfig = SafeStorage.getItem('quizConfig');
    if (savedConfig) {
        config = savedConfig;
        console.log(`📱 VIT Cyber: Config caricata: ${Object.keys(config.areas).length} aree`);
    } else {
        config = window.QUIZ_CONFIG || { areas: {}, version: '1.0' };
        console.log('📱 VIT Cyber: Config predefinita (nessuna area configurata)');
    }

    updateDashboard();
}

// ======================================
// Event Listeners
// ======================================
function attachEventListeners() {
    // Update app button
    document.getElementById('update-app-btn').addEventListener('click', updateApp);

    // Navigation
    document.getElementById('start-quiz-btn').addEventListener('click', showQuizSetup);
    document.getElementById('stats-btn').addEventListener('click', showStats);
    document.getElementById('manage-areas-btn').addEventListener('click', showManageAreas);
    document.getElementById('history-btn').addEventListener('click', showHistory);

    // Back buttons
    document.getElementById('back-from-quiz-setup-btn').addEventListener('click', showMainMenu);
    document.getElementById('back-from-stats-btn').addEventListener('click', showMainMenu);
    document.getElementById('back-from-areas-btn').addEventListener('click', showMainMenu);
    document.getElementById('back-from-history-btn').addEventListener('click', showMainMenu);
    document.getElementById('back-from-results-btn').addEventListener('click', showMainMenu);
    document.getElementById('quit-quiz-btn').addEventListener('click', () => {
        if (confirm('Sei sicuro di voler uscire dal quiz? I progressi saranno persi.')) {
            stopTimer();
            showMainMenu();
        }
    });

    // Question navigation buttons
    document.getElementById('flag-question-btn').addEventListener('click', toggleFlagQuestion);
    document.getElementById('skip-question-btn').addEventListener('click', skipQuestion);
    document.getElementById('show-palette-btn').addEventListener('click', showQuestionPalette);
    document.getElementById('close-palette-btn').addEventListener('click', closeQuestionPalette);

    // Pause/Resume buttons
    document.getElementById('pause-quiz-btn').addEventListener('click', togglePauseQuiz);
    document.getElementById('resume-quiz-btn').addEventListener('click', resumeQuiz);

    // Close pause overlay on backdrop click
    document.querySelector('.pause-backdrop')?.addEventListener('click', resumeQuiz);

    // Quiz setup
    document.getElementById('quiz-mode-select').addEventListener('change', () => {
        updateQuizSetupUI();
        // Clear validation errors when mode changes
        clearInputError('num-questions-input');
    });
    document.getElementById('timer-checkbox').addEventListener('change', toggleTimerSettings);
    document.getElementById('start-actual-quiz-btn').addEventListener('click', startQuiz);

    // Real-time validation
    document.getElementById('num-questions-input').addEventListener('input', validateNumQuestions);
    document.getElementById('num-questions-input').addEventListener('blur', validateNumQuestions);
    document.getElementById('timer-duration-input').addEventListener('input', validateTimerDuration);
    document.getElementById('timer-duration-input').addEventListener('blur', validateTimerDuration);
    document.getElementById('exclude-seen-checkbox').addEventListener('change', validateNumQuestions);

    // Quiz
    document.getElementById('confirm-answer-btn').addEventListener('click', confirmAnswer);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);

    // Results
    document.getElementById('retry-quiz-btn').addEventListener('click', () => {
        showQuizSetup();
    });
    document.getElementById('retry-wrong-btn').addEventListener('click', retryWrongQuestions);

    // Stats
    document.getElementById('clear-stats-btn').addEventListener('click', clearStats);

    // Areas Management
    document.getElementById('add-area-btn').addEventListener('click', addArea);
    document.getElementById('save-area-subjects-btn').addEventListener('click', saveAreaSubjects);

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

// ======================================
// View Management
// ======================================
function hideAllViews() {
    const views = [
        'main-menu', 'import-container', 'quiz-setup-container',
        'quiz-view-container', 'quiz-results-container',
        'stats-container', 'manage-areas-container', 'history-container'
    ];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function showMainMenu() {
    hideAllViews();
    document.getElementById('main-menu').classList.remove('hidden');
    updateDashboard();
    updateBottomNavActive('main-menu');
}

function showQuizSetup() {
    if (allQuestions.length === 0) {
        showToast('Nessuna domanda disponibile!');
        return;
    }

    hideAllViews();
    document.getElementById('quiz-setup-container').classList.remove('hidden');
    populateQuizSetup();
    updateQuizSetupUI();
}

function showQuizView() {
    hideAllViews();
    document.getElementById('quiz-view-container').classList.remove('hidden');

    // Show practice mode badge if in practice mode
    const practiceBadge = document.getElementById('practice-mode-badge');
    if (currentQuiz && currentQuiz.isPracticeMode) {
        practiceBadge.classList.remove('hidden');
    } else {
        practiceBadge.classList.add('hidden');
    }
}

function showQuizResults() {
    hideAllViews();
    document.getElementById('quiz-results-container').classList.remove('hidden');
    displayResults();
}

function showStats() {
    hideAllViews();
    document.getElementById('stats-container').classList.remove('hidden');
    displayStatistics();
    updateBottomNavActive('stats-container');
}

function showManageAreas() {
    if (allQuestions.length === 0) {
        showToast('Nessuna domanda disponibile!');
        return;
    }

    hideAllViews();
    document.getElementById('manage-areas-container').classList.remove('hidden');
    populateAreasManagement();
    updateBottomNavActive('manage-areas-container');
}

function showHistory() {
    hideAllViews();
    document.getElementById('history-container').classList.remove('hidden');
    displayHistory();
    updateBottomNavActive('history-container');
}

function displayHistory() {
    const historyContainer = document.getElementById('history-list');
    const history = SafeStorage.getItem('quizHistory', []);

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="text-muted">Nessun quiz completato</p>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-hover">';
    html += `
        <thead>
            <tr>
                <th>Data</th>
                <th>Modalità</th>
                <th>Target</th>
                <th>Domande</th>
                <th>Corrette</th>
                <th>Punteggio</th>
            </tr>
        </thead>
        <tbody>
    `;

    history.forEach(entry => {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const modeLabels = {
            'area': 'Area',
            'subject': 'Materia',
            'random': 'Casuale',
            'wrong': 'Sbagliate',
            'wrong-by-area': 'Sbag. Area',
            'wrong-by-subject': 'Sbag. Materia'
        };

        const scoreClass = entry.score >= 80 ? 'text-success' : (entry.score >= 60 ? 'text-warning' : 'text-danger');
        const scoreIcon = entry.score >= 80 ? '✓' : (entry.score >= 60 ? '~' : '✗');

        html += `
            <tr>
                <td><small>${formattedDate}</small></td>
                <td><span class="badge bg-secondary">${modeLabels[entry.mode] || entry.mode}</span></td>
                <td>${entry.target}</td>
                <td>${entry.questionsCount}</td>
                <td>${entry.correctCount}</td>
                <td class="${scoreClass}"><strong>${scoreIcon} ${entry.score}%</strong></td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    historyContainer.innerHTML = html;
}

// ======================================
// Quiz Setup
// ======================================
function populateQuizSetup() {
    const modeSelect = document.getElementById('quiz-mode-select');
    const topicSelect = document.getElementById('quiz-topic-select');

    // Populate based on mode
    updateQuizSetupUI();
}

function updateQuizSetupUI() {
    const mode = document.getElementById('quiz-mode-select').value;
    const topicContainer = document.getElementById('topic-select-container');
    const numContainer = document.getElementById('num-questions-container');
    const excludeSeenContainer = document.getElementById('exclude-seen-container');
    const topicSelect = document.getElementById('quiz-topic-select');

    // Reset timer controls (will be overridden by exam mode if needed)
    const timerCheckbox = document.getElementById('timer-checkbox');
    const timerInput = document.getElementById('timer-duration-input');
    const timerContainer = document.getElementById('timer-duration-container');

    if (mode !== 'exam') {
        timerCheckbox.disabled = false;
        timerInput.disabled = false;
        if (timerCheckbox.checked) {
            timerContainer.classList.remove('hidden');
        }
    }

    topicSelect.innerHTML = '';

    // Mostra/nascondi "Escludi domande già viste" solo per modalità normali
    const showExcludeSeen = (mode === 'area' || mode === 'subject' || mode === 'random');
    if (excludeSeenContainer) {
        if (showExcludeSeen) {
            excludeSeenContainer.classList.remove('hidden');
        } else {
            excludeSeenContainer.classList.add('hidden');
        }
    }

    if (mode === 'area') {
        topicContainer.classList.remove('hidden');
        numContainer.classList.remove('hidden');

        // Populate areas
        Object.keys(config.areas || {}).forEach(areaName => {
            const option = document.createElement('option');
            option.value = areaName;
            option.textContent = areaName;
            topicSelect.appendChild(option);
        });

        if (Object.keys(config.areas || {}).length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Nessuna area configurata';
            topicSelect.appendChild(option);
        }

    } else if (mode === 'subject') {
        topicContainer.classList.remove('hidden');
        numContainer.classList.remove('hidden');

        // Get unique subjects
        const subjects = [...new Set(allQuestions.map(q => q.Materia))].sort();
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            topicSelect.appendChild(option);
        });

    } else if (mode === 'random') {
        topicContainer.classList.add('hidden');
        numContainer.classList.remove('hidden');

    } else if (mode === 'wrong') {
        topicContainer.classList.add('hidden');
        numContainer.classList.add('hidden');

    } else if (mode === 'wrong-by-area') {
        topicContainer.classList.remove('hidden');
        numContainer.classList.add('hidden');

        // Populate areas
        Object.keys(config.areas || {}).forEach(areaName => {
            const wrongCount = getWrongQuestionsForArea(areaName).length;
            const option = document.createElement('option');
            option.value = areaName;
            option.textContent = `${areaName} (${wrongCount} sbagliate)`;
            topicSelect.appendChild(option);
        });

        if (Object.keys(config.areas || {}).length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Nessuna area configurata';
            topicSelect.appendChild(option);
        }

    } else if (mode === 'wrong-by-subject') {
        topicContainer.classList.remove('hidden');
        numContainer.classList.add('hidden');

        // Get unique subjects
        const subjects = [...new Set(allQuestions.map(q => q.Materia))].sort();
        subjects.forEach(subject => {
            const wrongCount = getWrongQuestionsForSubject(subject).length;
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = `${subject} (${wrongCount} sbagliate)`;
            topicSelect.appendChild(option);
        });

    } else if (mode === 'practice') {
        // Practice Mode: può scegliere area/materia o tutte
        topicContainer.classList.remove('hidden');
        numContainer.classList.remove('hidden');

        // Add "Tutte le domande" option
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'Tutte le domande (casuale)';
        topicSelect.appendChild(allOption);

        // Add separator
        const separator1 = document.createElement('option');
        separator1.disabled = true;
        separator1.textContent = '─── Per Area ───';
        topicSelect.appendChild(separator1);

        // Populate areas
        Object.keys(config.areas || {}).forEach(areaName => {
            const option = document.createElement('option');
            option.value = `area:${areaName}`;
            option.textContent = `📚 ${areaName}`;
            topicSelect.appendChild(option);
        });

        // Add separator
        const separator2 = document.createElement('option');
        separator2.disabled = true;
        separator2.textContent = '─── Per Materia ───';
        topicSelect.appendChild(separator2);

        // Get unique subjects
        const subjects = [...new Set(allQuestions.map(q => q.Materia))].sort();
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = `subject:${subject}`;
            option.textContent = `📖 ${subject}`;
            topicSelect.appendChild(option);
        });

    } else if (mode === 'exam') {
        // Exam Mode: 60 domande fisse, 60 minuti totali
        topicContainer.classList.add('hidden');
        numContainer.classList.add('hidden');

        // Force timer settings for exam mode
        const timerCheckbox = document.getElementById('timer-checkbox');
        const timerInput = document.getElementById('timer-duration-input');
        const timerContainer = document.getElementById('timer-duration-container');

        timerCheckbox.checked = true;
        timerCheckbox.disabled = true; // Non modificabile
        timerInput.value = 3600; // 60 minuti = 3600 secondi totali
        timerInput.disabled = true; // Non modificabile

        // Nascondi il contenitore del timer perché non è modificabile
        if (timerContainer) {
            timerContainer.classList.add('hidden');
        }
    }
}

function toggleTimerSettings() {
    const timerEnabled = document.getElementById('timer-checkbox').checked;
    const timerContainer = document.getElementById('timer-duration-container');

    if (timerEnabled) {
        timerContainer.classList.remove('hidden');
    } else {
        timerContainer.classList.add('hidden');
    }
}

// ======================================
// Mobile UX - Haptic Feedback
// ======================================
const HapticFeedback = {
    // Check if vibration is supported
    isSupported: () => 'vibrate' in navigator,

    // Light tap (selection)
    light: () => {
        if (HapticFeedback.isSupported()) {
            navigator.vibrate(10);
        }
    },

    // Medium tap (confirmation)
    medium: () => {
        if (HapticFeedback.isSupported()) {
            navigator.vibrate(20);
        }
    },

    // Success pattern (correct answer)
    success: () => {
        if (HapticFeedback.isSupported()) {
            navigator.vibrate([30, 50, 30]);
        }
    },

    // Error pattern (wrong answer)
    error: () => {
        if (HapticFeedback.isSupported()) {
            navigator.vibrate([50, 100, 50]);
        }
    },

    // Celebration pattern (quiz complete)
    celebration: () => {
        if (HapticFeedback.isSupported()) {
            navigator.vibrate([50, 50, 50, 50, 100]);
        }
    }
};

// ======================================
// Mobile UX - Swipe Gestures
// ======================================
let swipeState = {
    startX: 0,
    startY: 0,
    currentX: 0,
    isDragging: false,
    threshold: 100 // px required to trigger swipe
};

function setupSwipeGestures() {
    const quizContainer = document.getElementById('quiz-container');

    if (!quizContainer) return;

    // Touch events
    quizContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    quizContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    quizContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Mouse events (for desktop testing)
    quizContainer.addEventListener('mousedown', handleMouseDown);
    quizContainer.addEventListener('mousemove', handleMouseMove);
    quizContainer.addEventListener('mouseup', handleMouseUp);
    quizContainer.addEventListener('mouseleave', handleMouseUp);
}

function handleTouchStart(e) {
    swipeState.startX = e.touches[0].clientX;
    swipeState.startY = e.touches[0].clientY;
    swipeState.isDragging = true;
}

function handleTouchMove(e) {
    if (!swipeState.isDragging) return;

    swipeState.currentX = e.touches[0].clientX;
    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = Math.abs(e.touches[0].clientY - swipeState.startY);

    // Only apply horizontal swipe, ignore if vertical movement is significant
    if (deltaY > 30) {
        return;
    }

    // Apply visual feedback during swipe
    const questionCard = document.querySelector('#quiz-container .card');
    if (questionCard && Math.abs(deltaX) > 10) {
        e.preventDefault();
        const opacity = 1 - Math.abs(deltaX) / 300;
        questionCard.style.transform = `translateX(${deltaX}px)`;
        questionCard.style.opacity = Math.max(opacity, 0.3);
    }
}

function handleTouchEnd(e) {
    if (!swipeState.isDragging) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const questionCard = document.querySelector('#quiz-container .card');

    // Reset visual feedback
    if (questionCard) {
        questionCard.style.transform = '';
        questionCard.style.opacity = '';
    }

    swipeState.isDragging = false;

    // Check if swipe threshold is met
    if (Math.abs(deltaX) < swipeState.threshold) {
        return;
    }

    // Swipe left = next question (only if answered)
    if (deltaX < 0) {
        const nextBtn = document.getElementById('next-question-btn');
        if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('hidden')) {
            HapticFeedback.medium();
            nextBtn.click();

            // Dismiss hint after first successful swipe
            const quizContainer = document.getElementById('quiz-container');
            if (quizContainer) {
                quizContainer.classList.add('hint-dismissed');
            }
        }
    }
}

// Mouse events for desktop testing
function handleMouseDown(e) {
    swipeState.startX = e.clientX;
    swipeState.startY = e.clientY;
    swipeState.isDragging = true;
}

function handleMouseMove(e) {
    if (!swipeState.isDragging) return;

    swipeState.currentX = e.clientX;
    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = Math.abs(e.clientY - swipeState.startY);

    if (deltaY > 30) return;

    const questionCard = document.querySelector('#quiz-container .card');
    if (questionCard && Math.abs(deltaX) > 10) {
        const opacity = 1 - Math.abs(deltaX) / 300;
        questionCard.style.transform = `translateX(${deltaX}px)`;
        questionCard.style.opacity = Math.max(opacity, 0.3);
    }
}

function handleMouseUp(e) {
    if (!swipeState.isDragging) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const questionCard = document.querySelector('#quiz-container .card');

    if (questionCard) {
        questionCard.style.transform = '';
        questionCard.style.opacity = '';
    }

    swipeState.isDragging = false;

    if (Math.abs(deltaX) < swipeState.threshold) {
        return;
    }

    if (deltaX < 0) {
        const nextBtn = document.getElementById('next-question-btn');
        if (nextBtn && !nextBtn.disabled && !nextBtn.classList.contains('hidden')) {
            nextBtn.click();
        }
    }
}

// ======================================
// Bottom Navigation
// ======================================
function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.dataset.view;

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Haptic feedback
            HapticFeedback.light();

            // Navigate to view
            if (targetView === 'main-menu') {
                showMainMenu();
            } else if (targetView === 'stats-container') {
                showStats();
            } else if (targetView === 'history-container') {
                showHistory();
            } else if (targetView === 'manage-areas-container') {
                showManageAreas();
            }
        });
    });
}

function updateBottomNavActive(viewId) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        if (item.dataset.view === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ======================================
// Onboarding Tutorial
// ======================================
let onboardingState = {
    currentSlide: 0,
    totalSlides: 4
};

function checkOnboardingStatus() {
    const hasSeenOnboarding = SafeStorage.getItem('hasSeenOnboarding', false);

    if (!hasSeenOnboarding) {
        // Show onboarding after a short delay
        setTimeout(() => {
            showOnboarding();
        }, 500);
    }
}

function showOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    overlay.classList.remove('hidden');

    // Setup listeners
    document.getElementById('onboarding-skip').addEventListener('click', closeOnboarding);
    document.getElementById('onboarding-prev').addEventListener('click', prevOnboardingSlide);
    document.getElementById('onboarding-next').addEventListener('click', nextOnboardingSlide);
    document.getElementById('onboarding-start').addEventListener('click', closeOnboarding);

    // Dot navigation
    document.querySelectorAll('.onboarding-dots .dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            goToOnboardingSlide(slideIndex);
        });
    });
}

function closeOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    const dontShowAgain = document.getElementById('onboarding-dont-show').checked;

    overlay.classList.add('hidden');

    if (dontShowAgain) {
        SafeStorage.setItem('hasSeenOnboarding', true);
    }

    HapticFeedback.medium();
}

function nextOnboardingSlide() {
    if (onboardingState.currentSlide < onboardingState.totalSlides - 1) {
        onboardingState.currentSlide++;
        goToOnboardingSlide(onboardingState.currentSlide);
        HapticFeedback.light();
    }
}

function prevOnboardingSlide() {
    if (onboardingState.currentSlide > 0) {
        onboardingState.currentSlide--;
        goToOnboardingSlide(onboardingState.currentSlide);
        HapticFeedback.light();
    }
}

function goToOnboardingSlide(slideIndex) {
    onboardingState.currentSlide = slideIndex;

    // Update slides
    const slides = document.querySelectorAll('.onboarding-slide');
    slides.forEach((slide, index) => {
        if (index === slideIndex) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });

    // Update dots
    const dots = document.querySelectorAll('.onboarding-dots .dot');
    dots.forEach((dot, index) => {
        if (index === slideIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // Update buttons
    const prevBtn = document.getElementById('onboarding-prev');
    const nextBtn = document.getElementById('onboarding-next');
    const startBtn = document.getElementById('onboarding-start');

    prevBtn.disabled = slideIndex === 0;

    if (slideIndex === onboardingState.totalSlides - 1) {
        nextBtn.classList.add('hidden');
        startBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        startBtn.classList.add('hidden');
    }
}

// ======================================
// Input Validation
// ======================================
function validateNumQuestions() {
    const input = document.getElementById('num-questions-input');
    const mode = document.getElementById('quiz-mode-select').value;
    const numContainer = document.getElementById('num-questions-container');

    // Clear previous error
    clearInputError('num-questions-input');

    // Skip validation for modes that don't use numQuestions input
    if (mode === 'wrong' || mode === 'wrong-by-area' || mode === 'wrong-by-subject' || mode === 'exam') {
        return true;
    }

    // Skip validation if input container is hidden
    if (numContainer && numContainer.classList.contains('hidden')) {
        return true;
    }

    const value = parseInt(input.value);

    // Check if value exists
    if (!value || value < 1) {
        showInputError('num-questions-input', 'Inserisci almeno 1 domanda');
        return false;
    }

    // Get available questions count
    const availableQuestions = getAvailableQuestionsCount(mode);

    if (value > availableQuestions) {
        showInputError('num-questions-input', `Massimo ${availableQuestions} domande disponibili`);
        return false;
    }

    return true;
}

function validateTimerDuration() {
    const mode = document.getElementById('quiz-mode-select').value;
    const timerEnabled = document.getElementById('timer-checkbox').checked;

    // Skip validation for exam mode (has fixed 3600 seconds timer)
    if (mode === 'exam') {
        clearInputError('timer-duration-input');
        return true;
    }

    // Skip validation if timer is not enabled
    if (!timerEnabled) {
        clearInputError('timer-duration-input');
        return true;
    }

    const input = document.getElementById('timer-duration-input');
    const value = parseInt(input.value);

    // Clear previous error
    clearInputError('timer-duration-input');

    if (!value || value < 10) {
        showInputError('timer-duration-input', 'Minimo 10 secondi');
        return false;
    }

    if (value > 300) {
        showInputError('timer-duration-input', 'Massimo 300 secondi (5 minuti)');
        return false;
    }

    return true;
}

function getAvailableQuestionsCount(mode) {
    const topic = document.getElementById('quiz-topic-select').value;
    const excludeSeen = document.getElementById('exclude-seen-checkbox')?.checked || false;

    let availableQuestions = [];

    if (mode === 'area') {
        const subjects = config.areas[topic] || [];
        availableQuestions = allQuestions.filter(q => subjects.includes(q.Materia));
    } else if (mode === 'subject') {
        availableQuestions = allQuestions.filter(q => q.Materia === topic);
    } else if (mode === 'random') {
        availableQuestions = [...allQuestions];
    } else if (mode === 'practice') {
        // Practice Mode: count based on selection
        if (!topic || topic === '') {
            availableQuestions = [...allQuestions];
        } else if (topic.startsWith('area:')) {
            const areaName = topic.replace('area:', '');
            const subjects = config.areas[areaName] || [];
            availableQuestions = allQuestions.filter(q => subjects.includes(q.Materia));
        } else if (topic.startsWith('subject:')) {
            const subjectName = topic.replace('subject:', '');
            availableQuestions = allQuestions.filter(q => q.Materia === subjectName);
        }
    } else if (mode === 'exam') {
        // Exam Mode: always 60 questions
        return 60;
    }

    // Apply exclude seen filter
    if (excludeSeen) {
        const completed = SafeStorage.getItem('completedQuestions', {});

        if (mode === 'area') {
            const subjects = config.areas[topic] || [];
            const completedIds = new Set();
            subjects.forEach(subject => {
                const subjectCompleted = completed[subject] || [];
                subjectCompleted.forEach(id => completedIds.add(id));
            });
            availableQuestions = availableQuestions.filter(q => !completedIds.has(q.ID));
        } else if (mode === 'subject') {
            const completedIds = completed[topic] || [];
            availableQuestions = availableQuestions.filter(q => !completedIds.includes(q.ID));
        }
    }

    return availableQuestions.length;
}

function showInputError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorDivId = inputId.replace('-input', '-error');
    const errorDiv = document.getElementById(errorDivId);

    input.classList.add('is-invalid');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function clearInputError(inputId) {
    const input = document.getElementById(inputId);
    const errorDivId = inputId.replace('-input', '-error');
    const errorDiv = document.getElementById(errorDivId);

    input.classList.remove('is-invalid');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

function validateQuizSetup() {
    const isNumQuestionsValid = validateNumQuestions();
    const isTimerValid = validateTimerDuration();

    return isNumQuestionsValid && isTimerValid;
}

// ======================================
// Quiz Execution
// ======================================
function startQuiz() {
    // Validate inputs before starting quiz
    if (!validateQuizSetup()) {
        showToast('Correggi gli errori prima di iniziare il quiz', 'error');
        return;
    }

    const mode = document.getElementById('quiz-mode-select').value;
    const topic = document.getElementById('quiz-topic-select').value;
    const numQuestions = parseInt(document.getElementById('num-questions-input').value) || 10;
    const timerEnabled = document.getElementById('timer-checkbox').checked;
    const timerDuration = parseInt(document.getElementById('timer-duration-input').value) || 30;
    const excludeSeenCheckbox = document.getElementById('exclude-seen-checkbox');
    const excludeSeen = excludeSeenCheckbox ? excludeSeenCheckbox.checked : false;
    const requireConfirmationCheckbox = document.getElementById('require-confirmation-checkbox');
    const requireConfirmation = requireConfirmationCheckbox ? requireConfirmationCheckbox.checked : true;

    // Select questions based on mode
    let selectedQuestions = [];

    if (mode === 'area') {
        const subjects = config.areas[topic] || [];
        selectedQuestions = allQuestions.filter(q => subjects.includes(q.Materia));
    } else if (mode === 'subject') {
        selectedQuestions = allQuestions.filter(q => q.Materia === topic);
    } else if (mode === 'random') {
        selectedQuestions = shuffleArray([...allQuestions]).slice(0, numQuestions);
    } else if (mode === 'wrong') {
        const wrongIds = SafeStorage.getItem('wrongQuestions', []);
        selectedQuestions = allQuestions.filter(q => wrongIds.includes(q.ID));
    } else if (mode === 'wrong-by-area') {
        const wrongIds = getWrongQuestionsForArea(topic);
        selectedQuestions = allQuestions.filter(q => wrongIds.includes(q.ID));
    } else if (mode === 'wrong-by-subject') {
        const wrongIds = getWrongQuestionsForSubject(topic);
        selectedQuestions = allQuestions.filter(q => wrongIds.includes(q.ID));
    } else if (mode === 'practice') {
        // Practice Mode: user chooses area/subject or random
        if (!topic || topic === '') {
            // Random questions
            selectedQuestions = shuffleArray([...allQuestions]).slice(0, numQuestions);
        } else if (topic.startsWith('area:')) {
            // Area selected
            const areaName = topic.replace('area:', '');
            const subjects = config.areas[areaName] || [];
            selectedQuestions = allQuestions.filter(q => subjects.includes(q.Materia));
        } else if (topic.startsWith('subject:')) {
            // Subject selected
            const subjectName = topic.replace('subject:', '');
            selectedQuestions = allQuestions.filter(q => q.Materia === subjectName);
        }
    } else if (mode === 'exam') {
        // Exam Mode: 60 random questions, 60 minutes total (1 min per question)
        selectedQuestions = shuffleArray([...allQuestions]).slice(0, 60);
    }

    // Escludi domande già viste se richiesto
    if (excludeSeen && mode !== 'wrong' && mode !== 'wrong-by-area' && mode !== 'wrong-by-subject') {
        const completed = SafeStorage.getItem('completedQuestions', {});

        if (mode === 'area') {
            const subjects = config.areas[topic] || [];
            const completedIds = new Set();
            subjects.forEach(subject => {
                const subjectCompleted = completed[subject] || [];
                subjectCompleted.forEach(id => completedIds.add(id));
            });
            selectedQuestions = selectedQuestions.filter(q => !completedIds.has(q.ID));
        } else if (mode === 'subject') {
            const completedIds = completed[topic] || [];
            selectedQuestions = selectedQuestions.filter(q => !completedIds.includes(q.ID));
        }
    }

    if (selectedQuestions.length === 0) {
        showToast('Nessuna domanda disponibile per questa selezione!');
        return;
    }

    // Limita il numero di domande se richiesto (non per wrong modes e exam mode)
    if (mode !== 'wrong' && mode !== 'wrong-by-area' && mode !== 'wrong-by-subject' && mode !== 'exam') {
        selectedQuestions = shuffleArray(selectedQuestions).slice(0, numQuestions);
    }

    // Exam mode: assicura esattamente 60 domande
    if (mode === 'exam' && selectedQuestions.length > 60) {
        selectedQuestions = shuffleArray(selectedQuestions).slice(0, 60);
    }

    // Initialize quiz with mode-specific settings
    const isPracticeMode = mode === 'practice';
    const isExamMode = mode === 'exam';

    currentQuiz = {
        questions: shuffleArray(selectedQuestions),
        currentIndex: 0,
        answers: [],
        flagged: [], // Array of question indices flagged for review
        skipped: [], // Array of question indices skipped
        startTime: Date.now(),
        timer: null,
        timerDuration: isExamMode ? 3600 : timerDuration, // Exam mode: 60 minuti totali
        timerEnabled: isPracticeMode ? false : timerEnabled, // Practice mode: no timer
        requireConfirmation: requireConfirmation,
        mode: mode,
        target: topic,
        isPaused: false, // Pause state
        pausedTimeLeft: null, // Store remaining time when paused
        isPracticeMode: isPracticeMode, // Practice Mode: no scoring, immediate retry
        isExamMode: isExamMode, // Exam Mode: no feedback until end
        showFeedback: !isExamMode, // Show feedback immediately unless Exam Mode
        isGlobalTimer: isExamMode, // Exam mode uses global timer (not per question)
        allowRetry: isPracticeMode, // Practice mode: allow immediate retry (max 2 attempts)
        saveToHistory: !isPracticeMode, // Practice mode: don't save to history
        retryCount: 0 // Practice mode: track retry attempts per question
    };

    showQuizView();
    displayQuestion();

    // Setup swipe gestures for mobile navigation
    setupSwipeGestures();
}

// Variable to track selected answer before confirmation
let pendingAnswer = null;

function displayQuestion() {
    const question = currentQuiz.questions[currentQuiz.currentIndex];
    const totalQuestions = currentQuiz.questions.length;
    const currentNum = currentQuiz.currentIndex + 1;

    // Reset pending answer
    pendingAnswer = null;

    // Reset animations by removing and re-adding animation class
    const questionContainer = document.getElementById('question-container');
    questionContainer.style.animation = 'none';
    setTimeout(() => {
        questionContainer.style.animation = '';
    }, 10);

    // Update progress
    document.getElementById('quiz-progress-text').textContent = `Domanda ${currentNum} di ${totalQuestions}`;
    const progress = (currentNum / totalQuestions) * 100;
    document.getElementById('quiz-progress-bar').style.width = `${progress}%`;

    // Display question
    document.getElementById('question-text').textContent = question.Domanda;

    // Create answer buttons
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';

    const answers = [
        question.RispostaCorretta,
        question.RispostaErrata1,
        question.RispostaErrata2,
        question.RispostaErrata3
    ].filter(a => a);

    const shuffledAnswers = shuffleArray(answers);

    shuffledAnswers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn answer-btn w-100';
        btn.textContent = answer;
        btn.addEventListener('click', () => selectAnswer(answer, question.RispostaCorretta));
        answersContainer.appendChild(btn);
    });

    // Hide feedback and confirm button
    document.getElementById('answer-feedback').classList.add('hidden');
    document.getElementById('confirm-answer-container').classList.add('hidden');

    // Update flag button state
    const flagBtn = document.getElementById('flag-question-btn');
    if (currentQuiz.flagged.includes(currentQuiz.currentIndex)) {
        flagBtn.classList.add('flagged');
        flagBtn.querySelector('i').className = 'bi bi-flag-fill';
    } else {
        flagBtn.classList.remove('flagged');
        flagBtn.querySelector('i').className = 'bi bi-flag';
    }

    // Hide skip button if this is the last unanswered question
    const skipBtn = document.getElementById('skip-question-btn');
    const unansweredCount = currentQuiz.questions.filter((q, idx) => !currentQuiz.answers[idx]).length;
    if (unansweredCount <= 1) {
        skipBtn.style.display = 'none';
    } else {
        skipBtn.style.display = '';
    }

    // Show/hide pause button based on timer
    const pauseBtn = document.getElementById('pause-quiz-btn');
    if (currentQuiz.timerEnabled) {
        pauseBtn.classList.remove('hidden');
    } else {
        pauseBtn.classList.add('hidden');
    }

    // Start timer if enabled
    if (currentQuiz.timerEnabled) {
        // For global timer (exam mode), only start on first question
        if (!currentQuiz.isGlobalTimer || currentQuiz.currentIndex === 0) {
            startTimer();
        } else {
            // Resume global timer display
            updateTimerDisplay();
        }
    } else {
        document.getElementById('timer-display').classList.add('hidden');
    }
}

function selectAnswer(selectedAnswer, correctAnswer) {
    // Haptic feedback on selection
    HapticFeedback.light();

    // If confirmation is not required, check answer immediately
    if (!currentQuiz.requireConfirmation) {
        checkAnswer(selectedAnswer, correctAnswer);
        return;
    }

    // Store the pending answer
    pendingAnswer = { selectedAnswer, correctAnswer };

    // Remove 'selected' class from all buttons
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));

    // Add 'selected' class to clicked button
    event.target.classList.add('selected');

    // Show confirm button
    document.getElementById('confirm-answer-container').classList.remove('hidden');
}

function confirmAnswer() {
    if (!pendingAnswer) return;

    // Haptic feedback on confirmation
    HapticFeedback.medium();

    // Hide confirm button
    document.getElementById('confirm-answer-container').classList.add('hidden');

    // Call the original checkAnswer function
    checkAnswer(pendingAnswer.selectedAnswer, pendingAnswer.correctAnswer);
}

function checkAnswer(selectedAnswer, correctAnswer) {
    // Don't stop timer in exam mode (global timer continues)
    if (!currentQuiz.isGlobalTimer) {
        stopTimer();
    }

    const isCorrect = selectedAnswer === correctAnswer;

    // Haptic feedback based on result (unless Exam Mode)
    if (!currentQuiz.isExamMode) {
        if (isCorrect) {
            HapticFeedback.success();
        } else {
            HapticFeedback.error();
        }
    } else {
        // Exam Mode: neutral feedback only
        HapticFeedback.medium();
    }

    // Record answer
    currentQuiz.answers.push({
        question: currentQuiz.questions[currentQuiz.currentIndex],
        selectedAnswer: selectedAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
    });

    // Visual feedback (only if showFeedback is true)
    if (currentQuiz.showFeedback) {
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.textContent === selectedAnswer && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        // Show feedback message
        const feedbackEl = document.getElementById('answer-feedback');
        const messageEl = document.getElementById('feedback-message');

        if (isCorrect) {
            messageEl.className = 'alert alert-success';
            messageEl.innerHTML = '<i class="bi bi-check-circle me-2"></i><strong>Corretto!</strong>';
            // Reset retry count on correct answer
            if (currentQuiz.isPracticeMode) {
                currentQuiz.retryCount = 0;
            }
        } else {
            messageEl.className = 'alert alert-danger';

            // Practice Mode: retry logic (max 2 attempts = 1 retry)
            if (currentQuiz.allowRetry && currentQuiz.retryCount === 0) {
                // First wrong attempt: show retry button WITHOUT showing correct answer
                messageEl.innerHTML = `
                    <div><i class="bi bi-x-circle me-2"></i><strong>Sbagliato!</strong> Riprova a pensarci...</div>
                    <button class="btn btn-warning btn-sm mt-2" onclick="retryQuestion()">
                        <i class="bi bi-arrow-counterclockwise me-1"></i>Riprova (1 tentativo rimasto)
                    </button>
                `;
            } else {
                // Second wrong attempt OR non-practice mode: show correct answer
                messageEl.innerHTML = `<i class="bi bi-x-circle me-2"></i><strong>Sbagliato!</strong> La risposta corretta è: <strong>${correctAnswer}</strong>`;
            }
        }

        feedbackEl.classList.remove('hidden');
    } else {
        // Exam Mode: just mark as answered and move on
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => btn.disabled = true);

        // Auto-advance to next question after 500ms
        setTimeout(() => {
            nextQuestion();
        }, 500);
    }
}

function retryQuestion() {
    // Practice Mode: retry the same question
    HapticFeedback.medium();

    // Increment retry count
    currentQuiz.retryCount++;

    // Remove last answer from array (the wrong one)
    currentQuiz.answers.pop();

    // Reset the question display
    displayQuestion();
}

function nextQuestion() {
    // Reset retry count for next question (Practice Mode)
    if (currentQuiz.isPracticeMode) {
        currentQuiz.retryCount = 0;
    }

    // Mark current question as skipped if not answered
    if (!currentQuiz.answers[currentQuiz.currentIndex]) {
        if (!currentQuiz.skipped.includes(currentQuiz.currentIndex)) {
            currentQuiz.skipped.push(currentQuiz.currentIndex);
        }
    }

    currentQuiz.currentIndex++;

    // Check if there are unanswered questions (including skipped ones)
    const hasUnanswered = currentQuiz.questions.some((q, idx) => !currentQuiz.answers[idx]);

    if (currentQuiz.currentIndex < currentQuiz.questions.length) {
        displayQuestion();
    } else if (hasUnanswered) {
        // If we reached the end but there are unanswered questions, go to first unanswered
        const firstUnanswered = currentQuiz.questions.findIndex((q, idx) => !currentQuiz.answers[idx]);
        if (firstUnanswered !== -1) {
            currentQuiz.currentIndex = firstUnanswered;
            displayQuestion();
        } else {
            finishQuiz();
        }
    } else {
        // Check if there are flagged questions to review
        const flaggedUnanswered = currentQuiz.flagged.filter(idx => !currentQuiz.answers[idx]);
        if (flaggedUnanswered.length > 0) {
            showFlaggedReview();
        } else {
            finishQuiz();
        }
    }
}

// ======================================
// Question Navigation (Flag & Skip)
// ======================================
function toggleFlagQuestion() {
    const currentIdx = currentQuiz.currentIndex;
    const flagBtn = document.getElementById('flag-question-btn');

    // Haptic feedback
    HapticFeedback.light();

    if (currentQuiz.flagged.includes(currentIdx)) {
        // Remove flag
        currentQuiz.flagged = currentQuiz.flagged.filter(idx => idx !== currentIdx);
        flagBtn.classList.remove('flagged');
        flagBtn.querySelector('i').className = 'bi bi-flag';
        showToast('Flag rimosso', 'info');
    } else {
        // Add flag
        currentQuiz.flagged.push(currentIdx);
        flagBtn.classList.add('flagged');
        flagBtn.querySelector('i').className = 'bi bi-flag-fill';
        showToast('Domanda segnata per revisione', 'warning');
    }
}

function skipQuestion() {
    // Only allow skipping if question is not answered
    if (currentQuiz.answers[currentQuiz.currentIndex]) {
        showToast('Hai già risposto a questa domanda', 'info');
        return;
    }

    // Check if there are other unanswered questions
    const unansweredCount = currentQuiz.questions.filter((q, idx) => !currentQuiz.answers[idx]).length;
    if (unansweredCount <= 1) {
        showToast('Non puoi saltare l\'ultima domanda', 'warning');
        return;
    }

    // Haptic feedback
    HapticFeedback.medium();

    // Mark as skipped
    if (!currentQuiz.skipped.includes(currentQuiz.currentIndex)) {
        currentQuiz.skipped.push(currentQuiz.currentIndex);
    }

    showToast('Domanda saltata', 'info');

    // Go to next question
    nextQuestion();
}

function showFlaggedReview() {
    const flaggedUnanswered = currentQuiz.flagged.filter(idx => !currentQuiz.answers[idx]);

    if (flaggedUnanswered.length === 0) {
        finishQuiz();
        return;
    }

    // Show review prompt
    const reviewPrompt = confirm(`Hai ${flaggedUnanswered.length} domand${flaggedUnanswered.length === 1 ? 'a segnata' : 'e segnate'} per revisione. Vuoi rivederl${flaggedUnanswered.length === 1 ? 'a' : 'e'} ora?`);

    if (reviewPrompt) {
        // Go to first flagged unanswered question
        currentQuiz.currentIndex = flaggedUnanswered[0];
        displayQuestion();
        showToast('Revisione domande segnate', 'warning');
    } else {
        finishQuiz();
    }
}

// ======================================
// Question Palette (Minimap)
// ======================================
function showQuestionPalette() {
    const overlay = document.getElementById('question-palette-overlay');
    const grid = document.getElementById('palette-grid');

    // Clear existing cells
    grid.innerHTML = '';

    // Haptic feedback
    HapticFeedback.light();

    // Calculate stats
    const totalCount = currentQuiz.questions.length;
    const answeredCount = currentQuiz.answers.filter(a => a).length;
    const flaggedCount = currentQuiz.flagged.length;

    // Update stats display
    document.getElementById('palette-total-count').textContent = totalCount;
    document.getElementById('palette-answered-count').textContent = answeredCount;
    document.getElementById('palette-flagged-count').textContent = flaggedCount;

    // Add responsive class based on question count
    grid.classList.remove('many-questions', 'very-many-questions');
    if (totalCount > 100) {
        grid.classList.add('very-many-questions');
    } else if (totalCount > 50) {
        grid.classList.add('many-questions');
    }

    // Create cell for each question
    currentQuiz.questions.forEach((question, idx) => {
        const cell = document.createElement('div');
        cell.className = 'palette-cell';
        cell.textContent = idx + 1;
        cell.dataset.index = idx;

        // Add state classes
        if (idx === currentQuiz.currentIndex) {
            cell.classList.add('current');
        } else if (currentQuiz.answers[idx]) {
            cell.classList.add('answered');
        } else {
            cell.classList.add('unanswered');
        }

        if (currentQuiz.flagged.includes(idx)) {
            cell.classList.add('flagged');
        }

        // Click handler to jump to question
        cell.addEventListener('click', () => {
            currentQuiz.currentIndex = idx;
            displayQuestion();
            closeQuestionPalette();
            HapticFeedback.medium();
            showToast(`Vai alla domanda ${idx + 1}`, 'info');
        });

        grid.appendChild(cell);
    });

    // Setup filter buttons
    const filterButtons = document.querySelectorAll('.btn-filter');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply filter
            const filter = btn.dataset.filter;
            filterPaletteCells(filter);

            HapticFeedback.light();
        });
    });

    // Show overlay
    overlay.classList.remove('hidden');

    // Close on backdrop click
    const backdrop = overlay.querySelector('.palette-backdrop');
    backdrop.addEventListener('click', closeQuestionPalette, { once: true });
}

function filterPaletteCells(filter) {
    const cells = document.querySelectorAll('.palette-cell');

    cells.forEach(cell => {
        const idx = parseInt(cell.dataset.index);
        let shouldShow = true;

        if (filter === 'unanswered') {
            shouldShow = !currentQuiz.answers[idx];
        } else if (filter === 'flagged') {
            shouldShow = currentQuiz.flagged.includes(idx);
        }
        // 'all' shows everything

        if (shouldShow) {
            cell.classList.remove('hidden-by-filter');
        } else {
            cell.classList.add('hidden-by-filter');
        }
    });
}

function closeQuestionPalette() {
    const overlay = document.getElementById('question-palette-overlay');
    overlay.classList.add('hidden');

    // Haptic feedback
    HapticFeedback.light();
}

function finishQuiz() {
    // Check for unanswered questions
    const unansweredCount = currentQuiz.questions.filter((q, idx) => !currentQuiz.answers[idx]).length;

    if (unansweredCount > 0) {
        const confirmFinish = confirm(`Ci sono ancora ${unansweredCount} domande senza risposta. Vuoi terminare il quiz comunque? (Le domande senza risposta saranno considerate sbagliate)`);
        if (!confirmFinish) {
            // Go to first unanswered question
            const firstUnanswered = currentQuiz.questions.findIndex((q, idx) => !currentQuiz.answers[idx]);
            if (firstUnanswered !== -1) {
                currentQuiz.currentIndex = firstUnanswered;
                displayQuestion();
            }
            return;
        }
    }

    stopTimer();

    // Celebration haptic feedback on quiz completion
    HapticFeedback.celebration();

    // Practice Mode: don't save stats/history
    if (currentQuiz.saveToHistory) {
        saveQuizStats();
    }

    showQuizResults();
}

// ======================================
// Timer Functions
// ======================================
function startTimer() {
    const timerDisplay = document.getElementById('timer-display');
    const timerSeconds = document.getElementById('timer-seconds');

    timerDisplay.classList.remove('hidden');

    // Initialize time tracking
    if (!currentQuiz.timeLeft) {
        currentQuiz.timeLeft = currentQuiz.timerDuration;
    }

    let timeLeft = currentQuiz.timeLeft;
    const totalTime = currentQuiz.timerDuration;

    // Format and display initial time
    formatTimerDisplay(timeLeft);

    // Apply initial color based on starting time
    updateTimerColor(timeLeft, totalTime);

    currentQuiz.timer = setInterval(() => {
        timeLeft--;
        currentQuiz.timeLeft = timeLeft; // Store current time

        // Format and display time
        formatTimerDisplay(timeLeft);

        // Update timer color based on percentage remaining
        updateTimerColor(timeLeft, totalTime);

        if (timeLeft <= 0) {
            stopTimer();
            if (currentQuiz.isGlobalTimer) {
                // Exam mode: time's up, end quiz
                endQuiz();
            } else {
                // Per-question timer: auto-submit wrong answer
                const question = currentQuiz.questions[currentQuiz.currentIndex];
                checkAnswer('', question.RispostaCorretta);
            }
        }
    }, 1000);
}

// Helper function to format timer display
function formatTimerDisplay(seconds) {
    const timerSeconds = document.getElementById('timer-seconds');

    if (currentQuiz.isGlobalTimer && seconds >= 60) {
        // Format as MM:SS for global timer
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerSeconds.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
    } else {
        // Just show seconds
        timerSeconds.textContent = seconds;
    }
}

// Helper function to update timer display without restarting
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.classList.remove('hidden');

    if (currentQuiz.timeLeft) {
        formatTimerDisplay(currentQuiz.timeLeft);
        updateTimerColor(currentQuiz.timeLeft, currentQuiz.timerDuration);
    }
}

// Helper function to update timer color based on time percentage
function updateTimerColor(timeLeft, totalTime) {
    const timerDisplay = document.getElementById('timer-display');
    const percentage = (timeLeft / totalTime) * 100;

    // Remove all timer classes
    timerDisplay.classList.remove('timer-safe', 'timer-warning', 'timer-danger', 'warning');

    if (percentage > 50) {
        // Green: > 50% time remaining
        timerDisplay.classList.add('timer-safe');
    } else if (percentage > 20) {
        // Yellow: 20-50% time remaining
        timerDisplay.classList.add('timer-warning');
    } else {
        // Red: < 20% time remaining
        timerDisplay.classList.add('timer-danger');
    }
}

function stopTimer() {
    if (currentQuiz.timer) {
        clearInterval(currentQuiz.timer);
        currentQuiz.timer = null;
    }
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.classList.remove('warning');
}

// Pause and Resume Quiz
function pauseQuiz() {
    if (!currentQuiz || currentQuiz.isPaused) return;

    currentQuiz.isPaused = true;
    HapticFeedback.medium();

    // Store current timer state if timer is active
    if (currentQuiz.timerEnabled && currentQuiz.timer) {
        currentQuiz.pausedTimeLeft = currentQuiz.timeLeft;
        stopTimer();
    }

    // Show pause overlay
    document.getElementById('pause-overlay').classList.remove('hidden');

    // Update pause button icon
    const pauseBtn = document.getElementById('pause-quiz-btn');
    pauseBtn.querySelector('i').className = 'bi bi-play-fill';
    pauseBtn.title = 'Riprendi (Spazio)';

    showToast('Quiz in pausa', 'warning');
}

function resumeQuiz() {
    if (!currentQuiz || !currentQuiz.isPaused) return;

    currentQuiz.isPaused = false;
    HapticFeedback.medium();

    // Hide pause overlay
    document.getElementById('pause-overlay').classList.add('hidden');

    // Restart timer if it was active
    if (currentQuiz.timerEnabled && currentQuiz.pausedTimeLeft !== null) {
        currentQuiz.timeLeft = currentQuiz.pausedTimeLeft;
        currentQuiz.pausedTimeLeft = null;
        startTimer();
    }

    // Update pause button icon
    const pauseBtn = document.getElementById('pause-quiz-btn');
    pauseBtn.querySelector('i').className = 'bi bi-pause-fill';
    pauseBtn.title = 'Pausa (Spazio)';

    showToast('Quiz ripreso', 'success');
}

function togglePauseQuiz() {
    if (currentQuiz.isPaused) {
        resumeQuiz();
    } else {
        pauseQuiz();
    }
}

// ======================================
// Results Display
// ======================================
function displayResults() {
    const totalQuestions = currentQuiz.answers.length;
    const correctAnswers = currentQuiz.answers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const timeElapsed = Math.floor((Date.now() - currentQuiz.startTime) / 1000);

    // Display score
    document.getElementById('final-score').textContent = `${correctAnswers}/${totalQuestions}`;
    document.getElementById('final-percentage').textContent = `${percentage}%`;

    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    document.getElementById('final-time').textContent = `Tempo impiegato: ${minutes}m ${seconds}s`;

    // Performance by subject/area
    const breakdownContainer = document.getElementById('results-breakdown');
    breakdownContainer.innerHTML = '';

    const subjectStats = {};
    currentQuiz.answers.forEach(answer => {
        const subject = answer.question.Materia;
        if (!subjectStats[subject]) {
            subjectStats[subject] = { correct: 0, total: 0 };
        }
        subjectStats[subject].total++;
        if (answer.isCorrect) {
            subjectStats[subject].correct++;
        }
    });

    Object.entries(subjectStats).forEach(([subject, stats]) => {
        const percentage = Math.round((stats.correct / stats.total) * 100);
        const div = document.createElement('div');
        div.className = 'stats-item';
        div.innerHTML = `
            <h6>${subject}</h6>
            <div class="progress">
                <div class="progress-bar ${percentage >= 60 ? 'bg-success' : 'bg-danger'}"
                     style="width: ${percentage}%">
                    ${stats.correct}/${stats.total} (${percentage}%)
                </div>
            </div>
        `;
        breakdownContainer.appendChild(div);
    });

    // Wrong questions
    const wrongAnswers = currentQuiz.answers.filter(a => !a.isCorrect);
    if (wrongAnswers.length > 0) {
        document.getElementById('wrong-questions-list').classList.remove('hidden');
        document.getElementById('retry-wrong-btn').disabled = false;

        const wrongContainer = document.getElementById('wrong-questions-container');
        wrongContainer.innerHTML = '';

        wrongAnswers.forEach((answer, index) => {
            const div = document.createElement('div');
            div.className = 'wrong-question-item';
            div.innerHTML = `
                <div class="question">${index + 1}. ${answer.question.Domanda}</div>
                <div class="your-answer"><i class="bi bi-x-circle me-2"></i>La tua risposta: ${answer.selectedAnswer || '(Nessuna risposta)'}</div>
                <div class="correct-answer"><i class="bi bi-check-circle me-2"></i>Risposta corretta: ${answer.correctAnswer}</div>
            `;
            wrongContainer.appendChild(div);
        });
    } else {
        document.getElementById('wrong-questions-list').classList.add('hidden');
        document.getElementById('retry-wrong-btn').disabled = true;
    }
}

// ======================================
// Statistics Management
// ======================================
function saveQuizStats() {
    const stats = SafeStorage.getItem('quizStats', {});

    if (!stats.totalQuizzes) {
        stats.totalQuizzes = 0;
        stats.totalCorrect = 0;
        stats.totalWrong = 0;
        stats.bySubject = {};
        stats.byArea = {};
    }

    stats.totalQuizzes++;

    // Tracciamento domande completate per materia
    const completedQuestions = SafeStorage.getItem('completedQuestions', {});

    // Tracciamento domande sbagliate per materia
    const wrongBySubject = SafeStorage.getItem('wrongQuestionsBySubject', {});

    // Tracciamento domande sbagliate per area
    const wrongByArea = SafeStorage.getItem('wrongQuestionsByArea', {});

    // Calcolo statistiche per area (trova l'area della materia)
    const getAreaForSubject = (subject) => {
        for (const [areaName, subjects] of Object.entries(config.areas || {})) {
            if (subjects.includes(subject)) {
                return areaName;
            }
        }
        return null;
    };

    currentQuiz.answers.forEach(answer => {
        if (answer.isCorrect) {
            stats.totalCorrect++;
        } else {
            stats.totalWrong++;
        }

        const subject = answer.question.Materia;
        const questionId = answer.question.ID;
        const area = getAreaForSubject(subject);

        // Statistiche per materia
        if (!stats.bySubject[subject]) {
            stats.bySubject[subject] = { correct: 0, wrong: 0 };
        }

        if (answer.isCorrect) {
            stats.bySubject[subject].correct++;
        } else {
            stats.bySubject[subject].wrong++;
        }

        // Statistiche per area
        if (area) {
            if (!stats.byArea[area]) {
                stats.byArea[area] = { correct: 0, wrong: 0 };
            }

            if (answer.isCorrect) {
                stats.byArea[area].correct++;
            } else {
                stats.byArea[area].wrong++;
            }
        }

        // Traccia domande completate (viste) per materia
        if (!completedQuestions[subject]) {
            completedQuestions[subject] = [];
        }
        if (!completedQuestions[subject].includes(questionId)) {
            completedQuestions[subject].push(questionId);
        }

        // Traccia domande sbagliate per materia
        if (!answer.isCorrect) {
            if (!wrongBySubject[subject]) {
                wrongBySubject[subject] = [];
            }
            if (!wrongBySubject[subject].includes(questionId)) {
                wrongBySubject[subject].push(questionId);
            }

            // Traccia domande sbagliate per area
            if (area) {
                if (!wrongByArea[area]) {
                    wrongByArea[area] = [];
                }
                if (!wrongByArea[area].includes(questionId)) {
                    wrongByArea[area].push(questionId);
                }
            }
        }
    });

    // Salva tutto usando SafeStorage
    SafeStorage.setItem('quizStats', stats);
    SafeStorage.setItem('completedQuestions', completedQuestions);
    SafeStorage.setItem('wrongQuestionsBySubject', wrongBySubject);
    SafeStorage.setItem('wrongQuestionsByArea', wrongByArea);

    // Mantieni compatibilità con vecchio sistema
    const wrongIds = currentQuiz.answers
        .filter(a => !a.isCorrect)
        .map(a => a.question.ID);

    const existingWrong = SafeStorage.getItem('wrongQuestions', []);
    const uniqueWrong = [...new Set([...existingWrong, ...wrongIds])];
    SafeStorage.setItem('wrongQuestions', uniqueWrong);

    // Salva cronologia quiz
    const history = SafeStorage.getItem('quizHistory', []);
    const correctCount = currentQuiz.answers.filter(a => a.isCorrect).length;
    const totalCount = currentQuiz.answers.length;
    const score = Math.round((correctCount / totalCount) * 100);

    history.unshift({
        date: new Date().toISOString(),
        mode: currentQuiz.mode,
        target: currentQuiz.target || 'Tutte',
        questionsCount: totalCount,
        correctCount: correctCount,
        score: score
    });

    // Mantieni solo ultime 50 entries
    if (history.length > 50) {
        history.splice(50);
    }

    SafeStorage.setItem('quizHistory', history);
}

function displayStatistics() {
    const stats = SafeStorage.getItem('quizStats', {});

    document.getElementById('stats-total-quizzes').textContent = stats.totalQuizzes || 0;
    document.getElementById('stats-correct-answers').textContent = stats.totalCorrect || 0;
    document.getElementById('stats-wrong-answers').textContent = stats.totalWrong || 0;

    // By area
    const areaContainer = document.getElementById('stats-area-breakdown');
    areaContainer.innerHTML = '';

    if (stats.byArea && Object.keys(stats.byArea).length > 0) {
        Object.entries(stats.byArea).forEach(([area, data]) => {
            const total = data.correct + data.wrong;
            const percentage = Math.round((data.correct / total) * 100);
            const wrongCount = getWrongQuestionsForArea(area).length;

            const div = document.createElement('div');
            div.className = 'stats-item mb-3';
            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${area}</h6>
                    <div class="btn-group btn-group-sm" role="group">
                        ${wrongCount > 0 ? `<button class="btn btn-outline-warning" onclick="retryWrongQuestionsByArea('${area.replace(/'/g, "\\'")}')">
                            <i class="bi bi-arrow-clockwise"></i> Riprova sbagliate (${wrongCount})
                        </button>` : ''}
                        <button class="btn btn-outline-danger" onclick="resetProgressForArea('${area.replace(/'/g, "\\'")}')">
                            <i class="bi bi-trash"></i> Reset
                        </button>
                    </div>
                </div>
                <div class="progress">
                    <div class="progress-bar ${percentage >= 60 ? 'bg-success' : 'bg-danger'}"
                         style="width: ${percentage}%">
                        ${data.correct}/${total} (${percentage}%)
                    </div>
                </div>
            `;
            areaContainer.appendChild(div);
        });
    } else {
        areaContainer.innerHTML = '<p class="text-muted">Nessuna statistica disponibile per area</p>';
    }

    // By subject
    const subjectContainer = document.getElementById('stats-subject-breakdown');
    subjectContainer.innerHTML = '';

    if (stats.bySubject && Object.keys(stats.bySubject).length > 0) {
        Object.entries(stats.bySubject).forEach(([subject, data]) => {
            const total = data.correct + data.wrong;
            const percentage = Math.round((data.correct / total) * 100);
            const wrongCount = getWrongQuestionsForSubject(subject).length;

            const div = document.createElement('div');
            div.className = 'stats-item mb-3';
            div.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${subject}</h6>
                    <div class="btn-group btn-group-sm" role="group">
                        ${wrongCount > 0 ? `<button class="btn btn-outline-warning" onclick="retryWrongQuestionsBySubject('${subject.replace(/'/g, "\\'")}')">
                            <i class="bi bi-arrow-clockwise"></i> Riprova sbagliate (${wrongCount})
                        </button>` : ''}
                        <button class="btn btn-outline-danger" onclick="resetProgressForSubject('${subject.replace(/'/g, "\\'")}')">
                            <i class="bi bi-trash"></i> Reset
                        </button>
                    </div>
                </div>
                <div class="progress">
                    <div class="progress-bar ${percentage >= 60 ? 'bg-success' : 'bg-danger'}"
                         style="width: ${percentage}%">
                        ${data.correct}/${total} (${percentage}%)
                    </div>
                </div>
            `;
            subjectContainer.appendChild(div);
        });
    } else {
        subjectContainer.innerHTML = '<p class="text-muted">Nessuna statistica disponibile</p>';
    }
}

function clearStats() {
    if (confirm('Sei sicuro di voler cancellare tutte le statistiche?')) {
        SafeStorage.removeItem('quizStats');
        SafeStorage.removeItem('wrongQuestions');
        showToast('Statistiche cancellate con successo!');
        displayStatistics();
        updateDashboard();
    }
}

function retryWrongQuestions() {
    document.getElementById('quiz-mode-select').value = 'wrong';
    showQuizSetup();
}

function retryWrongQuestionsByArea(areaName) {
    // Imposta la modalità e il topic
    document.getElementById('quiz-mode-select').value = 'wrong-by-area';
    showQuizSetup();

    // Dopo che il setup è visibile, imposta l'area
    setTimeout(() => {
        const topicSelect = document.getElementById('quiz-topic-select');
        topicSelect.value = areaName;
    }, 100);
}

function retryWrongQuestionsBySubject(subjectName) {
    // Imposta la modalità e il topic
    document.getElementById('quiz-mode-select').value = 'wrong-by-subject';
    showQuizSetup();

    // Dopo che il setup è visibile, imposta la materia
    setTimeout(() => {
        const topicSelect = document.getElementById('quiz-topic-select');
        topicSelect.value = subjectName;
    }, 100);
}

// ======================================
// Areas Management
// ======================================
function populateAreasManagement() {
    // Get unique subjects
    const subjects = [...new Set(allQuestions.map(q => q.Materia))].sort();

    // Populate subject multiselect
    const subjectMultiselect = document.getElementById('subject-multiselect');
    subjectMultiselect.innerHTML = '';

    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectMultiselect.appendChild(option);
    });

    // Populate area select
    updateAreaSelect();

    // Display current associations
    displayCurrentAssociations();

    // Update subject UI to show which are assigned
    updateSubjectMultiselectUI();
}

function updateSubjectMultiselectUI() {
    const subjectMultiselect = document.getElementById('subject-multiselect');
    const options = subjectMultiselect.querySelectorAll('option');

    // Find which subjects are assigned to which areas
    const assignedSubjects = {};
    Object.entries(config.areas).forEach(([area, subjects]) => {
        subjects.forEach(subject => {
            assignedSubjects[subject] = area;
        });
    });

    // Update each option to show if it's already assigned
    options.forEach(option => {
        const subject = option.value;
        if (assignedSubjects[subject]) {
            option.textContent = `${subject} ✓ (${assignedSubjects[subject]})`;
            option.style.color = '#6c757d';
            option.style.fontStyle = 'italic';
        } else {
            option.textContent = subject;
            option.style.color = '';
            option.style.fontStyle = '';
        }
    });
}

function addArea() {
    const areaName = document.getElementById('new-area-input').value.trim();

    if (!areaName) {
        showToast('Inserisci un nome per l\'area!');
        return;
    }

    if (config.areas[areaName]) {
        showToast('Questa area esiste già!');
        return;
    }

    config.areas[areaName] = [];
    document.getElementById('new-area-input').value = '';

    // Save config to localStorage (for mobile persistence)
    SafeStorage.setItem('quizConfig', config);

    updateAreaSelect();
    displayCurrentAssociations();
    updateSubjectMultiselectUI();
    showToast(`Area "${areaName}" creata con successo!`);
}

function updateAreaSelect() {
    const areaSelect = document.getElementById('area-select');
    areaSelect.innerHTML = '';

    Object.keys(config.areas).forEach(areaName => {
        const option = document.createElement('option');
        option.value = areaName;
        option.textContent = areaName;
        areaSelect.appendChild(option);
    });

    if (Object.keys(config.areas).length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Nessuna area disponibile';
        areaSelect.appendChild(option);
    }
}

function saveAreaSubjects() {
    const areaName = document.getElementById('area-select').value;
    const subjectMultiselect = document.getElementById('subject-multiselect');
    const selectedSubjects = Array.from(subjectMultiselect.selectedOptions).map(opt => opt.value);

    if (!areaName || areaName === 'Nessuna area disponibile') {
        showToast('Seleziona un\'area valida!');
        return;
    }

    if (selectedSubjects.length === 0) {
        showToast('Seleziona almeno una materia!');
        return;
    }

    // Check if subjects are already associated with other areas (ESCLUSIVITÀ)
    const conflicts = [];
    selectedSubjects.forEach(subject => {
        Object.entries(config.areas).forEach(([area, subjects]) => {
            if (area !== areaName && subjects.includes(subject)) {
                conflicts.push({ subject, area });
            }
        });
    });

    // If there are conflicts, ask for confirmation
    if (conflicts.length > 0) {
        const conflictList = conflicts.map(c => `- "${c.subject}" è già in "${c.area}"`).join('\n');
        const message = `Attenzione! Le seguenti materie sono già associate ad altre aree:\n\n${conflictList}\n\nVerranno rimosse dalle aree precedenti e assegnate a "${areaName}". Continuare?`;

        if (!confirm(message)) {
            return;
        }

        // Remove subjects from other areas
        conflicts.forEach(c => {
            config.areas[c.area] = config.areas[c.area].filter(s => s !== c.subject);
        });
    }

    config.areas[areaName] = selectedSubjects;

    // Save config to localStorage (for mobile persistence)
    SafeStorage.setItem('quizConfig', config);

    displayCurrentAssociations();
    showToast(`Associazione salvata per "${areaName}"!`);

    // Update the subject multiselect to show which subjects are already assigned
    updateSubjectMultiselectUI();
}

function displayCurrentAssociations() {
    const container = document.getElementById('current-associations-display');

    if (Object.keys(config.areas).length === 0) {
        container.innerHTML = '<p class="text-muted">Nessuna associazione configurata</p>';
        return;
    }

    let html = '';
    Object.entries(config.areas).forEach(([areaName, subjects]) => {
        html += `<div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <strong>${areaName}:</strong>
                ${subjects.length === 0 ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteArea('${areaName.replace(/'/g, "\\'")}')">
                    <i class="bi bi-trash"></i> Elimina Area
                </button>` : ''}
            </div>
            ${subjects.length > 0 ? subjects.map(s => `
                <span class="association-badge">
                    ${s}
                    <i class="bi bi-x-circle ms-1"
                       style="cursor: pointer; color: #dc3545;"
                       onclick="removeSubjectFromArea('${areaName.replace(/'/g, "\\'")}', '${s.replace(/'/g, "\\'")}')"
                       title="Rimuovi ${s} da ${areaName}"></i>
                </span>`).join(' ') : '<em class="text-muted">Nessuna materia associata</em>'}
        </div>`;
    });

    container.innerHTML = html;

    // Update the subject multiselect UI when displaying associations
    updateSubjectMultiselectUI();
}

function removeSubjectFromArea(areaName, subjectName) {
    if (!confirm(`Vuoi rimuovere "${subjectName}" dall'area "${areaName}"?`)) {
        return;
    }

    // Rimuovi la materia dall'area
    if (config.areas[areaName]) {
        config.areas[areaName] = config.areas[areaName].filter(s => s !== subjectName);
    }

    // Salva in localStorage
    SafeStorage.setItem('quizConfig', config);

    // Aggiorna UI
    displayCurrentAssociations();
    updateSubjectMultiselectUI();
    showToast(`"${subjectName}" rimosso da "${areaName}"`);
}

function deleteArea(areaName) {
    // Verifica che l'area sia vuota
    if (config.areas[areaName] && config.areas[areaName].length > 0) {
        showToast('Non puoi eliminare un\'area che contiene materie!');
        return;
    }

    if (!confirm(`Vuoi eliminare l'area "${areaName}"?`)) {
        return;
    }

    // Elimina l'area
    delete config.areas[areaName];

    // Salva in localStorage
    SafeStorage.setItem('quizConfig', config);

    // Aggiorna UI
    updateAreaSelect();
    displayCurrentAssociations();
    updateDashboard();
    showToast(`Area "${areaName}" eliminata!`);
}


// ======================================
// Dashboard Updates
// ======================================
function updateDashboard() {
    // Update badges
    document.getElementById('question-count-badge').textContent = `${allQuestions.length} Domande`;
    document.getElementById('areas-count-badge').textContent = `${Object.keys(config.areas || {}).length} Aree`;

    // Update stats cards
    document.getElementById('total-questions-stat').textContent = allQuestions.length;
    document.getElementById('total-areas-stat').textContent = Object.keys(config.areas || {}).length;

    const stats = SafeStorage.getItem('quizStats', {});
    document.getElementById('quiz-completed-stat').textContent = stats.totalQuizzes || 0;

    const wrongIds = SafeStorage.getItem('wrongQuestions', []);
    document.getElementById('wrong-questions-stat').textContent = wrongIds.length;

    // Update area progress section
    const areaProgressContainer = document.getElementById('area-progress-container');
    if (areaProgressContainer) {
        const areas = Object.keys(config.areas || {});

        if (areas.length === 0) {
            areaProgressContainer.innerHTML = '<p class="text-muted">Configura le aree per vedere il progresso</p>';
        } else {
            let html = '';
            areas.forEach(areaName => {
                const progress = getProgressForArea(areaName);
                const wrongCount = getWrongQuestionsForArea(areaName).length;
                const progressClass = progress.percentage === 100 ? 'bg-success' : (progress.percentage >= 50 ? 'bg-primary' : 'bg-warning');
                const completedBadge = progress.percentage === 100 ? '<span class="badge bg-success ms-2">✓ Completata</span>' : '';

                html += `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <strong>${areaName}${completedBadge}</strong>
                            <span class="text-muted">${progress.completed}/${progress.total} domande (${progress.percentage}%)</span>
                        </div>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${progress.percentage}%"
                                 aria-valuenow="${progress.percentage}" aria-valuemin="0" aria-valuemax="100">
                                ${progress.percentage}%
                            </div>
                        </div>
                        <div class="mt-1">
                            <small class="text-muted">
                                ${wrongCount > 0 ? `<i class="bi bi-x-circle text-danger"></i> ${wrongCount} sbagliate` : '<i class="bi bi-check-circle text-success"></i> Nessuna domanda sbagliata'}
                            </small>
                        </div>
                    </div>
                `;
            });

            areaProgressContainer.innerHTML = html;
        }
    }
}

// ======================================
// Utility Functions
// ======================================
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function showToast(message) {
    const toastEl = document.getElementById('notification-toast');
    const toastBody = document.getElementById('toast-message');

    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// ======================================
// Reload Data Function
// ======================================
async function reloadDataFromFiles() {
    const previousQuestionsCount = allQuestions.length;
    const previousAreasCount = Object.keys(config.areas).length;

    await loadDataFromFile();
    await loadConfigFromFile();
    updateDashboard();

    const newQuestionsCount = allQuestions.length;
    const newAreasCount = Object.keys(config.areas).length;

    if (newQuestionsCount > 0 || newAreasCount > 0) {
        showToast(`Dati ricaricati! ${newQuestionsCount} domande, ${newAreasCount} aree.`);
    } else if (previousQuestionsCount > 0 || previousAreasCount > 0) {
        showToast('File JSON non trovati. Assicurati che data.json e config.json siano nella cartella quiz-app.');
    } else {
        showToast('Nessun file JSON trovato. Importa le domande prima.');
    }
}

// ======================================
// Reset Progress Functions
// ======================================
function resetProgressForArea(areaName) {
    if (!confirm(`Vuoi resettare tutto il progresso per l'area "${areaName}"?\n\nQuesto cancellerà:\n- Domande completate\n- Domande sbagliate\n- Statistiche\n\nLe domande rimarranno disponibili.`)) {
        return;
    }

    const subjects = config.areas[areaName] || [];

    // Rimuovi domande completate per tutte le materie dell'area
    const completed = SafeStorage.getItem('completedQuestions', {});
    subjects.forEach(subject => {
        delete completed[subject];
    });
    SafeStorage.setItem('completedQuestions', completed);

    // Rimuovi domande sbagliate per area
    const wrongByArea = SafeStorage.getItem('wrongQuestionsByArea', {});
    delete wrongByArea[areaName];
    SafeStorage.setItem('wrongQuestionsByArea', wrongByArea);

    // Rimuovi domande sbagliate per materie dell'area
    const wrongBySubject = SafeStorage.getItem('wrongQuestionsBySubject', {});
    subjects.forEach(subject => {
        delete wrongBySubject[subject];
    });
    SafeStorage.setItem('wrongQuestionsBySubject', wrongBySubject);

    // Azzera statistiche per area
    const stats = SafeStorage.getItem('quizStats', {});
    if (stats.byArea) {
        delete stats.byArea[areaName];
    }
    // Azzera statistiche per materie dell'area
    if (stats.bySubject) {
        subjects.forEach(subject => {
            delete stats.bySubject[subject];
        });
    }
    SafeStorage.setItem('quizStats', stats);

    // Rimuovi domande sbagliate globali che appartengono all'area
    const wrongQuestions = SafeStorage.getItem('wrongQuestions', []);
    const areaQuestionIds = allQuestions
        .filter(q => subjects.includes(q.Materia))
        .map(q => q.ID);
    const filteredWrong = wrongQuestions.filter(id => !areaQuestionIds.includes(id));
    SafeStorage.setItem('wrongQuestions', filteredWrong);

    showToast(`Progresso per "${areaName}" resettato!`);
    updateDashboard();
    displayStatistics();
}

function resetProgressForSubject(subjectName) {
    if (!confirm(`Vuoi resettare tutto il progresso per la materia "${subjectName}"?\n\nQuesto cancellerà:\n- Domande completate\n- Domande sbagliate\n- Statistiche\n\nLe domande rimarranno disponibili.`)) {
        return;
    }

    // Rimuovi domande completate per la materia
    const completed = SafeStorage.getItem('completedQuestions', {});
    delete completed[subjectName];
    SafeStorage.setItem('completedQuestions', completed);

    // Rimuovi domande sbagliate per materia
    const wrongBySubject = SafeStorage.getItem('wrongQuestionsBySubject', {});
    delete wrongBySubject[subjectName];
    SafeStorage.setItem('wrongQuestionsBySubject', wrongBySubject);

    // Azzera statistiche per materia
    const stats = SafeStorage.getItem('quizStats', {});
    if (stats.bySubject) {
        delete stats.bySubject[subjectName];
    }
    SafeStorage.setItem('quizStats', stats);

    // Rimuovi domande sbagliate globali che appartengono alla materia
    const wrongQuestions = SafeStorage.getItem('wrongQuestions', []);
    const subjectQuestionIds = allQuestions
        .filter(q => q.Materia === subjectName)
        .map(q => q.ID);
    const filteredWrong = wrongQuestions.filter(id => !subjectQuestionIds.includes(id));
    SafeStorage.setItem('wrongQuestions', filteredWrong);

    // Aggiorna anche wrongByArea se questa materia era in un'area
    const wrongByArea = SafeStorage.getItem('wrongQuestionsByArea', {});
    for (const [areaName, subjects] of Object.entries(config.areas || {})) {
        if (subjects.includes(subjectName)) {
            if (wrongByArea[areaName]) {
                wrongByArea[areaName] = wrongByArea[areaName].filter(id => !subjectQuestionIds.includes(id));
            }
        }
    }
    SafeStorage.setItem('wrongQuestionsByArea', wrongByArea);

    showToast(`Progresso per "${subjectName}" resettato!`);
    updateDashboard();
    displayStatistics();
}

// ======================================
// Progress Tracking Helper Functions
// ======================================
function getProgressForSubject(subjectName) {
    const completed = SafeStorage.getItem('completedQuestions', {});
    const completedIds = completed[subjectName] || [];
    const totalQuestions = allQuestions.filter(q => q.Materia === subjectName).length;
    const percentage = totalQuestions > 0 ? Math.round((completedIds.length / totalQuestions) * 100) : 0;

    return {
        completed: completedIds.length,
        total: totalQuestions,
        percentage: percentage
    };
}

function getProgressForArea(areaName) {
    const subjects = config.areas[areaName] || [];
    const completed = SafeStorage.getItem('completedQuestions', {});

    let totalCompleted = 0;
    let totalQuestions = 0;

    subjects.forEach(subject => {
        const completedIds = completed[subject] || [];
        totalCompleted += completedIds.length;
        totalQuestions += allQuestions.filter(q => q.Materia === subject).length;
    });

    const percentage = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

    return {
        completed: totalCompleted,
        total: totalQuestions,
        percentage: percentage
    };
}

function getWrongQuestionsForSubject(subjectName) {
    const wrongBySubject = SafeStorage.getItem('wrongQuestionsBySubject', {});
    return wrongBySubject[subjectName] || [];
}

function getWrongQuestionsForArea(areaName) {
    const wrongByArea = SafeStorage.getItem('wrongQuestionsByArea', {});
    return wrongByArea[areaName] || [];
}

// ======================================
// Theme Management (Dark Mode)
// ======================================
function loadThemePreference() {
    // Use raw localStorage for theme (simple string, no need for JSON parsing)
    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('theme') || 'light';
    } catch (e) {
        console.error('Error reading theme from localStorage:', e);
    }
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    // Use raw localStorage per theme (simple string, no need for SafeStorage)
    try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (e) {
        console.error('Error saving theme preference:', e);
    }
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('theme-icon');
    if (isDark) {
        icon.classList.remove('bi-moon-fill');
        icon.classList.add('bi-sun-fill');
    } else {
        icon.classList.remove('bi-sun-fill');
        icon.classList.add('bi-moon-fill');
    }
}
