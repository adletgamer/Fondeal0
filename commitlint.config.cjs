/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'web',
        'ui',
        'sdk',
        'soroban',
        'passport',
        'score',
        'escrow',
        'database',
        'types',
        'ci',
        'docs',
        'deps',
        'release',
      ],
    ],
  },
};
