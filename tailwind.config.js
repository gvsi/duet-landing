/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    '"Manrope Variable"',
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    '"Segoe UI"',
                    "Roboto",
                    "Helvetica",
                    "Arial",
                    '"Apple Color Emoji"',
                    '"Segoe UI Emoji"',
                ],
                serif: ['"Domine Variable"', "ui-serif", "Georgia", "serif"],
            },
        },
    },
}
