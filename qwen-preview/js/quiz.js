// ============ QUIZ.JS - Quiz "Che inquilino sei?" ============

import { QUIZ_DATA } from './data.js';

let currentQuestionIndex = 0;
let userVector = { social: 0, ordine: 0, regole: 0, rumore: 0, curiosita: 0, possesso: 0 };

export function initQuiz() {
  const startBtn = document.getElementById('quizStartBtn');
  const restartBtn = document.getElementById('quizRestartBtn');
  
  if (startBtn) {
    startBtn.addEventListener('click', startQuiz);
  }
  
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      closeQuiz();
      setTimeout(startQuiz, 300);
    });
  }
}

function startQuiz() {
  currentQuestionIndex = 0;
  userVector = { social: 0, ordine: 0, regole: 0, rumore: 0, curiosita: 0, possesso: 0 };
  
  document.getElementById('quizIntro').hidden = true;
  document.getElementById('quizContainer').hidden = false;
  document.getElementById('totalQuestions').textContent = QUIZ_DATA.questions.length;
  
  renderQuestion(0);
}

function renderQuestion(index) {
  const question = QUIZ_DATA.questions[index];
  const container = document.getElementById('questions');
  
  document.getElementById('currentQuestion').textContent = index + 1;
  document.getElementById('progressBar').style.width = `${((index + 1) / QUIZ_DATA.questions.length) * 100}%`;
  
  container.innerHTML = `
    <div class="question active">
      <div class="question-number">Domanda ${index + 1}</div>
      <h2>${question.question}</h2>
      <div class="answers">
        ${question.answers.map((answer, i) => `
          <button class="answer" data-answer="${i}">${answer.text}</button>
        `).join('')}
      </div>
    </div>
  `;
  
  // Add click handlers
  container.querySelectorAll('.answer').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.answer)));
  });
}

function handleAnswer(answerIndex) {
  const question = QUIZ_DATA.questions[currentQuestionIndex];
  const answer = question.answers[answerIndex];
  
  // Update user vector
  Object.keys(answer.values).forEach(key => {
    userVector[key] = (userVector[key] || 0) + answer.values[key];
  });
  
  // Move to next question or show result
  currentQuestionIndex++;
  
  if (currentQuestionIndex < QUIZ_DATA.questions.length) {
    renderQuestion(currentQuestionIndex);
  } else {
    showResult();
  }
}

function showResult() {
  document.getElementById('quizContainer').hidden = true;
  document.getElementById('quizResult').hidden = false;
  
  const profile = calculateProfile();
  document.getElementById('resultTitle').textContent = profile.title;
  document.getElementById('resultDescription').textContent = profile.description;
}

function calculateProfile() {
  let bestMatch = null;
  let bestScore = -Infinity;
  
  Object.keys(QUIZ_DATA.profiles).forEach(profileKey => {
    const profile = QUIZ_DATA.profiles[profileKey];
    const score = calculateSimilarity(userVector, profile.vector);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = profile;
    }
  });
  
  return bestMatch || QUIZ_DATA.profiles.fantasma;
}

function calculateSimilarity(user, profile) {
  let score = 0;
  Object.keys(profile).forEach(key => {
    const diff = Math.abs((user[key] || 0) - profile[key]);
    score -= diff * diff; // Penalize large differences more
  });
  return score;
}

function closeQuiz() {
  document.getElementById('quizOverlay').hidden = true;
  document.body.style.overflow = '';
}
