import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"
import { defineConfig } from "astro/config"

export default defineConfig({
    output: "static",
    site: "https://duetmail.com",
    trailingSlash: "never",
<<<<<<< HEAD
=======
    build: {
        format: "file",
    },
>>>>>>> fb1d706 (fix(config): update trailing slash setting to "never" and adjust build format)
    integrations: [sitemap()],
    vite: {
        plugins: [tailwindcss()],
    },
})
