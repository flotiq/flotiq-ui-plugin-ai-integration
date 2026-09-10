const {defineConfig, globalIgnores} = require("eslint/config");

const globals = require("globals");
const js = require("@eslint/js");

const {FlatCompat} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = defineConfig([
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                // Replaced at build time by esbuild's `define`, so it never
                // reaches the browser - but eslint still has to know the name.
                process: "readonly",
            },

            sourceType: "module",
            ecmaVersion: 2020,
            parserOptions: {},
        },

        extends: compat.extends("eslint:recommended", "prettier"),

        rules: {
            "no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],

            "linebreak-style": 0,

            "no-use-before-define": [
                "error",
                {
                    variables: false,
                },
            ],

            "global-require": 0,

            "max-len": [
                "error",
                {
                    code: 120,
                },
            ],

            "guard-for-in": 0,
            "no-underscore-dangle": 0,
            "import/prefer-default-export": 0,
            "import/no-anonymous-default-export": 0,
            "import/no-extraneous-dependencies": 0,
        },
    },
    {
        // Inline SVG: the `d` attributes are single unbreakable tokens.
        files: ["common/icons.js"],
        rules: {"max-len": 0},
    },
    globalIgnores([
        "**/node_modules",
        "**/dist",
        "**/.eslintrc.cjs",
        "**/esbuild.config.js",
        "**/eslint.config.cjs",
    ]),
]);
