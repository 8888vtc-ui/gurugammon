<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiService from '@/services/api.service.js';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const successMessage = ref('');

// Check if already authenticated
onMounted(() => {
  if (apiService.isAuthenticated()) {
    router.push('/dashboard');
  }
});

async function login() {
  // Input validation
  if (!email.value.trim() || !password.value.trim()) {
    error.value = 'Please enter both email and password';
    return;
  }

  if (!isValidEmail(email.value)) {
    error.value = 'Please enter a valid email address';
    return;
  }

  loading.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    console.log('Attempting login for:', email.value);

    const response = await apiService.login(email.value, password.value);

    if (response.success) {
      successMessage.value = 'Login successful! Redirecting...';

      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      error.value = response.error || 'Login failed. Please check your credentials.';
    }
  } catch (err: any) {
    console.error('Login error:', err);

    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      error.value = 'Network error. Please check your connection and try again.';
    } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
      error.value = 'Invalid email or password.';
    } else {
      error.value = 'Login failed. Please try again later.';
    }
  } finally {
    loading.value = false;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function goToRegister() {
  router.push('/register');
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🎲 GammonGuru</h1>
      <h2>Welcome Back</h2>

      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="your.email@example.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="Enter your password"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" :disabled="loading" class="btn-login">
          {{ loading ? 'Signing In...' : 'Sign In' }}
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div class="register-link">
        <p>Don't have an account?
          <button @click="goToRegister" class="link-button">Create Account</button>
        </p>
      </div>

      <div class="security-notice">
        <p>🔒 Your connection is secure and your data is protected.</p>
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

.register-link {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e8ed;
}

.register-link p {
  margin: 0;
  color: #6c757d;
  font-size: 0.95rem;
}

.link-button {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  font-size: inherit;
}

.link-button:hover {
  color: #2980b9;
}

.security-notice {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

.security-notice p {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
}
</style>
