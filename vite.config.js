import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 改成你的 GitHub repo 名稱，例如 '/meal-tracker/'
export default defineConfig({
  plugins: [react()],
  base: '/MealTracker/',
})
