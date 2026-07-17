import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yitian.words',
  appName: '一天100词',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
}

export default config
