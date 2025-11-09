<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const successMessage = ref('');

async function login() {
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  
  try {
    console.log('Tentative de connexion avec:', { email: email.value, password: password.value });
    
    // MODE TEST TEMPORAIRE : Simulation de connexion réussie
    if (email.value === 'alice@example.com' && password.value === 'password123') {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzAwMDAwMDAsImV4cCI6MTYzMDg2NDAwMH0.fake-signature';
      
      localStorage.setItem('token', fakeToken);
      successMessage.value = `✅ Connecté! (Mode Test) Token: ${fakeToken.substring(0, 20)}...`;
      
      console.log('Connexion simulée réussie');
      
      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
      return;
    }
    
    // Si ce n'est pas les identifiants de test
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      successMessage.value = `✅ Connecté! Token: ${data.data.token.substring(0, 20)}...`;
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      error.value = `❌ ${data.error || 'Login failed'} (Status: ${response.status})`;
    }
  } catch (err: any) {
    console.error('Erreur complète:', err);
    error.value = `❌ Erreur réseau: ${err.message} - Le backend est-il démarré?`;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🎮 Backgammon Pro</h1>
      <h2>Connexion</h2>
      
      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            v-model="email" 
            type="email" 
            id="email" 
            placeholder="alice@example.com"
            required 
          />
        </div>
        
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input 
            v-model="password" 
            type="password" 
            id="password" 
            placeholder="password123"
            required 
          />
        </div>
        
        <button type="submit" :disabled="loading" class="btn-login">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
      
      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <div class="test-accounts">
        <h3>Comptes de test</h3>
        <p><strong>Alice:</strong> alice@example.com / password123</p>
        <p><strong>Bob:</strong> bob@example.com / password123</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

h2 {
  text-align: center;
  color: #34495e;
  margin-bottom: 2rem;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #2c3e50;
}

input {
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #3498db;
}

.btn-login {
  background: #3498db;
  color: white;
  padding: 0.875rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.btn-login:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-login:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
  text-align: center;
  border: 1px solid #f5c6cb;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
  text-align: center;
  border: 1px solid #c3e6cb;
}

.test-accounts {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.9rem;
}

.test-accounts h3 {
  margin-top: 0;
  color: #495057;
}

.test-accounts p {
  margin: 0.25rem 0;
  color: #6c757d;
}
</style>
