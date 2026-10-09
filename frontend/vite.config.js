import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3000'
        }
    }
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import path from 'path'

// export default defineConfig({
//     plugins: [react()],
//     resolve: {
//         alias: { "@": path.resolve(__dirname, "./src") },
//     },
//     server: {
//         proxy: { '/api': 'http://localhost:3000' }
//     },
//     css: {
//         preprocessorOptions: {
//             scss: {
//                 // Har SCSS file mein automatically available
//                 additionalData: `@use "@/styles/variables.scss" as *; @use "@/styles/mixins.scss" as *;`
//             }
//         }
//     }
// })