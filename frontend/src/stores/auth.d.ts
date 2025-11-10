export interface User {
    id: string;
    email: string;
    username: string;
    elo: number;
    subscription_type: 'FREE' | 'PREMIUM' | 'VIP';
    avatar?: string;
    created_at: string;
    last_login_at: string;
}
export declare const useAuthStore: import("pinia").StoreDefinition<"auth", Pick<{
    user: import("vue").Ref<{
        id: string;
        email: string;
        username: string;
        elo: number;
        subscription_type: "FREE" | "PREMIUM" | "VIP";
        avatar?: string;
        created_at: string;
        last_login_at: string;
    } | null, User | {
        id: string;
        email: string;
        username: string;
        elo: number;
        subscription_type: "FREE" | "PREMIUM" | "VIP";
        avatar?: string;
        created_at: string;
        last_login_at: string;
    } | null>;
    token: import("vue").Ref<string | null, string | null>;
    isLoading: import("vue").Ref<boolean, boolean>;
    error: import("vue").Ref<string | null, string | null>;
    isAuthenticated: import("vue").ComputedRef<boolean>;
    isPremium: import("vue").ComputedRef<boolean>;
    isVIP: import("vue").ComputedRef<boolean>;
    login: (email: string, password: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    register: (email: string, username: string, password: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
    updateProfile: (updates: Partial<User>) => Promise<{
        success: boolean;
        error?: string;
    }>;
    loadFromStorage: () => void;
    clearError: () => void;
}, "error" | "token" | "user" | "isLoading">, Pick<{
    user: import("vue").Ref<{
        id: string;
        email: string;
        username: string;
        elo: number;
        subscription_type: "FREE" | "PREMIUM" | "VIP";
        avatar?: string;
        created_at: string;
        last_login_at: string;
    } | null, User | {
        id: string;
        email: string;
        username: string;
        elo: number;
        subscription_type: "FREE" | "PREMIUM" | "VIP";
        avatar?: string;
        created_at: string;
        last_login_at: string;
    } | null>;
    token: import("vue").Ref<string | null, string | null>;
    isLoading: import("vue").Ref<boolean, boolean>;
    error: import("vue").Ref<string | null, string | null>;
    isAuthenticated: import("vue").ComputedRef<boolean>;
    isPremium: import("vue").ComputedRef<boolean>;
    isVIP: import("vue").ComputedRef<boolean>;
    login: (email: string, password: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    register: (email: string, username: string, password: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
    updateProfile: (updates: Partial<User>) => Promise<{
        success: boolean;
        error?: string;
    }>;
    loadFromStorage: () => void;
    clearError: () => void;
}, "isAuthenticated" | "isPremium" | "isVIP">, Pick<{
    user: import("vue").Ref<{
        id: string;
        email: string;
        username: string;
        elo: number;
        subscription_type: "FREE" | "PREMIUM" | "VIP";
        avatar?: string;
        created_at: string;
        last_login_at: string;
    } | null, User | {
        id: string;
        email: string;
        username: string;
        elo: number;
        subscription_type: "FREE" | "PREMIUM" | "VIP";
        avatar?: string;
        created_at: string;
        last_login_at: string;
    } | null>;
    token: import("vue").Ref<string | null, string | null>;
    isLoading: import("vue").Ref<boolean, boolean>;
    error: import("vue").Ref<string | null, string | null>;
    isAuthenticated: import("vue").ComputedRef<boolean>;
    isPremium: import("vue").ComputedRef<boolean>;
    isVIP: import("vue").ComputedRef<boolean>;
    login: (email: string, password: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    register: (email: string, username: string, password: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
    updateProfile: (updates: Partial<User>) => Promise<{
        success: boolean;
        error?: string;
    }>;
    loadFromStorage: () => void;
    clearError: () => void;
}, "login" | "register" | "logout" | "refreshToken" | "updateProfile" | "loadFromStorage" | "clearError">>;
//# sourceMappingURL=auth.d.ts.map