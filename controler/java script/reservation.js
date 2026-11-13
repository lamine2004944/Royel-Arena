// ----- État de la réservation -----
const state = {
  sport: 'football',
  date: null,
  slot: null,
  players: 10
};

// Effectifs proposés pour chaque sport
const PLAYER_OPTIONS = {
  football: [10, 14, 22],
  padel: [4, 8]
};

// Format de jeu associé à chaque effectif
const FORMATS = {
  football: { 10: '5v5', 14: '7v7', 22: '11v11' },
  padel: { 4: '2v2', 8: '4v4' }
};

// Effectifs jouables selon l'état du/des terrain(s) sur le créneau
//  - libre : terrain entier disponible
//  - demi  : une moitié occupée (le 11v11 n'est plus possible)
//  - complet : terrain occupé
const AVAILABILITY_RULES = {
  football: { libre: [10, 14, 22], demi: [10, 14], complet: [] },
  padel:    { libre: [4, 8],       demi: [4],       complet: [] }
};
const STATES = ['libre', 'demi', 'complet'];

const SLOTS = {
  'MATIN': ['08:00', '09:00', '10:00', '11:00'],
  'APRÈS-MIDI': ['12:00', '13:00', '14:00', '15:00'],
  'SOIR': ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
};

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const today = new Date();
today.setHours(0, 0, 0, 0);
let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);

// ----- Sélection du sport -----
document.querySelectorAll('.sport-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.sport-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.sport = card.dataset.sport;
    renderAll();
  });
});

// ----- Calendrier -----
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function renderCalendar() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  document.getElementById('monthLabel').textContent = `${MONTHS[month]} ${year}`;

  const grid = document.getElementById('calGrid');
  grid.innerHTML = DAYS.map(d => `<div class="dow">${d}</div>`).join('');

  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) {
    grid.insertAdjacentHTML('beforeend', '<div></div>');
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const btn = document.createElement('button');
    btn.className = 'day';
    btn.textContent = d;
    btn.disabled = date < today;

    if (state.date && sameDay(date, state.date)) btn.classList.add('selected');

    btn.addEventListener('click', () => {
      state.date = date;
      state.slot = null;
      renderAll();
    });
    grid.appendChild(btn);
  }
}

document.getElementById('prevMonth').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  renderCalendar();
});

// ----- Disponibilités (simulation) -----
// À remplacer par un appel à ton back-end : quels effectifs sont libres
// pour un sport, une date et un créneau donnés.
function getSlotState(date, time, sport) {
  const offset = sport === 'padel' ? 7 : 0;
  return STATES[(date.getDate() + parseInt(time, 10) + offset) % 3];
}

function getAvailablePlayers(date, time, sport) {
  return AVAILABILITY_RULES[sport][getSlotState(date, time, sport)];
}

// ----- Créneaux -----
function renderSlots() {
  const container = document.getElementById('slots');

  if (!state.date) {
    container.innerHTML = `<p class="slots-empty">Choisis d'abord une date pour voir les créneaux.</p>`;
    return;
  }

  container.innerHTML = Object.entries(SLOTS).map(([label, times]) => `
    <div class="slot-group">
      <h4>${label}</h4>
      <div class="slot-list">
        ${times.map(t => {
          const available = getAvailablePlayers(state.date, t, state.sport);
          const full = available.length === 0;
          const selected = state.slot === t ? 'selected' : '';
          return `<button class="slot ${selected}" data-time="${t}" ${full ? 'disabled' : ''}>${t}</button>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  // Si le créneau sélectionné n'est plus disponible (ex. changement de sport), on le retire
  if (state.slot && getAvailablePlayers(state.date, state.slot, state.sport).length === 0) {
    state.slot = null;
  }

  container.querySelectorAll('.slot').forEach(btn => {
    btn.addEventListener('click', () => {
      state.slot = btn.dataset.time;
      renderAll();
    });
  });
}

// ----- Effectifs (disponibilité selon le créneau) -----
function currentAvailable() {
  if (state.date && state.slot) {
    return getAvailablePlayers(state.date, state.slot, state.sport);
  }
  return PLAYER_OPTIONS[state.sport];
}

function renderPlayers() {
  const all = PLAYER_OPTIONS[state.sport];
  const available = currentAvailable();

  // Si l'effectif choisi n'est plus disponible, on prend la première option libre
  if (!available.includes(state.players)) {
    state.players = available.length ? available[0] : all[0];
  }

  const container = document.getElementById('playerOptions');
  container.innerHTML = all.map(n => {
    const ok = available.includes(n);
    const selected = n === state.players ? 'selected' : '';
    return `
      <button class="player-option ${selected}" data-players="${n}" ${ok ? '' : 'disabled'}>
        <strong>${n}</strong>
        <small>${FORMATS[state.sport][n]}${ok ? '' : ' • indispo'}</small>
      </button>`;
  }).join('');

  container.querySelectorAll('.player-option').forEach(btn => {
    btn.addEventListener('click', () => {
      state.players = Number(btn.dataset.players);
      renderAll();
    });
  });

  const hint = state.slot
    ? `👥 Effectifs disponibles à ${state.slot} : ${available.join(', ')} joueurs`
    : `👥 Choisis un créneau pour voir les effectifs disponibles.`;
  document.getElementById('playersHint').textContent = hint;
}

// ----- Bouton "Voir les disponibilités" -----
document.getElementById('btnCheck').addEventListener('click', () => {
  const feedback = document.getElementById('feedback');

  if (!state.date) {
    feedback.textContent = 'Merci de choisir une date.';
    return;
  }
  if (!state.slot) {
    feedback.textContent = 'Merci de choisir un créneau.';
    return;
  }

  const available = getAvailablePlayers(state.date, state.slot, state.sport);
  if (!available.includes(state.players)) {
    feedback.textContent = `Ce créneau n'est pas disponible pour ${state.players} joueurs.`;
    return;
  }

  const dateStr = state.date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const sportName = state.sport === 'football' ? 'Football' : 'Padel';

  feedback.textContent =
    `✅ ${sportName} • ${dateStr} à ${state.slot} • ${state.players} joueurs (${FORMATS[state.sport][state.players]}) — Terrain disponible !`;
});

// ----- Rendu global -----
function renderAll() {
  renderCalendar();
  renderSlots();
  renderPlayers();
}

renderAll();