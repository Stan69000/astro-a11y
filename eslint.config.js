export default [
  {
    files: ["packages/**/*.js", "tests/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "prefer-const": "warn",
      "no-var": "error",
    },
  },
];
