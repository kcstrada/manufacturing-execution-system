import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'
import typography from '@tailwindcss/typography'
import forms from '@tailwindcss/forms'
import { baseConfig, daisyUIConfig, adminThemes } from '@mes/config'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [baseConfig],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [
    typography,
    forms,
    daisyui,
  ],
  daisyui: {
    ...daisyUIConfig,
    themes: adminThemes,
    darkTheme: "dark",
  },
}

export default config