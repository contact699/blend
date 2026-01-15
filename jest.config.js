/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  
  // Use the same transformer as Expo
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Path mapping for module aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/.expo/',
  ],

  // Transform ignore patterns - don't transform node_modules except these
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|' +
      'react-native|' +
      '@react-navigation|' +
      'expo|' +
      '@expo|' +
      'expo-.*|' +
      '@supabase|' +
      'lucide-react-native|' +
      'nativewind|' +
      '@shopify/flash-list|' +
      'react-native-reanimated|' +
      'react-native-gesture-handler|' +
      'react-native-screens|' +
      'react-native-safe-area-context|' +
      'react-native-gifted-chat|' +
      '@tanstack/react-query|' +
      'zustand' +
    ')/)',
  ],

  // Collect coverage from these files
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/app/**', // Exclude route files for now
  ],

  // Coverage thresholds (start low, increase over time)
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },

  // Clear mocks between tests
  clearMocks: true,

  // Use fake timers for testing timeouts
  fakeTimers: {
    enableGlobally: false,
  },

  // Test environment
  testEnvironment: 'node',

  // Verbose output
  verbose: true,
};
