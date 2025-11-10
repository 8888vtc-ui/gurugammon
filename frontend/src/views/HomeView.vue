<script setup lang="ts">
import { ref, onMounted } from 'vue';

const message = ref('🎯 GammonGuru - Jeu de Backgammon en Ligne');
const email = ref('');
const password = ref('');
const loginStatus = ref('');
const isLoading = ref(false);

// Debug : Vérifier que le composant est monté
onMounted(() => {
  console.log('GammonGuru HomeView monté - Prêt pour connexion!');
});

// Fonction de connexion
async function login() {
  if (!email.value || !password.value) {
    loginStatus.value = '❌ Veuillez saisir email et mot de passe';
    return;
  }

  isLoading.value = true;
  loginStatus.value = '🔄 Connexion en cours...';

  // Utiliser les fonctions Netlify (même domaine) au lieu de Railway
  const loginUrl = `/.netlify/functions/login-debug`;

  console.log('Tentative de connexion vers:', loginUrl);

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    console.log('Status de la réponse:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Réponse login:', data);

    if (data.success) {
      loginStatus.value = `✅ Connexion réussie! Bienvenue ${data.user.username}`;
      // Ici on pourrait rediriger vers le jeu
      console.log('Token JWT:', data.token);
      localStorage.setItem('gammon_token', data.token);
    } else {
      loginStatus.value = `❌ Erreur: ${data.error || 'Identifiants incorrects'}`;
    }
  } catch (error: any) {
    console.error('Erreur de connexion:', error);
    loginStatus.value = `❌ Erreur de connexion: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    isLoading.value = false;
  }
}

// Test de diagnostic avancé
async function runDiagnostics() {
  console.log('🔍 === DIAGNOSTIC AVANCÉ ===');

  // Utiliser URLs relatives (même domaine Netlify)
  const testUrl = `/.netlify/functions/login-debug`;

  console.log('📡 URL cible:', testUrl);
  console.log('🌐 User Agent:', navigator.userAgent);
  console.log('🔒 Protocol:', window.location.protocol);
  console.log('🏠 Host:', window.location.host);

  // Test 1: OPTIONS preflight
  try {
    console.log('🔄 Test OPTIONS...');
    const optionsResponse = await fetch(testUrl, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('✅ OPTIONS status:', optionsResponse.status);
    console.log('✅ OPTIONS headers:', Object.fromEntries(optionsResponse.headers.entries()));
  } catch (error) {
    console.error('❌ OPTIONS failed:', error);
  }

  // Test 2: POST réel
  try {
    console.log('🔄 Test POST...');
    const postResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'david@gammonguru.com',
        password: 'donna'
      })
    });

    console.log('📊 POST status:', postResponse.status);
    console.log('📊 POST headers:', Object.fromEntries(postResponse.headers.entries()));

    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log('✅ POST success:', data);
      alert('🎉 Test réussi ! La connexion fonctionne.');
    } else {
      const errorText = await postResponse.text();
      console.error('❌ POST error:', errorText);
      alert(`❌ Erreur ${postResponse.status}: ${errorText}`);
    }
  } catch (error: any) {
    console.error('❌ POST fetch failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`❌ Erreur de connexion: ${errorMessage}\n\nVérifiez:\n1. Connexion internet\n2. Bloqueur de pubs\n3. Firewall\n4. Navigateur`);
  }

  console.log('🏁 === FIN DIAGNOSTIC ===');
}
</script>

<template>
  <main class="container">
    <div class="hero-section">
      <h1>{{ message }}</h1>
      <p class="subtitle">Analysez vos parties avec l'IA et affrontez d'autres joueurs en temps réel</p>
    </div>

    <!-- Formulaire de connexion -->
    <div class="login-section">
      <div class="login-card">
        <h2>🔐 Connexion</h2>

        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="votre@email.com"
              required
              class="form-input"
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Votre mot de passe"
              required
              class="form-input"
              :disabled="isLoading"
            />
          </div>

          <button
            type="submit"
            class="btn-login"
            :disabled="isLoading"
          >
            <span v-if="isLoading">🔄 Connexion...</span>
            <span v-else>🚀 Se connecter</span>
          </button>
        </form>

        <div class="login-status" :class="{
          success: loginStatus.includes('✅'),
          error: loginStatus.includes('❌'),
          loading: loginStatus.includes('🔄')
        }">
          {{ loginStatus || 'Prêt pour la connexion' }}
        </div>

        <!-- Compte de test -->
        <div class="test-account">
          <h3>🧪 Compte de test</h3>
          <p><strong>Email:</strong> david@gammonguru.com</p>
          <p><strong>Mot de passe:</strong> donna</p>
          <button @click="email = 'david@gammonguru.com'; password = 'donna'" class="btn-fill">
            Remplir automatiquement
          </button>
        </div>
      </div>
    </div>

    <!-- Boutons de test -->
    <div class="debug-section">
      <h3>🛠️ Outils de développement</h3>
      <div class="debug-buttons">
        <button @click="runDiagnostics" class="btn-debug">
          🔍 Diagnostic complet (console)
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.hero-section h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.login-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.login-card {
  background: white;
  border-radius: 15px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.8rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-login {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-status {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  min-height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-status.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.login-status.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.login-status.loading {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.test-account {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.test-account h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.1rem;
}

.test-account p {
  margin: 0.5rem 0;
  color: #666;
}

.btn-fill {
  background: #6c757d;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-fill:hover {
  background: #5a6268;
}

.debug-section {
  margin-top: 3rem;
  text-align: center;
}

.debug-section h3 {
  color: white;
  margin-bottom: 1rem;
}

.debug-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-debug {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.btn-debug:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2rem;
  }

  .login-card {
    padding: 2rem;
    margin: 0 1rem;
  }

  .debug-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
