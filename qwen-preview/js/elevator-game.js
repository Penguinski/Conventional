// ============ ELEVATOR-GAME.JS - Mini gioco "Ascensore Sociale" ============

const elevatorGameScenes = [
  {
    title: "Piano Terra",
    text: "Entri nell'ascensore. La porta si sta chiudendo quando vedi qualcuno correre verso di te dall'androne.",
    choices: [
      { text: "Tieni premuto 'apri porta' e aspetti", effect: { stress: -10, simpatia: +15, rispetto: +5 } },
      { text: "Fingi di non vedere e lasci chiudere", effect: { stress: +5, simpatia: -10, rispetto: -5 } },
      { text: "Apri la porta ma fai un cenno di scusa", effect: { stress: 0, simpatia: +10, rispetto: +10 } }
    ]
  },
  {
    title: "Piano 1",
    text: "Sei in ascensore con un vicino che hai incontrato una volta sola. Lui attacca bottone sul tempo.",
    choices: [
      { text: "Rispondi educatamente e chiedi qualcosa anche tu", effect: { stress: +5, simpatia: +10, rispetto: +5 } },
      { text: "Sorridi e dici 'buongiorno' guardando il telefono", effect: { stress: -5, simpatia: -5, rispetto: 0 } },
      { text: "Ignori completamente", effect: { stress: -10, simpatia: -15, rispetto: -10 } }
    ]
  },
  {
    title: "Piano 2",
    text: "Un altro vicino entra con un cane di piccola taglia. Il cane ti fissa intensamente.",
    choices: [
      { text: "Chiedi al proprietario se puoi accarezzarlo", effect: { stress: -5, simpatia: +10, rispetto: +5 } },
      { text: "Resti immobile e fissi i numeri dei piani", effect: { stress: 0, simpatia: 0, rispetto: 0 } },
      { text: "Fai un commento sul cane", effect: { stress: +5, simpatia: +5, rispetto: 0 } }
    ]
  },
  {
    title: "Piano 3",
    text: "L'ascensore si ferma tra un piano e l'altro per un secondo. Silenzio imbarazzante.",
    choices: [
      { text: "Fai una battuta per rompere il ghiaccio", effect: { stress: -5, simpatia: +15, rispetto: +5 } },
      { text: "Tossi leggermente", effect: { stress: +5, simpatia: -5, rispetto: 0 } },
      { text: "Nessuno ha parlato. Tutto normale.", effect: { stress: 0, simpatia: 0, rispetto: 0 } }
    ]
  },
  {
    title: "Arrivo",
    text: "La porta si apre sul tuo piano. Gli altri due vicini escono prima di te.",
    choices: [
      { text: "Auguri buona giornata ed esci per ultimo", effect: { stress: -5, simpatia: +10, rispetto: +10 } },
      { text: "Esci immediatamente appena si apre la porta", effect: { stress: -10, simpatia: -5, rispetto: -5 } },
      { text: "Aspetti che si allontanino prima di uscire", effect: { stress: +5, simpatia: 0, rispetto: +5 } }
    ]
  }
];

let currentSceneIndex = 0;
let gameStats = { stress: 50, simpatia: 50, rispetto: 50 };
let gameActive = false;

export function initElevatorGame() {
  // Game is triggered from content or special interaction
}

export function startElevatorGame() {
  currentSceneIndex = 0;
  gameStats = { stress: 50, simpatia: 50, rispetto: 50 };
  gameActive = true;
  
  const overlay = document.getElementById('elevatorGameOverlay');
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  
  renderScene();
}

function renderScene() {
  if (currentSceneIndex >= elevatorGameScenes.length) {
    showGameResult();
    return;
  }
  
  const scene = elevatorGameScenes[currentSceneIndex];
  const container = document.getElementById('elevatorGameContent');
  
  container.innerHTML = `
    <div class="elevator-game-scene">
      <h3>${scene.title}</h3>
      <p>${scene.text}</p>
      <div class="elevator-choices">
        ${scene.choices.map((choice, i) => `
          <button class="elevator-choice-btn" data-choice="${i}">${choice.text}</button>
        `).join('')}
      </div>
      <div class="elevator-stats">
        <div class="elevator-stat"><span>Stress:</span><span id="stat-stress">${gameStats.stress}</span></div>
        <div class="elevator-stat"><span>Simpatia:</span><span id="stat-simpatia">${gameStats.simpatia}</span></div>
        <div class="elevator-stat"><span>Rispetto:</span><span id="stat-rispetto">${gameStats.rispetto}</span></div>
      </div>
    </div>
  `;
  
  // Add click handlers
  container.querySelectorAll('.elevator-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleChoice(parseInt(btn.dataset.choice)));
  });
}

function handleChoice(choiceIndex) {
  const scene = elevatorGameScenes[currentSceneIndex];
  const choice = scene.choices[choiceIndex];
  
  // Apply effects
  Object.keys(choice.effect).forEach(key => {
    gameStats[key] = Math.max(0, Math.min(100, gameStats[key] + choice.effect[key]));
  });
  
  currentSceneIndex++;
  renderScene();
}

function showGameResult() {
  const container = document.getElementById('elevatorGameContent');
  
  let resultText = '';
  let resultTitle = '';
  
  if (gameStats.simpatia >= 70) {
    resultTitle = 'Il Socievole dell\'Ascensore';
    resultText = 'Hai trasformato un viaggio in ascensore in un evento sociale. Probabilmente conosci ora tutti i vicini del palazzo.';
  } else if (gameStats.stress <= 30) {
    resultTitle = 'Il Filosofo Silenzioso';
    resultText = 'Hai attraversato l\'esperienza con la serenità di un monaco zen. L'ascensore è il tuo luogo di meditazione.';
  } else if (gameStats.rispetto >= 70) {
    resultTitle = 'Il Galateo Vivente';
    resultText = 'Ogni tua azione è stata calibrata secondo le regole non scritte della convivenza verticale.';
  } else {
    resultTitle = 'Il Passeggero Medio';
    resultText = 'Né eroico né disastroso. Hai semplicemente preso l'ascensore come farebbe chiunque altro.';
  }
  
  container.innerHTML = `
    <div class="elevator-game-scene">
      <h3>Risultato</h3>
      <h2 style="font-size: clamp(28px, 6vw, 42px); margin: 20px 0;">${resultTitle}</h2>
      <p style="font-size: 18px; line-height: 1.6;">${resultText}</p>
      <div class="elevator-result">
        <h4>Statistiche finali</h4>
        <div class="elevator-stat"><span>Stress:</span><span>${gameStats.stress}</span></div>
        <div class="elevator-stat"><span>Simpatia:</span><span>${gameStats.simpatia}</span></div>
        <div class="elevator-stat"><span>Rispetto:</span><span>${gameStats.rispetto}</span></div>
      </div>
      <button class="quiz-restart-btn" style="margin-top: 24px;" onclick="window.elevatorGameRestart()">Rigioca</button>
    </div>
  `;
  
  gameActive = false;
}

// Expose restart function globally for the button
window.elevatorGameRestart = () => {
  startElevatorGame();
};
