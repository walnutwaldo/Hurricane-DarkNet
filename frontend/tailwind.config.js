const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        colors: {
            ...colors,
            "darkgreen": "#234239",
            "lightgreen": "#DCF1EB"
        },
        extend: {},
    },
    plugins: [
        require('tailwind-scrollbar')
    ],
    variants: {
        scrollbar: ['dark', 'rounded']
    }
}