import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    include: [
      '@interchain-kit/react',
      '@interchain-kit/core',
      '@interchain-kit/keplr-extension',
      '@interchain-kit/leap-extension',
      '@interchain-ui/react',
      '@interchainjs/utils',
      '@chain-registry/v2',
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})

