// Global variables
let currentSection = 'dashboard';
let currentWeek = 1;
let pomodoroTimer = null;
let pomodoroState = {
    isRunning: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    isWorkTime: true,
    completedPomodoros: 0
};

// Charts variables
let academicChart = null;
let physicalChart = null;

// Data structure
const materias = [
    {
        nombre: "Cálculo Integral",
        creditos: 4,
        horasSemanales: 12.5,
        temas: ["Integral Definida", "Teorema Fundamental del Cálculo", "Técnicas de Integración", "Aplicaciones de la Integral"]
    },
    {
        nombre: "Circuitos Electrónicos",
        creditos: 4,
        horasSemanales: 7.5,
        temas: ["Conceptos Básicos", "Leyes de Kirchhoff", "Análisis DC", "Análisis AC"]
    },
    {
        nombre: "Física I - Electricidad y Magnetismo",
        creditos: 4,
        horasSemanales: 2,
        temas: ["Carga Eléctrica", "Campo Eléctrico", "Potencial Eléctrico", "Corriente Eléctrica"]
    },
    {
        nombre: "Materiales",
        creditos: 3,
        horasSemanales: 2.5,
        temas: ["Introducción a Materiales", "Estructura Atómica", "Propiedades Mecánicas", "Análisis de Falla"]
    },
    {
        nombre: "Programación III",
        creditos: 3,
        horasSemanales: 3.75,
        temas: ["Listas Secuenciales", "Pilas y Colas", "Listas Enlazadas", "Árboles"]
    }
];

const rutinaDiaria = [
    {"horario": "5:00-5:10", "actividad": "Aseo personal y orden", "tipo": "personal"},
    {"horario": "5:10-5:30", "actividad": "Activación física (dominadas y fondos)", "tipo": "ejercicio"},
    {"horario": "5:30-5:40", "actividad": "Ducha fría", "tipo": "personal"},
    {"horario": "5:40-6:00", "actividad": "Mindfulness + planificación", "tipo": "personal"},
    {"horario": "6:00-6:45", "actividad": "Aseo del hogar", "tipo": "personal"},
    {"horario": "6:45-8:00", "actividad": "Deep Work: Cálculo Integral", "tipo": "academico"},
    {"horario": "8:00-8:45", "actividad": "Desayuno + higiene + estiramientos", "tipo": "personal"},
    {"horario": "8:45-10:00", "actividad": "Cálculo Integral (Pomodoros)", "tipo": "academico"},
    {"horario": "10:00-11:30", "actividad": "Circuitos (Pomodoros)", "tipo": "academico"},
    {"horario": "11:30-11:45", "actividad": "Preparar Ginger Shot", "tipo": "personal"},
    {"horario": "11:45-13:00", "actividad": "Deep Work: Materiales", "tipo": "academico"},
    {"horario": "13:00-13:30", "actividad": "Almuerzo", "tipo": "personal"},
    {"horario": "13:30-14:00", "actividad": "Duolingo", "tipo": "academico"},
    {"horario": "14:00-16:30", "actividad": "Gimnasio + regreso trotando + ducha", "tipo": "ejercicio"},
    {"horario": "16:30-16:45", "actividad": "Batido proteico post-entreno", "tipo": "personal"},
    {"horario": "17:00-18:15", "actividad": "Programación III", "tipo": "academico"},
    {"horario": "18:15-19:00", "actividad": "Procesos de Mecanizado", "tipo": "academico"},
    {"horario": "19:00-19:20", "actividad": "Mimo", "tipo": "academico"},
    {"horario": "19:20-20:00", "actividad": "Física (sin pantalla)", "tipo": "academico"},
    {"horario": "20:00-20:35", "actividad": "Desconexión total + rutina nocturna", "tipo": "personal"}
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDataFromStorage();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Initialize current week from storage
    const savedWeek = localStorage.getItem('currentWeek');
    if (savedWeek) {
        currentWeek = parseInt(savedWeek);
    }
    updateWeekDisplay();
});

function initializeApp() {
    // Initialize all sections
    renderDashboard();
    renderAcademicProgress();
    renderPhysicalProgress();
    renderChecklist();
    renderSchedule();
    renderPomodoro();
    
    // Setup charts after a short delay to ensure DOM is ready
    setTimeout(() => {
        setupCharts();
    }, 100);
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    // Week navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            updateWeekDisplay();
            renderSchedule();
            localStorage.setItem('currentWeek', currentWeek.toString());
        }
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        if (currentWeek < 5) {
            currentWeek++;
            updateWeekDisplay();
            renderSchedule();
            localStorage.setItem('currentWeek', currentWeek.toString());
        }
    });

    // Pomodoro controls
    document.getElementById('startPauseBtn').addEventListener('click', togglePomodoro);
    document.getElementById('resetBtn').addEventListener('click', resetPomodoro);

    // Reset functionality
    document.getElementById('resetProgressBtn').addEventListener('click', showResetModal);
    document.getElementById('cancelReset').addEventListener('click', hideResetModal);
    document.getElementById('confirmReset').addEventListener('click', resetAllProgress);

    // Mobile menu toggle
    const mobileToggle = document.createElement('button');
    mobileToggle.classList.add('mobile-menu-toggle');
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    mobileToggle.addEventListener('click', toggleMobileMenu);
    document.body.appendChild(mobileToggle);

    // Add Enter key support for topic inputs
    document.addEventListener('keypress', function(e) {
        if (e.target.classList.contains('topic-input') && e.key === 'Enter') {
            e.preventDefault();
            const index = e.target.id.replace('topicInput', '');
            const subjectName = materias[parseInt(index)].nombre;
            addTopic(subjectName, parseInt(index));
        }
    });
}

function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Show selected section
    document.getElementById(section).classList.add('active');
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    currentSection = section;

    // Update specific sections when shown
    if (section === 'dashboard') {
        updateDashboard();
    } else if (section === 'checklist') {
        updateChecklistStates();
    } else if (section === 'cronograma') {
        updateWeekNavigationButtons();
    }
}

function toggleMobileMenu() {
    document.querySelector('.sidebar').classList.toggle('open');
}

function updateWeekNavigationButtons() {
    const prevBtn = document.getElementById('prevWeek');
    const nextBtn = document.getElementById('nextWeek');
    
    prevBtn.disabled = currentWeek <= 1;
    nextBtn.disabled = currentWeek >= 5;
}

// Dashboard Functions
function renderDashboard() {
    updateWeekDisplay();
    updateDashboard();
}

function updateDashboard() {
    // Progreso diario
    const progress = calculateDailyProgress();
    updateProgressCircle('dailyProgress', progress);

    // Datos físicos
    const physicalData = getPhysicalData();
    if (document.getElementById('dominadasCount'))
        document.getElementById('dominadasCount').textContent = physicalData.dominadas || 0;
    if (document.getElementById('fondosCount'))
        document.getElementById('fondosCount').textContent = physicalData.fondos || 0;
    if (document.getElementById('gymDaysCount'))
        document.getElementById('gymDaysCount').textContent = physicalData.gymDays || 0;

    // Semana actual
    if (document.getElementById('currentWeek'))
        document.getElementById('currentWeek').textContent = currentWeek;

    // Promedio académico
    const academicData = getAcademicData();
    const progressData = materias.map(materia => {
        const subjectData = academicData[materia.nombre];
        if (!subjectData || !subjectData.topics || subjectData.topics.length === 0) {
            return 0;
        }
        return Math.round((subjectData.completed.length / subjectData.topics.length) * 100);
    });
    const avgAcademic = progressData.length ? Math.round(progressData.reduce((a, b) => a + b, 0) / progressData.length) : 0;
    if (document.getElementById('academicAvg')) {
        document.getElementById('academicAvg').textContent = avgAcademic + '%';
        updateProgressCircle('dailyAcademicProgress', avgAcademic);
    }

    // Promedio físico
    const avgPhysical = Math.round((
        (Math.min((physicalData.dominadas / 25) * 100, 100) +
        Math.min((physicalData.fondos / 25) * 100, 100) +
        Math.min((physicalData.gymDays / 35) * 100, 100)) / 3
    ));
    if (document.getElementById('physicalAvg')) {
        document.getElementById('physicalAvg').textContent = avgPhysical + '%';
        updateProgressCircle('dailyPhysicalProgress', avgPhysical);
    }
}

function calculateDailyProgress() {
    const checklistData = getChecklistData();
    const today = new Date().toDateString();
    const todayData = checklistData[today] || {};
    
    const completedTasks = Object.values(todayData).filter(Boolean).length;
    const totalTasks = rutinaDiaria.length;
    
    return Math.round((completedTasks / totalTasks) * 100);
}

function updateProgressCircle(elementId, percentage) {
    const circle = document.getElementById(elementId);
    if (circle) {
        const degrees = (percentage / 100) * 360;
        circle.style.background = `conic-gradient(var(--color-primary) ${degrees}deg, var(--color-border) ${degrees}deg)`;
        const progressText = circle.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${percentage}%`;
        }
    }
}

// Academic Progress Functions
function renderAcademicProgress() {
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';

    materias.forEach((materia, index) => {
        const subjectCard = createSubjectCard(materia, index);
        container.appendChild(subjectCard);
    });

    // Actualiza el gráfico al renderizar la sección
    if (academicChart) updateAcademicChart(academicChart);
}

function createSubjectCard(materia, index) {
    const card = document.createElement('div');
    card.className = 'card subject-card';

    const academicData = getAcademicData();
    const subjectData = academicData[materia.nombre] || { topics: [...materia.temas], completed: [] };

    card.innerHTML = `
        <div class="subject-header">
            <h3>${materia.nombre}</h3>
            <small>${materia.creditos} créditos • ${materia.horasSemanales}h/semana</small>
        </div>
        <div class="subject-body">
            <div class="topic-input-group">
                <input type="text" class="topic-input" placeholder="Nuevo tema..." id="topicInput${index}">
                <button class="btn btn--primary" onclick="addTopic('${materia.nombre.replace(/'/g, "\\'")}', ${index})">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>
            <ul class="topic-list" id="topicList${index}">
                ${renderTopicList(subjectData.topics, subjectData.completed, materia.nombre)}
            </ul>
        </div>
    `;

    return card;
}

function renderTopicList(topics, completed, subjectName) {
    return topics.map((topic, index) => {
        const isCompleted = completed.includes(topic);
        const escapedTopic = topic.replace(/'/g, "\\'");
        const escapedSubject = subjectName.replace(/'/g, "\\'");
        return `
            <li class="topic-item ${isCompleted ? 'completed' : ''}" data-topic="${escapedTopic}">
                <input type="checkbox" class="topic-checkbox" ${isCompleted ? 'checked' : ''} 
                       onchange="toggleTopic('${escapedSubject}', '${escapedTopic}', this)">
                <span class="topic-text">${topic}</span>
                <button class="topic-delete" onclick="deleteTopic('${escapedSubject}', '${escapedTopic}')">
                    <i class="fas fa-times"></i>
                </button>
            </li>
        `;
    }).join('');
}

window.addTopic = function(subjectName, index) {
    const input = document.getElementById(`topicInput${index}`);
    const topicText = input.value.trim();
    if (!topicText) return;

    const academicData = getAcademicData();
    if (!academicData[subjectName]) {
        academicData[subjectName] = { topics: [], completed: [] };
    }

    if (!academicData[subjectName].topics.includes(topicText)) {
        academicData[subjectName].topics.push(topicText);
        saveAcademicData(academicData);

        // Update UI
        const topicList = document.getElementById(`topicList${index}`);
        const newTopicItem = document.createElement('li');
        newTopicItem.className = 'topic-item';
        newTopicItem.dataset.topic = topicText;
        const escapedTopic = topicText.replace(/'/g, "\\'");
        const escapedSubject = subjectName.replace(/'/g, "\\'");
        newTopicItem.innerHTML = `
            <input type="checkbox" class="topic-checkbox" onchange="toggleTopic('${escapedSubject}', '${escapedTopic}', this)">
            <span class="topic-text">${topicText}</span>
            <button class="topic-delete" onclick="deleteTopic('${escapedSubject}', '${escapedTopic}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        topicList.appendChild(newTopicItem);

        input.value = '';
        if (academicChart) updateAcademicChart(academicChart);
    }
};

window.toggleTopic = function(subjectName, topic, checkbox) {
    const academicData = getAcademicData();
    if (!academicData[subjectName]) {
        academicData[subjectName] = { topics: [], completed: [] };
    }

    if (checkbox.checked) {
        if (!academicData[subjectName].completed.includes(topic)) {
            academicData[subjectName].completed.push(topic);
        }
        checkbox.closest('.topic-item').classList.add('completing');
        setTimeout(() => {
            checkbox.closest('.topic-item').classList.remove('completing');
            checkbox.closest('.topic-item').classList.add('completed');
        }, 300);
    } else {
        academicData[subjectName].completed = academicData[subjectName].completed.filter(t => t !== topic);
        checkbox.closest('.topic-item').classList.remove('completed');
    }

    saveAcademicData(academicData);
    if (academicChart) updateAcademicChart(academicChart);
    updateDashboard();
};

window.deleteTopic = function(subjectName, topic) {
    if (!confirm('¿Estás seguro de que quieres eliminar este tema?')) {
        return;
    }

    const academicData = getAcademicData();
    if (!academicData[subjectName]) return;

    academicData[subjectName].topics = academicData[subjectName].topics.filter(t => t !== topic);
    academicData[subjectName].completed = academicData[subjectName].completed.filter(t => t !== topic);

    saveAcademicData(academicData);

    // Remove from UI
    const topicItem = document.querySelector(`[data-topic="${topic}"]`);
    if (topicItem) {
        topicItem.remove();
    }

    if (academicChart) updateAcademicChart(academicChart);
}

// Physical Progress Functions
function renderPhysicalProgress() {
    const physicalData = getPhysicalData();
    document.getElementById('dominadasDisplay').textContent = physicalData.dominadas || 0;
    document.getElementById('fondosDisplay').textContent = physicalData.fondos || 0;
    document.getElementById('gymDaysDisplay').textContent = physicalData.gymDays || 0;
    document.getElementById('dominadasWeight').value = physicalData.dominadasWeight || 0;
    document.getElementById('fondosWeight').value = physicalData.fondosWeight || 0;
}

function updateExercise(exercise, increment) {
    const physicalData = getPhysicalData();
    physicalData[exercise] = Math.max(0, (physicalData[exercise] || 0) + increment);
    savePhysicalData(physicalData);
    
    document.getElementById(`${exercise}Display`).textContent = physicalData[exercise];
    updatePhysicalChart();
    updateDashboard();
}

function updateExerciseWeight(exercise, weight) {
    const physicalData = getPhysicalData();
    physicalData[`${exercise}Weight`] = parseFloat(weight) || 0;
    savePhysicalData(physicalData);
    updatePhysicalChart();
}

// Checklist Functions
function renderChecklist() {
    const container = document.getElementById('checklistContainer');
    const today = new Date();
    document.getElementById('checklistDate').textContent = 
        `${today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    container.innerHTML = '';
    
    rutinaDiaria.forEach((item, index) => {
        const checklistItem = createChecklistItem(item, index);
        container.appendChild(checklistItem);
    });
    
    updateChecklistStates();
}

function createChecklistItem(item, index) {
    const div = document.createElement('div');
    div.className = `checklist-item ${item.tipo}`;
    div.dataset.index = index;
    
    const checklistData = getChecklistData();
    const today = new Date().toDateString();
    const isCompleted = checklistData[today] && checklistData[today][index];
    
    div.innerHTML = `
        <input type="checkbox" class="checklist-checkbox" ${isCompleted ? 'checked' : ''} 
               onchange="toggleChecklistItem(${index}, this)">
        <span class="checklist-time">${item.horario}</span>
        <span class="checklist-activity">${item.actividad}</span>
    `;
    
    return div;
}

function toggleChecklistItem(index, checkbox) {
    const checklistData = getChecklistData();
    const today = new Date().toDateString();
    
    if (!checklistData[today]) {
        checklistData[today] = {};
    }
    
    checklistData[today][index] = checkbox.checked;
    saveChecklistData(checklistData);
    
    updateChecklistStates();
    updateDashboard();
}

function updateChecklistStates() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    document.querySelectorAll('.checklist-item').forEach((item, index) => {
        const timeRange = rutinaDiaria[index].horario;
        const [startTime, endTime] = timeRange.split('-');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        
        const isCompleted = item.querySelector('.checklist-checkbox').checked;
        
        // Remove all state classes
        item.classList.remove('current', 'overdue', 'completed');
        
        if (isCompleted) {
            item.classList.add('completed');
        } else if (currentTime >= startTimeMinutes && currentTime <= endTimeMinutes) {
            item.classList.add('current');
        } else if (currentTime > endTimeMinutes) {
            item.classList.add('overdue');
        }
    });
}

// Schedule Functions
function renderSchedule() {
    const container = document.getElementById('scheduleGrid');
    container.innerHTML = '';
    
    // Elimina el día Domingo
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    days.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'schedule-day';
        dayDiv.innerHTML = `
            <h3>${day}</h3>
            ${rutinaDiaria.map(item => `
                <div class="time-block ${item.tipo}">
                    <strong>${item.horario}</strong><br>
                    ${item.actividad}
                </div>
            `).join('')}
        `;
        container.appendChild(dayDiv);
    });
    
    updateWeekNavigationButtons();
}

function updateWeekDisplay() {
    const weekDisplayElement = document.getElementById('weekDisplay');
    const currentWeekElement = document.getElementById('currentWeek');
    
    if (weekDisplayElement) {
        weekDisplayElement.textContent = `Semana ${currentWeek}`;
    }
    if (currentWeekElement) {
        currentWeekElement.textContent = currentWeek;
    }
}

// Pomodoro Functions
function renderPomodoro() {
    const pomodoroData = getPomodoroData();
    pomodoroState.completedPomodoros = pomodoroData.completedPomodoros || 0;
    document.getElementById('pomodoroCount').textContent = pomodoroState.completedPomodoros;
    updatePomodoroDisplay();
}

function togglePomodoro() {
    if (pomodoroState.isRunning) {
        pausePomodoro();
    } else {
        startPomodoro();
    }
}

function startPomodoro() {
    pomodoroState.isRunning = true;
    document.getElementById('startPauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pausar';
    
    pomodoroTimer = setInterval(() => {
        pomodoroState.timeLeft--;
        updatePomodoroDisplay();
        
        if (pomodoroState.timeLeft <= 0) {
            completePomodoro();
        }
    }, 1000);
}

function pausePomodoro() {
    pomodoroState.isRunning = false;
    document.getElementById('startPauseBtn').innerHTML = '<i class="fas fa-play"></i> Continuar';
    clearInterval(pomodoroTimer);
}

function resetPomodoro() {
    pomodoroState.isRunning = false;
    pomodoroState.timeLeft = pomodoroState.isWorkTime ? 25 * 60 : 5 * 60;
    document.getElementById('startPauseBtn').innerHTML = '<i class="fas fa-play"></i> Iniciar';
    clearInterval(pomodoroTimer);
    updatePomodoroDisplay();
}

function completePomodoro() {
    clearInterval(pomodoroTimer);
    pomodoroState.isRunning = false;
    
    if (pomodoroState.isWorkTime) {
        pomodoroState.completedPomodoros++;
        document.getElementById('pomodoroCount').textContent = pomodoroState.completedPomodoros;
        
        const pomodoroData = getPomodoroData();
        pomodoroData.completedPomodoros = pomodoroState.completedPomodoros;
        savePomodoroData(pomodoroData);
    }
    
    // Switch between work and break
    pomodoroState.isWorkTime = !pomodoroState.isWorkTime;
    pomodoroState.timeLeft = pomodoroState.isWorkTime ? 25 * 60 : 5 * 60;
    
    document.getElementById('startPauseBtn').innerHTML = '<i class="fas fa-play"></i> Iniciar';
    updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroState.timeLeft / 60);
    const seconds = pomodoroState.timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timerTime').textContent = timeString;
    document.getElementById('timerLabel').textContent = pomodoroState.isWorkTime ? 'Trabajo' : 'Descanso';
    
    // Update progress circle
    const totalTime = pomodoroState.isWorkTime ? 25 * 60 : 5 * 60;
    const progress = ((totalTime - pomodoroState.timeLeft) / totalTime) * 360;
    const progressElement = document.getElementById('timerProgress');
    if (progressElement) {
        progressElement.style.background = `conic-gradient(var(--color-primary) ${progress}deg, transparent ${progress}deg)`;
    }
}

// Chart Functions
function setupCharts() {
    setupAcademicChart();
    setupPhysicalChart();
}

function setupAcademicChart() {
    const ctx = document.getElementById('academicChart');
    if (!ctx) return;

    academicChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: materias.map(m => m.nombre),
            datasets: [{
                label: 'Progreso (%)',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'
                ],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20 }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            }
        }
    });

    updateAcademicChart(academicChart);
}

function setupPhysicalChart() {
    const ctx = document.getElementById('physicalChart');
    if (!ctx) return;
    
    physicalChart = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Dominadas', 'Fondos', 'Días Gym', 'Peso Dom.', 'Peso Fond.'],
            datasets: [{
                label: 'Progreso Físico',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: '#ef4444',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    updatePhysicalChart();
}

// Reutiliza tu función de crear gráfica física, pero acepta un contexto
function createPhysicalChart(ctx) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Dominadas', 'Fondos', 'Días Gimnasio'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(33,128,141,0.7)',
                    'rgba(94,82,64,0.7)',
                    'rgba(168,75,47,0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function updatePhysicalChart(chartInstance = physicalChart) {
    const data = getPhysicalData();
    if (!chartInstance) return;
    // Define metas para los pesos (puedes ajustar estos valores)
    const metaPesoDominadas = 20; // kg
    const metaPesoFondos = 40;    // kg

    chartInstance.data.datasets[0].data = [
        data.dominadas || 0,
        data.fondos || 0,
        data.gymDays || 0,
        Math.min(((data.dominadasWeight || 0) / metaPesoDominadas) * 100, 100),
        Math.min(((data.fondosWeight || 0) / metaPesoFondos) * 100, 100)
    ];
    chartInstance.update();
}

function updateAcademicChart(chart) {
    if (!chart) return;

    const academicData = getAcademicData();
    const progressData = materias.map(materia => {
        const subjectData = academicData[materia.nombre];
        if (!subjectData || !subjectData.topics || subjectData.topics.length === 0) {
            return 0;
        }
        return Math.round((subjectData.completed.length / subjectData.topics.length) * 100);
    });

    chart.data.datasets[0].data = progressData;
    chart.update();
}

// Recipe Functions
function markRecipePrepared(recipeName) {
    const recipeData = getRecipeData();
    const today = new Date().toDateString();
    
    if (!recipeData[today]) {
        recipeData[today] = {};
    }
    
    recipeData[today][recipeName] = true;
    saveRecipeData(recipeData);
    
    // Visual feedback
    const button = event.target;
    button.textContent = '✓ Preparado';
    button.classList.add('btn--success');
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = 'Marcar como Preparado';
        button.classList.remove('btn--success');
        button.disabled = false;
    }, 2000);
}

// Time Functions
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
    
    // Update checklist states every minute
    if (now.getSeconds() === 0) {
        updateChecklistStates();
    }
}

// Reset Functions
function showResetModal() {
    document.getElementById('resetModal').classList.add('active');
}

function hideResetModal() {
    document.getElementById('resetModal').classList.remove('active');
}

function resetAllProgress() {
    localStorage.clear();
    
    // Reset all data
    pomodoroState = {
        isRunning: false,
        timeLeft: 25 * 60,
        isWorkTime: true,
        completedPomodoros: 0
    };
    
    currentWeek = 1;
    
    // Destroy existing charts
    if (academicChart) {
        academicChart.destroy();
        academicChart = null;
    }
    if (physicalChart) {
        physicalChart.destroy();
        physicalChart = null;
    }
    
    // Reinitialize app
    setTimeout(() => {
        initializeApp();
    }, 100);
    
    hideResetModal();
    
    // Show confirmation
    alert('Todo el progreso ha sido eliminado.');
}

// Local Storage Functions
function getAcademicData() {
    const data = localStorage.getItem('academicData');
    if (!data) {
        // Initialize with default topics
        const defaultData = {};
        materias.forEach(materia => {
            defaultData[materia.nombre] = {
                topics: [...materia.temas],
                completed: []
            };
        });
        saveAcademicData(defaultData);
        return defaultData;
    }
    return JSON.parse(data);
}

function saveAcademicData(data) {
    localStorage.setItem('academicData', JSON.stringify(data));
}

function getPhysicalData() {
    const data = localStorage.getItem('physicalData');
    return data ? JSON.parse(data) : {
        dominadas: 0,
        fondos: 0,
        gymDays: 0,
        dominadasWeight: 0,
        fondosWeight: 0
    };
}

function savePhysicalData(data) {
    localStorage.setItem('physicalData', JSON.stringify(data));
}

function getChecklistData() {
    const data = localStorage.getItem('checklistData');
    return data ? JSON.parse(data) : {};
}

function saveChecklistData(data) {
    localStorage.setItem('checklistData', JSON.stringify(data));
}

function getPomodoroData() {
    const data = localStorage.getItem('pomodoroData');
    return data ? JSON.parse(data) : { completedPomodoros: 0 };
}

function savePomodoroData(data) {
    localStorage.setItem('pomodoroData', JSON.stringify(data));
}

function getRecipeData() {
    const data = localStorage.getItem('recipeData');
    return data ? JSON.parse(data) : {};
}

function saveRecipeData(data) {
    localStorage.setItem('recipeData', JSON.stringify(data));
}

function loadDataFromStorage() {
    // Load and apply all data
    renderPhysicalProgress();
    renderPomodoro();
    setTimeout(() => {
        updateAcademicCharts();
        updateDashboard();
    }, 200);
}