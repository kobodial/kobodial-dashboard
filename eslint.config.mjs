import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/*
 * eslint-config-next 16 exports native flat-config arrays, so they are
 * spread directly. The FlatCompat bridge that older Next templates use
 * is not just unnecessary here — under ESLint 10 it throws on a
 * circular structure while validating the eslintrc-shaped config it is
 * trying to convert.
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
