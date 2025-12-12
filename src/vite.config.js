import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  // ... plugins y otras configuraciones ...
  test: {
    environment: 'jsdom',
    // La ruta debe ser relativa a la raíz del proyecto donde se ejecuta el comando `vitest`
    setupFiles: ['./tests/setup.js'], // Asegúrate de que esta ruta sea correcta
  },
    plugins: [vue()],
  
  // AÑADE O MODIFICA ESTA LÍNEA:
  // Usa './' para forzar rutas relativas, lo que suele solucionar problemas de despliegue.
  base: './', 
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
});