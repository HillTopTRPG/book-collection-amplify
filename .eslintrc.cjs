module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'amplify',
    '*.config.ts',
    '*.config.js',
    'scripts',
    'coverage',
    '**/components/ui/*',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['react-refresh', 'import', 'react', 'unused-imports', 'simple-import-sort'],
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
    // "no-console": [
    //   "warn",
    //   {
    //     "allow": ["warn", "error"]
    //   }
    // ],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // すべてのimportを1つのグループにまとめて空行なし
          [
            // CSS imports (side effect imports without variables)
            '^.+\\.css$',
            // Type imports
            '^.+\\u0000$',
            // Packages (things that start with a letter, digit, underscore, or "@")
            '^@?\\w',
            // Internal packages (paths starting with "@/")
            '^@/',
            // Parent imports (paths starting with "../")
            '^\\.\\.(?!/?$)',
            '^\\.\\./?$',
            // Other relative imports (paths starting with "./")
            '^\\./(?=.*/)(?!/?$)',
            '^\\.(?!/?$)',
            '^\\./?$',
          ],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
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
    'react/jsx-no-leaked-render': [
      'error',
      {
        validStrategies: ['ternary', 'coerce'],
      },
    ],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    'no-nested-ternary': 'error',
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
    'arrow-body-style': ['error', 'as-needed'],
    'func-style': 'error',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      },
    ],
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'no-unused-vars': 'off',
    'prettier/prettier': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/method-signature-style': 'error',
  },
};
