import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import path from 'path';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: 'tsconfig.json'
    })
  ],
  resolve: {
    alias: {
      'environments': path.resolve(__dirname, './src/environments')
    }
  },
  server: { port: 4200, host: '0.0.0.0' }
});
