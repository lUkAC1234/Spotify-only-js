import mobxObserverRule from "./eslint/mobx-observer-rule.js";

export default [
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parser: (await import("@typescript-eslint/parser")).default,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                project: null,
            },
        },
        plugins: {
            custom: {
                rules: {
                    "mobx-observer-rule": mobxObserverRule,
                },
            },
        },
        rules: {
            "custom/mobx-observer-rule": "warn",
        },
    },
];
