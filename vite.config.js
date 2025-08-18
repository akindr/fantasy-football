import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import eslintPlugin from 'vite-plugin-eslint';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
    plugins: [react(), eslintPlugin(), mkcert()],
    build: {
        // to output your build into build dir the same as Webpack
        outDir: 'build',
        sourcemap: true,
    },
    envPrefix: ['REACT_APP_'],
    server: {
        open: true,
        port: 3000,
    },
});
