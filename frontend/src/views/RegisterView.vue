<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiService from '@/services/api.service.js';

const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);
const successMessage = ref('');

// Password strength requirements
const passwordRequirements = ref({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false
});

// Check if already authenticated
onMounted(() => {
  if (apiService.isAuthenticated()) {
    router.push('/dashboard');
  }
});

function validatePasswordStrength(password: string) {
  passwordRequirements.value = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  return Object.values(passwordRequirements.value).every(Boolean);
}

function isPasswordStrong(): boolean {
  return Object.values(passwordRequirements.value).every(Boolean);
}

async function register() {
  // Input validation
  if (!name.value.trim() || !email.value.trim() || !password.value.trim()) {
    error.value = 'Please fill in all required fields';
    return;
  }

  if (!isValidEmail(email.value)) {
    error.value = 'Please enter a valid email address';
    return;
  }

  if (name.value.trim().length < 2) {
    error.value = 'Name must be at least 2 characters long';
    return;
  }

  if (!isPasswordStrong()) {
    error.value = 'Password does not meet security requirements';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    console.log('Attempting registration for:', email.value);

    const response = await apiService.register(name.value, email.value, password.value);

    if (response.success) {
      successMessage.value = 'Account created successfully! Redirecting to login...';

      // Redirect to login after successful registration
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      error.value = response.error || 'Registration failed. Please try again.';
    }
  } catch (err: any) {
    console.error('Registration error:', err);

    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      error.value = 'Network error. Please check your connection and try again.';
    } else if (err.message?.includes('400') || err.message?.includes('Bad Request')) {
      error.value = 'This email is already registered. Please use a different email.';
    } else {
      error.value = 'Registration failed. Please try again later.';
    }
  } finally {
    loading.value = false;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function goToLogin() {
  router.push('/login');
}

// Watch password changes to update requirements
function updatePasswordRequirements() {
  validatePasswordStrength(password.value);
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h1>🎲 GammonGuru</h1>
      <h2>Create Your Account</h2>

      <form @submit.prevent="register" class="register-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            v-model="name"
            type="text"
            id="name"
            placeholder="Enter your full name"
            required
            autocomplete="name"
            maxlength="50"
          />
        </div>

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
            placeholder="Create a strong password"
            required
            autocomplete="new-password"
            @input="updatePasswordRequirements"
          />

          <!-- Password Requirements -->
          <div class="password-requirements">
            <p>Password must contain:</p>
            <ul>
              <li :class="{ valid: passwordRequirements.length }">
                <span class="indicator">{{ passwordRequirements.length ? '✓' : '✗' }}</span>
                At least 8 characters
              </li>
              <li :class="{ valid: passwordRequirements.uppercase }">
                <span class="indicator">{{ passwordRequirements.uppercase ? '✓' : '✗' }}</span>
                One uppercase letter
              </li>
              <li :class="{ valid: passwordRequirements.lowercase }">
                <span class="indicator">{{ passwordRequirements.lowercase ? '✓' : '✗' }}</span>
                One lowercase letter
              </li>
              <li :class="{ valid: passwordRequirements.number }">
                <span class="indicator">{{ passwordRequirements.number ? '✓' : '✗' }}</span>
                One number
              </li>
              <li :class="{ valid: passwordRequirements.special }">
                <span class="indicator">{{ passwordRequirements.special ? '✓' : '✗' }}</span>
                One special character
              </li>
            </ul>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            id="confirmPassword"
            placeholder="Confirm your password"
            required
            autocomplete="new-password"
          />
        </div>

        <button type="submit" :disabled="loading || !isPasswordStrong()" class="btn-register">
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div class="login-link">
        <p>Already have an account?
          <button @click="goToLogin" class="link-button">Sign In</button>
        </p>
      </div>

      <div class="terms-notice">
        <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px;
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

.register-form {
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

.password-requirements {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.85rem;
}

.password-requirements p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #495057;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
  color: #dc3545;
  transition: color 0.3s ease;
}

.password-requirements li.valid {
  color: #28a745;
}

.indicator {
  margin-right: 0.5rem;
  font-weight: bold;
}

.btn-register {
  background: #28a745;
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

.btn-register:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.btn-register:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
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

.login-link {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e8ed;
}

.login-link p {
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

.terms-notice {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #ffeaa7;
}

.terms-notice p {
  margin: 0;
  font-size: 0.8rem;
  color: #856404;
}
</style>
