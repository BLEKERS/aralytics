import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')
  const appEnv = (env.ENV || process.env.ENV || (mode === 'production' ? 'production' : 'development')).toLowerCase()
  const isProdEnv = appEnv === 'prod' || appEnv === 'production'

  return {
    envDir: '..',
    define: {
      'import.meta.env.VITE_APP_ENV': JSON.stringify(isProdEnv ? 'production' : 'development'),
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
    },
  }
})
