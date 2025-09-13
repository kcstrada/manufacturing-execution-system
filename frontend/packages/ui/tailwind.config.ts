import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'
import { baseConfig, daisyUIConfig, adminThemes, userThemes } from '@mes/config'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [baseConfig],
  plugins: [daisyui],
  daisyui: {
    ...daisyUIConfig,
    themes: [...adminThemes, ...userThemes],
  },
}

export default config