import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/dapp.fun/',
    plugins: [
        react(),
        nodePolyfills(),
    ],
    server: {
        proxy: {
            // Avoid CORS when compiler fetches OpenZeppelin etc. from unpkg
            '/unpkg-proxy': {
                target: 'https://unpkg.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/unpkg-proxy/, ''),
            },
        },
    },
})
