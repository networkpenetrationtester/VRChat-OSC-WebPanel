import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsparser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: { ...globals.node }
		},
		plugins: { '@typescript-eslint': tseslint },
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	}
];
