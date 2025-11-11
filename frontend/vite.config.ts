import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: 'tsconfig.json'
    })
  ],
  server: { port: 4200, host: '0.0.0.0' }
});
