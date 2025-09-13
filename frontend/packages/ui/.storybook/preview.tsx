import type { Preview } from '@storybook/react'
import React from 'react'
import '../src/styles/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="light" className="min-h-screen bg-base-100 p-8">
        <Story />
      </div>
    ),
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'DaisyUI theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'corporate', title: 'Corporate' },
          { value: 'business', title: 'Business' },
          { value: 'emerald', title: 'Emerald' },
          { value: 'lofi', title: 'Lo-Fi' },
        ],
        showName: true,
      },
    },
  },
}

export default preview