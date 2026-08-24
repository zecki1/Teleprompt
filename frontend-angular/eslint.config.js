const angular = require('@angular-eslint/eslint-plugin');
const templateParser = require('@angular-eslint/template-parser');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    plugins: {
      '@angular-eslint': angular
    },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/use-lifecycle-interface': 'warn',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/no-forward-ref': 'error',
      '@angular-eslint/consistent-component-styles': 'error',
      '@angular-eslint/prefer-standalone-component': 'error'
    }
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: templateParser
    },
    rules: {}
  }
];
