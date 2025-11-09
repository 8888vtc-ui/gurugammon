import axios from 'axios';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    withCredentials: true,
});
// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
// Méthodes HTTP pratiques
export default {
    get: (url) => api.get(url),
    post: (url, data) => api.post(url, data),
    put: (url, data) => api.put(url, data),
    delete: (url) => api.delete(url),
    // Accès direct à axios pour les cas avancés
    axios: api
};
//# sourceMappingURL=api.js.map