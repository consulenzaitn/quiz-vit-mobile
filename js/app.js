// ======================================
// Quiz VIT - Application Logic
// ======================================

// Global State
let allQuestions = [];
let config = { areas: {}, version: '1.0' };
let currentQuiz = {
    questions: [],
    currentIndex: 0,
    answers: [],
    startTime: null,
    timer: null,
    timerDuration: 30
};

// ======================================
// Initialization
// ======================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    attachEventListeners();
});

function initApp() {
    loadEmbeddedData();
    loadThemePreference();
    updateDashboard();
}

// ======================================
// Data Loading (from embedded data)
// ======================================
function loadEmbeddedData() {
    // Carica dati da window.QUIZ_DATA (embedded da data-embedded.js)
    if (window.QUIZ_DATA) {
        allQuestions = window.QUIZ_DATA;
        console.log(`📱 Mobile: Loaded ${allQuestions.length} questions from embedded data`);
    } else {
        console.error('❌ window.QUIZ_DATA not found!');
        allQuestions = [];
    }

    // Carica config da localStorage o usa quello embedded
    const savedConfig = localStorage.getItem('quizConfig');
    if (savedConfig) {
        try {
            config = JSON.parse(savedConfig);
            console.log(`📱 Mobile: Loaded config from localStorage: ${Object.keys(config.areas).length} areas`);
        } catch (e) {
            console.log('Error loading config from localStorage, using embedded default');
            config = window.QUIZ_CONFIG || { areas: {}, version: '1.0' };
        }
    } else {
        config = window.QUIZ_CONFIG || { areas: {}, version: '1.0' };
        console.log('📱 Mobile: Using embedded default config (no areas configured yet)');
    }

    updateDashboard();
}

// ======================================
// Event Listeners
// ======================================
function attachEventListeners() {
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

    // Quiz setup
    document.getElementById('quiz-mode-select').addEventListener('change', updateQuizSetupUI);
    document.getElementById('timer-checkbox').addEventListener('change', toggleTimerSettings);
    document.getElementById('start-actual-quiz-btn').addEventListener('click', startQuiz);

    // Quiz
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
}

function showManageAreas() {
    if (allQuestions.length === 0) {
        showToast('Nessuna domanda disponibile!');
        return;
    }

    hideAllViews();
    document.getElementById('manage-areas-container').classList.remove('hidden');
    populateAreasManagement();
}

function showHistory() {
    hideAllViews();
    document.getElementById('history-container').classList.remove('hidden');
    displayHistory();
}

function displayHistory() {
    const historyContainer = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');

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
// Quiz Execution
// ======================================
function startQuiz() {
    const mode = document.getElementById('quiz-mode-select').value;
    const topic = document.getElementById('quiz-topic-select').value;
    const numQuestions = parseInt(document.getElementById('num-questions-input').value) || 10;
    const timerEnabled = document.getElementById('timer-checkbox').checked;
    const timerDuration = parseInt(document.getElementById('timer-duration-input').value) || 30;
    const excludeSeenCheckbox = document.getElementById('exclude-seen-checkbox');
    const excludeSeen = excludeSeenCheckbox ? excludeSeenCheckbox.checked : false;

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
        const wrongIds = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
        selectedQuestions = allQuestions.filter(q => wrongIds.includes(q.ID));
    } else if (mode === 'wrong-by-area') {
        const wrongIds = getWrongQuestionsForArea(topic);
        selectedQuestions = allQuestions.filter(q => wrongIds.includes(q.ID));
    } else if (mode === 'wrong-by-subject') {
        const wrongIds = getWrongQuestionsForSubject(topic);
        selectedQuestions = allQuestions.filter(q => wrongIds.includes(q.ID));
    }

    // Escludi domande già viste se richiesto
    if (excludeSeen && mode !== 'wrong' && mode !== 'wrong-by-area' && mode !== 'wrong-by-subject') {
        const completed = JSON.parse(localStorage.getItem('completedQuestions') || '{}');

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

    // Limita il numero di domande se richiesto
    if (mode !== 'wrong' && mode !== 'wrong-by-area' && mode !== 'wrong-by-subject') {
        selectedQuestions = shuffleArray(selectedQuestions).slice(0, numQuestions);
    }

    // Initialize quiz
    currentQuiz = {
        questions: shuffleArray(selectedQuestions),
        currentIndex: 0,
        answers: [],
        startTime: Date.now(),
        timer: null,
        timerDuration: timerDuration,
        timerEnabled: timerEnabled,
        mode: mode,
        target: topic
    };

    showQuizView();
    displayQuestion();
}

function displayQuestion() {
    const question = currentQuiz.questions[currentQuiz.currentIndex];
    const totalQuestions = currentQuiz.questions.length;
    const currentNum = currentQuiz.currentIndex + 1;

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
        btn.addEventListener('click', () => checkAnswer(answer, question.RispostaCorretta));
        answersContainer.appendChild(btn);
    });

    // Hide feedback
    document.getElementById('answer-feedback').classList.add('hidden');

    // Start timer if enabled
    if (currentQuiz.timerEnabled) {
        startTimer();
    } else {
        document.getElementById('timer-display').classList.add('hidden');
    }
}

function checkAnswer(selectedAnswer, correctAnswer) {
    stopTimer();

    const isCorrect = selectedAnswer === correctAnswer;

    // Record answer
    currentQuiz.answers.push({
        question: currentQuiz.questions[currentQuiz.currentIndex],
        selectedAnswer: selectedAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
    });

    // Visual feedback
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
    } else {
        messageEl.className = 'alert alert-danger';
        messageEl.innerHTML = `<i class="bi bi-x-circle me-2"></i><strong>Sbagliato!</strong> La risposta corretta è: <strong>${correctAnswer}</strong>`;
    }

    feedbackEl.classList.remove('hidden');
}

function nextQuestion() {
    currentQuiz.currentIndex++;

    if (currentQuiz.currentIndex < currentQuiz.questions.length) {
        displayQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    stopTimer();
    saveQuizStats();
    showQuizResults();
}

// ======================================
// Timer Functions
// ======================================
function startTimer() {
    const timerDisplay = document.getElementById('timer-display');
    const timerSeconds = document.getElementById('timer-seconds');

    timerDisplay.classList.remove('hidden');

    let timeLeft = currentQuiz.timerDuration;
    timerSeconds.textContent = timeLeft;

    currentQuiz.timer = setInterval(() => {
        timeLeft--;
        timerSeconds.textContent = timeLeft;

        if (timeLeft <= 5) {
            timerDisplay.classList.add('warning');
        }

        if (timeLeft <= 0) {
            stopTimer();
            // Auto-submit wrong answer
            const question = currentQuiz.questions[currentQuiz.currentIndex];
            checkAnswer('', question.RispostaCorretta);
        }
    }, 1000);
}

function stopTimer() {
    if (currentQuiz.timer) {
        clearInterval(currentQuiz.timer);
        currentQuiz.timer = null;
    }
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.classList.remove('warning');
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
    const stats = JSON.parse(localStorage.getItem('quizStats') || '{}');

    if (!stats.totalQuizzes) {
        stats.totalQuizzes = 0;
        stats.totalCorrect = 0;
        stats.totalWrong = 0;
        stats.bySubject = {};
        stats.byArea = {};
    }

    stats.totalQuizzes++;

    // Tracciamento domande completate per materia
    const completedQuestions = JSON.parse(localStorage.getItem('completedQuestions') || '{}');

    // Tracciamento domande sbagliate per materia
    const wrongBySubject = JSON.parse(localStorage.getItem('wrongQuestionsBySubject') || '{}');

    // Tracciamento domande sbagliate per area
    const wrongByArea = JSON.parse(localStorage.getItem('wrongQuestionsByArea') || '{}');

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

    // Salva tutto in localStorage
    localStorage.setItem('quizStats', JSON.stringify(stats));
    localStorage.setItem('completedQuestions', JSON.stringify(completedQuestions));
    localStorage.setItem('wrongQuestionsBySubject', JSON.stringify(wrongBySubject));
    localStorage.setItem('wrongQuestionsByArea', JSON.stringify(wrongByArea));

    // Mantieni compatibilità con vecchio sistema
    const wrongIds = currentQuiz.answers
        .filter(a => !a.isCorrect)
        .map(a => a.question.ID);

    const existingWrong = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
    const uniqueWrong = [...new Set([...existingWrong, ...wrongIds])];
    localStorage.setItem('wrongQuestions', JSON.stringify(uniqueWrong));

    // Salva cronologia quiz
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
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

    localStorage.setItem('quizHistory', JSON.stringify(history));
}

function displayStatistics() {
    const stats = JSON.parse(localStorage.getItem('quizStats') || '{}');

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
        localStorage.removeItem('quizStats');
        localStorage.removeItem('wrongQuestions');
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
    localStorage.setItem('quizConfig', JSON.stringify(config));

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
    localStorage.setItem('quizConfig', JSON.stringify(config));

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
            <strong>${areaName}:</strong><br>
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
    localStorage.setItem('quizConfig', JSON.stringify(config));

    // Aggiorna UI
    displayCurrentAssociations();
    updateSubjectMultiselectUI();
    showToast(`"${subjectName}" rimosso da "${areaName}"`);
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

    const stats = JSON.parse(localStorage.getItem('quizStats') || '{}');
    document.getElementById('quiz-completed-stat').textContent = stats.totalQuizzes || 0;

    const wrongIds = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
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
    const completed = JSON.parse(localStorage.getItem('completedQuestions') || '{}');
    subjects.forEach(subject => {
        delete completed[subject];
    });
    localStorage.setItem('completedQuestions', JSON.stringify(completed));

    // Rimuovi domande sbagliate per area
    const wrongByArea = JSON.parse(localStorage.getItem('wrongQuestionsByArea') || '{}');
    delete wrongByArea[areaName];
    localStorage.setItem('wrongQuestionsByArea', JSON.stringify(wrongByArea));

    // Rimuovi domande sbagliate per materie dell'area
    const wrongBySubject = JSON.parse(localStorage.getItem('wrongQuestionsBySubject') || '{}');
    subjects.forEach(subject => {
        delete wrongBySubject[subject];
    });
    localStorage.setItem('wrongQuestionsBySubject', JSON.stringify(wrongBySubject));

    // Azzera statistiche per area
    const stats = JSON.parse(localStorage.getItem('quizStats') || '{}');
    if (stats.byArea) {
        delete stats.byArea[areaName];
    }
    // Azzera statistiche per materie dell'area
    if (stats.bySubject) {
        subjects.forEach(subject => {
            delete stats.bySubject[subject];
        });
    }
    localStorage.setItem('quizStats', JSON.stringify(stats));

    // Rimuovi domande sbagliate globali che appartengono all'area
    const wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
    const areaQuestionIds = allQuestions
        .filter(q => subjects.includes(q.Materia))
        .map(q => q.ID);
    const filteredWrong = wrongQuestions.filter(id => !areaQuestionIds.includes(id));
    localStorage.setItem('wrongQuestions', JSON.stringify(filteredWrong));

    showToast(`Progresso per "${areaName}" resettato!`);
    updateDashboard();
    displayStatistics();
}

function resetProgressForSubject(subjectName) {
    if (!confirm(`Vuoi resettare tutto il progresso per la materia "${subjectName}"?\n\nQuesto cancellerà:\n- Domande completate\n- Domande sbagliate\n- Statistiche\n\nLe domande rimarranno disponibili.`)) {
        return;
    }

    // Rimuovi domande completate per la materia
    const completed = JSON.parse(localStorage.getItem('completedQuestions') || '{}');
    delete completed[subjectName];
    localStorage.setItem('completedQuestions', JSON.stringify(completed));

    // Rimuovi domande sbagliate per materia
    const wrongBySubject = JSON.parse(localStorage.getItem('wrongQuestionsBySubject') || '{}');
    delete wrongBySubject[subjectName];
    localStorage.setItem('wrongQuestionsBySubject', JSON.stringify(wrongBySubject));

    // Azzera statistiche per materia
    const stats = JSON.parse(localStorage.getItem('quizStats') || '{}');
    if (stats.bySubject) {
        delete stats.bySubject[subjectName];
    }
    localStorage.setItem('quizStats', JSON.stringify(stats));

    // Rimuovi domande sbagliate globali che appartengono alla materia
    const wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
    const subjectQuestionIds = allQuestions
        .filter(q => q.Materia === subjectName)
        .map(q => q.ID);
    const filteredWrong = wrongQuestions.filter(id => !subjectQuestionIds.includes(id));
    localStorage.setItem('wrongQuestions', JSON.stringify(filteredWrong));

    // Aggiorna anche wrongByArea se questa materia era in un'area
    const wrongByArea = JSON.parse(localStorage.getItem('wrongQuestionsByArea') || '{}');
    for (const [areaName, subjects] of Object.entries(config.areas || {})) {
        if (subjects.includes(subjectName)) {
            if (wrongByArea[areaName]) {
                wrongByArea[areaName] = wrongByArea[areaName].filter(id => !subjectQuestionIds.includes(id));
            }
        }
    }
    localStorage.setItem('wrongQuestionsByArea', JSON.stringify(wrongByArea));

    showToast(`Progresso per "${subjectName}" resettato!`);
    updateDashboard();
    displayStatistics();
}

// ======================================
// Progress Tracking Helper Functions
// ======================================
function getProgressForSubject(subjectName) {
    const completed = JSON.parse(localStorage.getItem('completedQuestions') || '{}');
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
    const completed = JSON.parse(localStorage.getItem('completedQuestions') || '{}');

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
    const wrongBySubject = JSON.parse(localStorage.getItem('wrongQuestionsBySubject') || '{}');
    return wrongBySubject[subjectName] || [];
}

function getWrongQuestionsForArea(areaName) {
    const wrongByArea = JSON.parse(localStorage.getItem('wrongQuestionsByArea') || '{}');
    return wrongByArea[areaName] || [];
}

// ======================================
// Theme Management (Dark Mode)
// ======================================
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
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
