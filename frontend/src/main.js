import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Importer les styles CSS standard
import './styles/main.css'

// Créer l'application
const app = createApp(App)

// Utiliser les plugins
app.use(createPinia())
app.use(router)

// Monter l'application
app.mount('#app')
