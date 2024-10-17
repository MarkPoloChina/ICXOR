// @ts-check
import lightwing from '@lightwing/eslint-config'

export default lightwing({
  ignores: [
    'dist',
    'node_modules',
    '*.svelte',
    '*.snap',
    '*.d.ts',
    '**/*.json',
    '**/*.md',
    'coverage',
    'js_test',
    'local-data',
  ],
  rules: {
    'style/max-len': ['error', { code: 100, ignorePattern: '`', comments: 150 }],
  },
})
