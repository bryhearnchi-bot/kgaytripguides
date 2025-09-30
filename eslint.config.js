import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import securityPlugin from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.bak',
      '**/backups/**',
      '**/coverage/**',
      '**/.next/**',
      '**/public/**',
      '**/scripts/copy-pwa-files.js',
    ],
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        alert: 'readonly',
        history: 'readonly',
        location: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        EventListener: 'readonly',
        MediaQueryList: 'readonly',
        MediaQueryListEvent: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        // React globals
        React: 'readonly',
        JSX: 'readonly',
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Test globals (Vitest)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      security: securityPlugin,
    },
    rules: {
      // TypeScript rules
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'warn', // Allow require() for configs
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn', // Warn for now
      '@typescript-eslint/no-empty-object-type': 'warn', // Warn for now
      '@typescript-eslint/ban-ts-comment': 'warn', // Warn for now
      '@typescript-eslint/no-namespace': 'warn', // Warn for now
      '@typescript-eslint/no-unsafe-function-type': 'warn', // Warn for now

      // React rules
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'react/prop-types': 'off', // Using TypeScript for prop types
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/no-unescaped-entities': 'warn', // Allow unescaped entities for now
      'react/display-name': 'warn',

      // React Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Security rules (critical for Phase 8)
      ...securityPlugin.configs.recommended.rules,
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'warn', // Warn for now
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn', // Allow alert in PWA install prompts
      'no-var': 'error',
      'prefer-const': 'warn', // Warn for now
      'prefer-template': 'warn',
      'no-unused-expressions': 'warn',
      'no-unused-vars': 'warn', // Warn for now
      'no-duplicate-imports': 'warn', // Warn for now
      eqeqeq: ['warn', 'always'], // Warn for now
      curly: ['error', 'all'],
      'no-throw-literal': 'warn', // Warn for now
      'prefer-promise-reject-errors': 'error',
      'no-redeclare': 'warn', // Warn for now
      'no-useless-escape': 'warn', // Warn for now
      'no-unreachable': 'warn', // Warn for now
      'no-constant-binary-expression': 'warn', // Warn for now
      'no-useless-catch': 'warn', // Warn for now

      // Best practices
      'no-return-await': 'warn', // Warn for now
      'require-await': 'off', // Too many false positives
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'max-depth': ['warn', 4],
      complexity: ['warn', 20], // Increased from 15
      'no-empty': 'warn', // Allow empty catch blocks for now
      'no-undef': 'warn', // TypeScript handles this better
      'react/no-unknown-property': 'warn', // Warn for now (cmdk custom properties)
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      security: securityPlugin,
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'warn', // Warn for now
      'no-unused-vars': 'warn', // Warn for now
      'security/detect-unsafe-regex': 'warn', // Warn for now
    },
  },

  // Prettier compatibility (must be last)
  prettierConfig,
];
