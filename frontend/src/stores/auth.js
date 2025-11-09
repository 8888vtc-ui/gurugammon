import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
export const useAuthStore = defineStore('auth', () => {
    // État
    const user = ref(null);
    const token = ref(null);
    const isLoading = ref(false);
    const error = ref(null);
    // Computed
    const isAuthenticated = computed(() => !!token.value && !!user.value);
    const isPremium = computed(() => user.value?.subscription_type !== 'FREE');
    const isVIP = computed(() => user.value?.subscription_type === 'VIP');
    // Actions
    const login = async (email, password) => {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erreur de connexion');
            }
            token.value = data.token;
            user.value = data.user;
            // Sauvegarder dans localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true };
        }
        catch (err) {
            error.value = err.message || 'Erreur de connexion';
            return { success: false, error: err.message };
        }
        finally {
            isLoading.value = false;
        }
    };
    const register = async (email, username, password) => {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erreur d\'inscription');
            }
            token.value = data.token;
            user.value = data.user;
            // Sauvegarder dans localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true };
        }
        catch (err) {
            error.value = err.message || 'Erreur d\'inscription';
            return { success: false, error: err.message };
        }
        finally {
            isLoading.value = false;
        }
    };
    const logout = () => {
        user.value = null;
        token.value = null;
        error.value = null;
        // Nettoyer localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };
    const refreshToken = async () => {
        if (!token.value)
            return false;
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.value}`
                }
            });
            if (!response.ok) {
                logout();
                return false;
            }
            const data = await response.json();
            token.value = data.token;
            localStorage.setItem('token', data.token);
            return true;
        }
        catch (err) {
            logout();
            return false;
        }
    };
    const updateProfile = async (updates) => {
        if (!token.value || !user.value) {
            return { success: false, error: 'Non connecté' };
        }
        isLoading.value = true;
        error.value = null;
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token.value}`
                },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erreur de mise à jour');
            }
            user.value = { ...user.value, ...data.user };
            localStorage.setItem('user', JSON.stringify(user.value));
            return { success: true };
        }
        catch (err) {
            error.value = err.message || 'Erreur de mise à jour';
            return { success: false, error: err.message };
        }
        finally {
            isLoading.value = false;
        }
    };
    const loadFromStorage = () => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            try {
                token.value = storedToken;
                user.value = JSON.parse(storedUser);
            }
            catch (err) {
                // Nettoyer si les données sont corrompues
                logout();
            }
        }
    };
    const clearError = () => {
        error.value = null;
    };
    return {
        // État
        user,
        token,
        isLoading,
        error,
        // Computed
        isAuthenticated,
        isPremium,
        isVIP,
        // Actions
        login,
        register,
        logout,
        refreshToken,
        updateProfile,
        loadFromStorage,
        clearError
    };
});
//# sourceMappingURL=auth.js.map