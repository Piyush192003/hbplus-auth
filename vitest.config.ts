import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    isolate: false,
    workers: false,
    preset: 'vitest',
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': './src',
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native-stub.ts',
    '^react-native/(.*)$': '<rootDir>/__mocks__/react-native-stub.ts',
    '^firebase/app$': '<rootDir>/__mocks__/firebase-app-stub.ts',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase-auth-stub.ts',
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(png|jpg|jpeg|svg)$': '<rootDir>/__mocks__/fileMock.ts',
  },

});