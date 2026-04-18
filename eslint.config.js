export default [
  {
    ignores: ["packages/**/dist/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["packages/**/*.js", "tests/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "prefer-const": "warn",
      "no-var": "error",
    },
  },
];
