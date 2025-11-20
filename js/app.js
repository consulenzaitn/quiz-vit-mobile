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

    // Back buttons
    document.getElementById('back-from-quiz-setup-btn').addEventListener('click', showMainMenu);
    document.getElementById('back-from-stats-btn').addEventListener('click', showMainMenu);
    document.getElementById('back-from-areas-btn').addEventListener('click', showMainMenu);
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
        'stats-container', 'manage-areas-container'
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
    const topicSelect = document.getElementById('quiz-topic-select');

    topicSelect.innerHTML = '';

    if (mode === 'area') {
        topicContainer.classList.remove('hidden');
        numContainer.classList.add('hidden');

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
        numContainer.classList.add('hidden');

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
    }

    if (selectedQuestions.length === 0) {
        showToast('Nessuna domanda disponibile per questa selezione!');
        return;
    }

    // Initialize quiz
    currentQuiz = {
        questions: shuffleArray(selectedQuestions),
        currentIndex: 0,
        answers: [],
        startTime: Date.now(),
        timer: null,
        timerDuration: timerDuration,
        timerEnabled: timerEnabled
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

    currentQuiz.answers.forEach(answer => {
        if (answer.isCorrect) {
            stats.totalCorrect++;
        } else {
            stats.totalWrong++;
        }

        const subject = answer.question.Materia;
        if (!stats.bySubject[subject]) {
            stats.bySubject[subject] = { correct: 0, wrong: 0 };
        }

        if (answer.isCorrect) {
            stats.bySubject[subject].correct++;
        } else {
            stats.bySubject[subject].wrong++;
        }
    });

    localStorage.setItem('quizStats', JSON.stringify(stats));

    // Save wrong questions IDs
    const wrongIds = currentQuiz.answers
        .filter(a => !a.isCorrect)
        .map(a => a.question.ID);

    const existingWrong = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
    const uniqueWrong = [...new Set([...existingWrong, ...wrongIds])];
    localStorage.setItem('wrongQuestions', JSON.stringify(uniqueWrong));
}

function displayStatistics() {
    const stats = JSON.parse(localStorage.getItem('quizStats') || '{}');

    document.getElementById('stats-total-quizzes').textContent = stats.totalQuizzes || 0;
    document.getElementById('stats-correct-answers').textContent = stats.totalCorrect || 0;
    document.getElementById('stats-wrong-answers').textContent = stats.totalWrong || 0;

    // By subject
    const subjectContainer = document.getElementById('stats-subject-breakdown');
    subjectContainer.innerHTML = '';

    if (stats.bySubject && Object.keys(stats.bySubject).length > 0) {
        Object.entries(stats.bySubject).forEach(([subject, data]) => {
            const total = data.correct + data.wrong;
            const percentage = Math.round((data.correct / total) * 100);

            const div = document.createElement('div');
            div.className = 'stats-item';
            div.innerHTML = `
                <h6>${subject}</h6>
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
            ${subjects.length > 0 ? subjects.map(s => `<span class="association-badge">${s}</span>`).join(' ') : '<em class="text-muted">Nessuna materia associata</em>'}
        </div>`;
    });

    container.innerHTML = html;

    // Update the subject multiselect UI when displaying associations
    updateSubjectMultiselectUI();
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
