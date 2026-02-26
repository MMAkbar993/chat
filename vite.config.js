import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true, // Enables hot module replacement (HMR)
        }),
    ],
    build: {
        manifest: true, 
        outDir: 'public/build', // Output directory for the production build
    },
});
