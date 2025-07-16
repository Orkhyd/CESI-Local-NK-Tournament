import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import globals from 'globals';
import vueParser from 'vue-eslint-parser'; // ✅ IMPORT THE VUE PARSER

export default [
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dev-dist/**', '**/dist-ssr/**', '**/coverage/**', '**/*.test.js'],
  },

  // Configuration for your Vue application code (runs in browser)
  {
    files: ['src/**/*.{js,vue}'], // Target both .js and .vue files in src
    plugins: {
      vue: pluginVue,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
      // ✅ Explicitly set the Vue parser for .vue files
      // And the default JS parser for <script> blocks within .vue files, or stand-alone .js files
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // This is crucial: tell vue-eslint-parser to use @babel/eslint-parser or @typescript-eslint/parser
        // for the JS parts of your .vue files (or .js files).
        // Since you don't have TypeScript, we'll use an appropriate JS parser.
        // Given your project uses 'module' type, @babel/eslint-parser is a safe bet.
        // You might need to install @babel/eslint-parser if you don't have it.
        parser: '@babel/eslint-parser',
        requireConfigFile: false, // Prevents babel config file requirement
      },
    },
    rules: {
      // General JS recommended rules
      ...js.configs.recommended.rules,
      // Vue specific rules (use recommended or essential, as per your preference)
      ...pluginVue.configs['flat/recommended'].rules, // Changed from essential to recommended for more rules
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },

  // Configuration for Node.js files
  {
    files: [
      'electron/**/*.{js,cjs}',
      '*.cjs',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      // No specific parser needed for plain CJS/ESM Node files
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // Configuration for your Vitest tests
  {
    files: ['src/**/__tests__/*'],
    plugins: {
      vitest: pluginVitest,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // Tests usually run with Node's parser
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...pluginVitest.configs.recommended.rules,
    },
  },

  // Prettier config must be last
  skipFormatting,
];
