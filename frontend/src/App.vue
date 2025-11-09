<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initializeAuth()
})
</script>

<template>
  <RouterView />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Georgia:wght@400;700&display=swap');

body {
  margin: 0;
  font-family: 'Georgia', serif;
  background: linear-gradient(135deg, #f5deb3 0%, #deb887 50%, #d2691e 100%);
  min-height: 100vh;
}

* {
  box-sizing: border-box;
}

/* Variables CSS personnalisées */
:root {
  --gammon-primary: #8B4513;
  --gammon-secondary: #D2691E;
  --gammon-board: #DEB887;
  --gammon-dark: #654321;
  --gammon-light: #F5DEB3;
  --gammon-white: #FFFFFF;
  --gammon-black: #000000;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--gammon-light);
}

::-webkit-scrollbar-thumb {
  background: var(--gammon-primary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gammon-secondary);
}
</style>
