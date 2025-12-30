import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"
import { defineConfig } from "astro/config"

export default defineConfig({
    output: "static",
    site: "https://duetmail.com",
    trailingSlash: "never",
    integrations: [sitemap()],
    vite: {
        plugins: [tailwindcss()],
    },
})

