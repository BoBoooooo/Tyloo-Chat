module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
    '@vue/typescript',
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  rules: {
    // "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-unused-component': 'off',
    'no-console': 'off',
    'no-irregular-whitespace': 'off',
    'prefer-spread': 0,
    'no-plusplus': 0,
    'max-len': 0,
    'eslint-disable-next-line': 'off',
    // 允许class中方法不使用this
    'class-methods-use-this': 'off',
    // 允许下划线变量命名
    'no-underscore-dangle': 'off',
    // 不强制返回值
    'consistent-return': 'off',
    camelcase: 'off',
    // 允许循环引入
    'import/no-cycle': 'off',
  },
};
