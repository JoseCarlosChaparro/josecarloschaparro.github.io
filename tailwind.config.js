/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './app.js', './locales/*.json'],
    darkMode: 'class',
    theme: {
        extend: {
            // Semantic color tokens resolve to the CSS custom properties in
            // style.css, so every utility follows the light/dark switch.
            colors: {
                // Never name a color 'base': it would clash with the text-base
                // size utility and override it.
                page: 'var(--c-page)',
                band: 'var(--c-band)',
                card: 'var(--c-card)',
                deep: 'var(--c-deep)',
                ink: 'var(--c-ink)',
                muted: 'var(--c-muted)',
                faint: 'var(--c-faint)',
                rule: 'var(--c-rule)',
                edge: 'var(--c-edge)',
                accent: 'var(--c-accent)',
                'accent-ink': 'var(--c-accent-ink)',
                'accent-soft': 'var(--c-accent-soft)'
            },
            fontFamily: {
                display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
                sans: ['Manrope', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
            }
        }
    }
};
