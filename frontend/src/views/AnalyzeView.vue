<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const boardState = ref('');
const dice = ref('[1, 1]');
const move = ref('');
const analysis = ref<any>(null);
const loading = ref(false);
const error = ref('');
const analysesRemaining = ref(3); // Mode test

onMounted(() => {
  // Vérifier si l'utilisateur est connecté
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return;
  }
  
  // Charger le quota d'analyses
  loadAnalysisQuota();
});

function loadAnalysisQuota() {
  // Simulation du quota - plus tard viendra de l'API
  const lastAnalysis = localStorage.getItem('lastAnalysisDate');
  const analysesThisMonth = localStorage.getItem('analysesThisMonth') || '0';
  
  analysesRemaining.value = Math.max(0, 5 - parseInt(analysesThisMonth));
}

async function analyzeMove() {
  loading.value = true;
  error.value = '';
  analysis.value = null;
  
  try {
    // Validation basique
    if (!boardState.value || !move.value) {
      error.value = 'Veuillez remplir tous les champs';
      return;
    }
    
    // Vérifier le quota
    if (analysesRemaining.value <= 0) {
      error.value = 'Quota d\'analyses atteint. Passez à Premium pour des analyses illimitées.';
      return;
    }
    
    // MODE TEST : Simulation d'analyse GNUBG
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simuler le temps de traitement
    
    const mockAnalysis = {
      isValid: Math.random() > 0.3,
      equity: (Math.random() * 0.6 - 0.3).toFixed(3),
      pr: (Math.random() * 10).toFixed(1),
      bestMove: move.value || '13/10 6/5',
      alternatives: [
        {
          move: '13/10 6/5',
          equity: (Math.random() * 0.6 - 0.3).toFixed(3),
          equityLoss: (Math.random() * 0.1).toFixed(3)
        }
      ],
      explanation: generateExplanation(),
      difficulty: 'Intermédiaire',
      learningPoints: generateLearningPoints()
    };
    
    analysis.value = mockAnalysis;
    
    // Mettre à jour le quota
    const currentAnalyses = parseInt(localStorage.getItem('analysesThisMonth') || '0');
    localStorage.setItem('analysesThisMonth', (currentAnalyses + 1).toString());
    localStorage.setItem('lastAnalysisDate', new Date().toISOString());
    analysesRemaining.value--;
    
  } catch (err: any) {
    error.value = `Erreur lors de l'analyse: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

function generateExplanation(): string {
  const explanations = [
    "Ce coup est techniquement correct mais il existe une alternative légèrement meilleure. La différence d'équité est minime (0.023), ce qui montre que votre compréhension tactique est bonne.",
    "Excellent coup ! C'est le meilleur mouvement possible selon GNUBG. Votre équité est maximale et vous ne perdez aucun point par rapport à la perfection théorique.",
    "Ce coup présente une erreur significative. Le mouvement alternatif vous aurait donné une meilleure position de 0.089 points d'équité. Essayez de toujours considérer la sécurité de vos arrières.",
    "Bon coup dans l'ensemble, mais attention à ne pas trop exposer vos pions. L'alternative proposée est plus conservatrice et sécurise votre position."
  ];
  
  return explanations[Math.floor(Math.random() * explanations.length)];
}

function generateLearningPoints(): string[] {
  const allPoints = [
    "Considérez toujours la sécurité de vos pions exposés",
    "Pensez à la flexibilité future de votre position",
    "Évaluez l'impact sur les prochains jets de dés",
    "Ne négligez pas l'importance du contrôle du centre",
    "La sécurité des arrières est souvent prioritaire"
  ];
  
  return allPoints.slice(0, Math.floor(Math.random() * 3) + 2);
}

function resetForm() {
  boardState.value = '';
  move.value = '';
  analysis.value = null;
  error.value = '';
}

function goToPremium() {
  alert('Upgrade Premium - Analyses illimitées !');
}
</script>

<template>
  <div class="analyze-container">
    <!-- Header -->
    <header class="analyze-header">
      <div class="header-content">
        <button @click="router.push('/dashboard')" class="btn-back">
          ← Dashboard
        </button>
        <h1>🎯 Analyse de Coup</h1>
        <div class="quota-info">
          <span class="quota-badge">{{ analysesRemaining }}/5 analyses</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="analyze-main">
      <!-- Formulaire -->
      <section class="form-section">
        <h2>📋 Saisissez votre coup</h2>
        
        <div class="form-group">
          <label for="boardState">Position du plateau (Board State)</label>
          <input 
            v-model="boardState" 
            type="text" 
            id="boardState" 
            placeholder="4HPwATDgc/ABMA:cIkKAQAAAAAAA"
            class="form-input"
          />
          <small>Format GNUBG ou notation simplifiée</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="dice">Dés</label>
            <input 
              v-model="dice" 
              type="text" 
              id="dice" 
              placeholder="[1, 1]"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="move">Coup joué</label>
            <input 
              v-model="move" 
              type="text" 
              id="move" 
              placeholder="8/5 6/5"
              class="form-input"
            />
          </div>
        </div>
        
        <div class="form-actions">
          <button 
            @click="analyzeMove" 
            :disabled="loading || analysesRemaining <= 0"
            class="btn-analyze"
          >
            {{ loading ? '🤖 Analyse en cours...' : '🎯 Analyser le coup' }}
          </button>
          
          <button @click="resetForm" class="btn-reset">
            🔄 Réinitialiser
          </button>
        </div>
        
        <!-- Quota Premium -->
        <div v-if="analysesRemaining <= 0" class="quota-warning">
          <h3>🔒 Quota atteint</h3>
          <p>Vous avez utilisé vos 5 analyses gratuites ce mois-ci.</p>
          <button @click="goToPremium" class="btn-premium">
            ⭐ Passer Premium - Analyses illimitées
          </button>
        </div>
      </section>

      <!-- Résultats -->
      <section v-if="analysis" class="results-section">
        <h2>📊 Résultats de l'Analyse</h2>
        
        <!-- Indicateurs principaux -->
        <div class="metrics-grid">
          <div class="metric-card" :class="{ valid: analysis.isValid, invalid: !analysis.isValid }">
            <div class="metric-icon">{{ analysis.isValid ? '✅' : '❌' }}</div>
            <div class="metric-value">{{ analysis.isValid ? 'Valide' : 'Sous-optimal' }}</div>
            <div class="metric-label">Validité du coup</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">{{ analysis.equity }}</div>
            <div class="metric-label">Equity</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">{{ analysis.pr }}</div>
            <div class="metric-label">Performance Rating</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">{{ analysis.difficulty }}</div>
            <div class="metric-label">Difficulté</div>
          </div>
        </div>

        <!-- Explication pédagogique -->
        <div class="explanation-card">
          <h3>🧠 Explication</h3>
          <p>{{ analysis.explanation }}</p>
        </div>

        <!-- Points d'apprentissage -->
        <div class="learning-card">
          <h3>📚 Points d'apprentissage</h3>
          <ul>
            <li v-for="point in analysis.learningPoints" :key="point">
              {{ point }}
            </li>
          </ul>
        </div>

        <!-- Alternatives -->
        <div v-if="analysis.alternatives.length > 0" class="alternatives-card">
          <h3>🔄 Alternatives recommandées</h3>
          <div class="alternatives-list">
            <div v-for="alt in analysis.alternatives" :key="alt.move" class="alternative-item">
              <div class="alternative-move">{{ alt.move }}</div>
              <div class="alternative-equity">
                Equity: {{ alt.equity }} 
                <span v-if="alt.equityLoss" class="equity-loss">
                  (perte: {{ alt.equityLoss }})
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Erreurs -->
      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>
    </main>
  </div>
</template>

<style scoped>
.analyze-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.analyze-header {
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

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.quota-info {
  color: white;
}

.quota-badge {
  background: rgba(46, 204, 113, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.analyze-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.form-section, .results-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.form-section h2, .results-section h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

small {
  color: #6c757d;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-analyze {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-analyze:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-2px);
}

.btn-analyze:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-reset {
  background: #f8f9fa;
  color: #495057;
  border: 2px solid #e9ecef;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reset:hover {
  background: #e9ecef;
}

.quota-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 2rem;
}

.quota-warning h3 {
  color: #856404;
  margin-top: 0;
}

.btn-premium {
  background: #f39c12;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.metric-card.valid {
  border-color: #28a745;
  background: #d4edda;
}

.metric-card.invalid {
  border-color: #dc3545;
  background: #f8d7da;
}

.metric-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.metric-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.explanation-card, .learning-card, .alternatives-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.explanation-card h3, .learning-card h3, .alternatives-card h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 1rem;
}

.learning-card ul {
  margin: 0;
  padding-left: 1.5rem;
}

.learning-card li {
  margin-bottom: 0.5rem;
}

.alternatives-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alternative-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.alternative-move {
  font-weight: 600;
  color: #2c3e50;
}

.alternative-equity {
  color: #6c757d;
}

.equity-loss {
  color: #dc3545;
  font-weight: 600;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #f5c6cb;
  margin-bottom: 2rem;
}
</style>
