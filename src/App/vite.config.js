import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(true),
    // 添加其他需要的特性标志
  },
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData: `@import "./src/styles/global.scss";`
      }
    }
  },
  base: '/obsidian-chat-view-qq/', // [!code] 临时，需要根据你要部署的位置进行修改
  server: {
    host: 'localhost',
    port: 3034,
  },
  root: path.resolve(__dirname, './'), // 确保 Vite 使用正确的根目录
  build: {
    outDir: 'dist',
    rollupOptions: {
      // input: {
      //   main: path.resolve(__dirname, './src/main.ts'),
      // },
      input: path.resolve(__dirname, './index.html'),
    },
  },
});
