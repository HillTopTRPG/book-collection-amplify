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
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'amplify', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: ['react-refresh', 'import', 'react'],
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  rules: {
    "indent": [
      "error",
      2,
      {
        "SwitchCase": 1
      }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    // "no-console": [
    //   "warn",
    //   {
    //     "allow": ["warn", "error"]
    //   }
    // ],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type'
        ],
        'pathGroups': [
          {
            'pattern': 'react',
            'group': 'external',
            'position': 'before'
          },
          {
            'pattern': '@/**',
            'group': 'internal'
          }
        ],
        'pathGroupsExcludedImportTypes': ['react'],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'array-bracket-spacing': [
      'error',
      'never'
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        'max': 1,
        'maxEOF': 0,
        'maxBOF': 0
      }
    ],
    'padded-blocks': [
      'error',
      'never'
    ],
    'padding-line-between-statements': [
      'error',
      {
        'blankLine': 'always',
        'prev': ['const', 'let', 'var'],
        'next': 'return'
      },
      {
        'blankLine': 'always',
        'prev': '*',
        'next': ['function', 'class']
      },
      {
        'blankLine': 'always',
        'prev': ['function', 'class'],
        'next': '*'
      }
    ],
    'react/jsx-no-leaked-render': [
      'error',
      {
        'validStrategies': ['ternary', 'coerce']
      }
    ],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    'no-nested-ternary': 'error',
    'react/jsx-no-bind': [
      'error',
      {
        'allowArrowFunctions': false,
        'allowBind': true,
        'allowFunctions': false,
        'ignoreRefs': true,
        'ignoreDOMComponents': false
      }
    ],
    "arrow-body-style": ["error", "as-needed"],
    "func-style": "error",
  },
}
