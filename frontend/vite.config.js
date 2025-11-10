import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    base: '/', // Important pour Netlify (racine du domaine)
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true, // Pour debugging production
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue', 'vue-router', 'pinia'],
                    api: ['./src/services/api.service.js', './src/services/websocket.client.js']
                }
            }
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/ws': {
                target: 'ws://localhost:3000',
                ws: true,
                changeOrigin: true
            }
        }
    },
    preview: {
        port: 4173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/ws': {
                target: 'ws://localhost:3000',
                ws: true,
                changeOrigin: true
            }
        }
    }
});
//# sourceMappingURL=vite.config.js.map