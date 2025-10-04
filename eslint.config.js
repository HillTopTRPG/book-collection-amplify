import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base recommended configs
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'dist/**',
      'amplify/**',
      '.amplify/**',
      'tmp/**',
      '*.config.ts',
      '*.config.js',
      'scripts/**',
      'coverage/**',
      '**/components/ui/*',
    ],
  },

  // Main configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },

    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      prettier: prettierPlugin,
      '@typescript-eslint': tseslint,
    },

    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },

    rules: {
      // TypeScript rules
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/require-array-sort-compare': [
        'error',
        {
          ignoreStringArrays: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // React rules
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-leaked-render': [
        'error',
        {
          validStrategies: ['ternary', 'coerce'],
        },
      ],
      'react/jsx-no-bind': [
        'error',
        {
          allowArrowFunctions: true,
          allowBind: true,
          allowFunctions: false,
          ignoreRefs: true,
          ignoreDOMComponents: false,
        },
      ],
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',

      // React Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Import rules
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      'import/no-unresolved': 'error',
      'import/no-cycle': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            [
              // CSS imports
              '^.+\\.css$',
              // Type imports
              '^.+\\u0000$',
              // Packages
              '^@?\\w',
              // Internal packages
              '^@/',
              // Parent imports
              '^\\.\\.(?!/?$)',
              '^\\.\\./?$',
              // Other relative imports
              '^\\./(?=.*/)(?!/?$)',
              '^\\.(?!/?$)',
              '^\\./?$',
            ],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // General rules
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
      'no-nested-ternary': 'error',
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 0,
          maxBOF: 0,
        },
      ],
      'padded-blocks': ['error', 'never'],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'class'],
        },
        {
          blankLine: 'always',
          prev: ['function', 'class'],
          next: '*',
        },
      ],
      'arrow-body-style': ['error', 'as-needed'],
      'func-style': 'error',

      // Prettier
      ...prettierConfig.rules,
      'prettier/prettier': 'off',
    },
  },
];
