<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userName = ref('Alice');
const userEmail = ref('alice@example.com');
const gameStats = ref({
  totalGames: 0,
  wins: 0,
  losses: 0,
  winRate: '0%'
});

onMounted(() => {
  // Vérifier si l'utilisateur est connecté
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }
  
  // Charger les stats (simulées pour l'instant)
  loadGameStats();
});

function loadGameStats() {
  // Simulation de stats - plus tard viendra de l'API
  gameStats.value = {
    totalGames: 12,
    wins: 8,
    losses: 4,
    winRate: '66.7%'
  };
}

function logout() {
  localStorage.removeItem('token');
  router.push('/login');
}

function startNewGame() {
  // Plus tard : rediriger vers la page de jeu
  alert('Nouvelle partie - Interface de jeu à venir !');
}
</script>

<template>
  <div class="dashboard-container">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>🎮 Backgammon Pro</h1>
        <div class="user-info">
          <span>{{ userName }}</span>
          <button @click="logout" class="btn-logout">Déconnexion</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="dashboard-main">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <h2>Bienvenue, {{ userName }} !</h2>
        <p>Prêt à affronter GNUBG ?</p>
        <button @click="startNewGame" class="btn-primary">
          🎲 Nouvelle Partie
        </button>
      </section>

      <!-- Stats Section -->
      <section class="stats-section">
        <h3>📊 Vos Statistiques</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ gameStats.totalGames }}</div>
            <div class="stat-label">Parties jouées</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ gameStats.wins }}</div>
            <div class="stat-label">Victoires</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ gameStats.losses }}</div>
            <div class="stat-label">Défaites</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ gameStats.winRate }}</div>
            <div class="stat-label">Taux de victoire</div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="actions-section">
        <h3>⚡ Actions Rapides</h3>
        <div class="actions-grid">
          <button class="action-btn">
            🎯 Voir les parties en cours
          </button>
          <button class="action-btn">
            📈 Historique des parties
          </button>
          <button class="action-btn">
            🏆 Classement
          </button>
          <button class="action-btn">
            ⚙️ Paramètres
          </button>
        </div>
      </section>

      <!-- GNUBG Status -->
      <section class="gnubg-section">
        <h3>🤖 Status GNUBG</h3>
        <div class="status-card">
          <div class="status-indicator online"></div>
          <div>
            <strong>GNUBG CLI</strong>
            <p>Opérationnel et prêt à jouer</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dashboard-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  color: white;
  margin: 0;
  font-size: 1.8rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.btn-logout {
  background: rgba(231, 76, 60, 0.8);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: rgba(231, 76, 60, 1);
}

.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-section {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}

.welcome-section h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.welcome-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.btn-primary {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #27ae60;
  transform: translateY(-2px);
}

.stats-section, .actions-section, .gnubg-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stats-section h3, .actions-section h3, .gnubg-section h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 8px;
  color: white;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-btn {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.action-btn:hover {
  background: #e9ecef;
  border-color: #3498db;
  transform: translateY(-1px);
}

.status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #d4edda;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #28a745;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
