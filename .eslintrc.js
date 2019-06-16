'use strict';

const mitmaroEslintConfig = require('eslint-config-mitmaro');

module.exports = mitmaroEslintConfig(
	[
		'node',
		'console',
		'ecmascript-9',
	],
	{
		root: true,
	},
);
