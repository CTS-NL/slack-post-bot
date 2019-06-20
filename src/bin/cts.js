#!/usr/bin/env node

'use strict';

const {pathExists} = require('fs-extra');
const yargs = require('yargs');
const path = require('path');
const postJobs = require('../lib/post-jobs');
const moment = require('moment');

require('dotenv').config();

const args = yargs
	.usage('Usage: cts [command]')
	.command(
		'jobs <data-directory>',
		'Post jobs to Slack',
		(y) => {
			return y
				.positional('data-directory', {
					description: 'Data directory for the CTSNL website.',
				})
				.option('date', {
					type: 'string',
					describe: 'Custom date to post jobs from in ISO-8601 format.',
				});
		},
		async (argv) => {
			const dataDirectory = path.resolve(process.cwd(), argv.dataDirectory);

			if (!await pathExists(dataDirectory)) {
				console.error(`The data directory, ${argv.dataDirectory}, does not exist`);
				process.exitCode = 1;
				return;
			}

			let date;
			if (argv.date) {
				date = moment.utc(argv.date, 'YYYY-MM-DD', true);
				if (!date.isValid()) {
					console.error(`Invalid date format provided, unsure the format is ${moment().format('YYYY-MM-DD')} (YYYY-MM-DD)`);
					process.exitCode = 1;
					return;
				}
			}

			await postJobs(dataDirectory, date);
		}
	)
	.demandCommand(1, 1, 'Please provide a command', 'Please provide a command')
	.help('h')
	.alias('h', 'help')
	.strict()
;

// eslint-disable-next-line no-unused-expressions
args.argv;
