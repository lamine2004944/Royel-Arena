(function () {
  const list = document.getElementById('reservation-list');
  const tabs = document.querySelectorAll('.tab');
  const emptyMessage = document.getElementById('empty-message');
  const countUpcoming = document.getElementById('count-upcoming');

  // Filtre des réservations par onglet
  function setFilter(filter) {
    let visible = 0;

    list.querySelectorAll('.booking').forEach((card) => {
      const match = card.dataset.status === filter;
      card.hidden = !match;
      if (match) visible++;
    });

    emptyMessage.hidden = visible > 0;

    tabs.forEach((tab) => {
      const active = tab.dataset.filter === filter;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setFilter(tab.dataset.filter));
  });

  // Actions sur les cartes (délégation d'événements)
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const card = button.closest('.booking');
    const action = button.dataset.action;

    if (action === 'cancel') {
      const ok = window.confirm('Annuler cette réservation ? L\'annulation est gratuite jusqu\'à 24h avant.');
      if (!ok) return;

      card.dataset.status = 'cancelled';
      card.hidden = true;
      updateUpcomingCount();
      emptyMessage.hidden = true;
    }

    if (action === 'edit') {
      // À connecter à votre page de modification de réservation
      console.log('Modifier la réservation', card.dataset.id);
    }

    if (action === 'rebook') {
      // À connecter à votre page de réservation
      window.location.href = '#reservation';
    }
  });

  function updateUpcomingCount() {
    const upcoming = list.querySelectorAll('.booking[data-status="upcoming"]').length;
    countUpcoming.textContent = upcoming;
  }

  // Initialisation
  setFilter('upcoming');
})();