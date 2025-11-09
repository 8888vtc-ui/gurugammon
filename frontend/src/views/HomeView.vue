<script setup lang="ts">
import { ref, onMounted } from 'vue';
// import api from '@/services/api'; // DÉSACTIVÉ POUR DEBUG

const message = ref('🎮 Backgammon Pro - Frontend fonctionnel!');
const testResult = ref('');
const clickCount = ref(0);
const apiStatus = ref('API désactivée pour debug');

// Debug : Vérifier que le composant est monté
onMounted(() => {
  console.log('HomeView monté - Vue.js fonctionne!');
  message.value += ' [Composant actif]';
});

function testSimple() {
  console.log('Bouton cliqué!', clickCount.value);
  clickCount.value++;
  testResult.value = `Test simple réussi - Clicks: ${clickCount.value} - Frontend Vue 3 actif!`;
}

// Test au clavier aussi
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    testSimple();
  }
}

// VERSION SIMPLIFIÉE : Test de connexion API backend sans import
async function testBackendConnection() {
  console.log('Test API backend (version simplifiée)...');
  apiStatus.value = 'Test en cours...';
  
  try {
    // Test avec fetch natif au lieu d'axios
    const response = await fetch('http://localhost:3000/api/gnubg/check');
    const data = await response.json();
    
    console.log('Réponse API:', data);
    
    if (data.success) {
      apiStatus.value = `✅ ${data.data.message}`;
      testResult.value = 'Connexion backend réussie! GNUBG est opérationnel.';
    } else {
      apiStatus.value = `❌ Erreur: ${data.error}`;
      testResult.value = 'Backend a répondu mais avec une erreur.';
    }
  } catch (error: any) {
    console.error('Erreur API:', error);
    apiStatus.value = `❌ Erreur: ${error.message}`;
    testResult.value = 'Problème de connexion au backend - Vérifiez que le backend tourne sur localhost:3000';
  }
}
</script>

<template>
  <main class="container">
    <h1>{{ message }}</h1>
    
    <!-- Section test simple -->
    <div class="test-section">
      <button 
        @click="testSimple" 
        @keydown="handleKeydown"
        class="btn-primary"
        tabindex="0"
      >
        Test simple ({{ clickCount }} clicks)
      </button>
      <div class="result" :class="{ active: testResult }">
        {{ testResult || 'Cliquez pour tester (ou appuyez sur Entrée)' }}
      </div>
    </div>
    
    <!-- Section test API (version simplifiée) -->
    <div class="api-section">
      <h2>🔗 Connexion Backend (Fetch)</h2>
      <button 
        @click="testBackendConnection" 
        class="btn-api"
      >
        Tester API Backend
      </button>
      <div class="api-status" :class="{ 
        success: apiStatus.includes('✅'), 
        error: apiStatus.includes('❌'),
        pending: apiStatus.includes('en cours')
      }">
        {{ apiStatus }}
      </div>
    </div>
    
    <!-- Debug info -->
    <div class="debug">
      <p>Debug: Vue.js actif = {{ clickCount >= 0 }}</p>
      <p>Debug: Timestamp = {{ new Date().toLocaleTimeString() }}</p>
      <p>Debug: API Status = {{ apiStatus }}</p>
    </div>
  </main>
</template>

<style scoped>
.container {
  text-align: center;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.test-section, .api-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #f8f9fa;
}

.btn-primary {
  background: #3498db;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-primary:focus {
  outline: 3px solid #2ecc71;
  outline-offset: 2px;
}

.btn-api {
  background: #2ecc71;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.btn-api:hover {
  background: #27ae60;
  transform: translateY(-2px);
}

.result {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.result.active {
  background: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.api-status {
  padding: 1rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s ease;
}

.api-status.success {
  background: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.api-status.error {
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

.api-status.pending {
  background: #fff3cd;
  color: #856404;
  border: 2px solid #ffeaa7;
}

.debug {
  margin-top: 2rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #856404;
}
</style>
