'use strict';

const fetch = require('node-fetch');
const fs = require('fs-extra');
const moment = require('moment');
const path = require('path');
const yaml = require('js-yaml');

module.exports = async (dataRoot, date = moment()) => {
	if (!process.env.SLACK_POST_URL) {
		console.error('The environment variable SLACK_POST_URL must be set');
		process.exitCode = 1;
		return;
	}

	const slackPostUrl = process.env.SLACK_POST_URL;

	const jobPostingsDataFilePath = path.resolve(dataRoot, 'jobs.yml');
	const companiesDataFilePath = path.resolve(dataRoot, 'companies.yml');

	if (!await fs.pathExists(jobPostingsDataFilePath)) {
		console.error(`The provided jobs data file does not exist: ${jobPostingsDataFilePath}`);
		process.exitCode = 1;
		return;
	}

	if (!await fs.pathExists(companiesDataFilePath)) {
		console.error(`The provided companies data file does not exist: ${companiesDataFilePath}`);
		process.exitCode = 1;
		return;
	}

	const jobPostingsData = yaml.safeLoad(await fs.readFile(jobPostingsDataFilePath));
	const companiesData = yaml.safeLoad(await fs.readFile(companiesDataFilePath));

	let totalPosts = 0;
	const todaysPosts = [];
	for (const companyPostings of jobPostingsData) {
		const company = companiesData[companyPostings.company];
		for (const jobPostings of companyPostings.jobs) {
			totalPosts += jobPostings.jobs.length;
			const postingDate = moment.utc(jobPostings.post_date);
			if (postingDate.format('MM DD YYYY') === date.format('MM DD YYYY')) {
				for (const job of jobPostings.jobs) {
					todaysPosts.push({
						company,
						...job,
					});
				}
			}
		}
	}

	if (todaysPosts.length === 0) {
		console.log('There are no job posts this week');
		process.exitCode = 1;
		return;
	}

	const message = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Job Posting Update for ${date.format('MMM D, YYYY')}*`,
			},
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `This week there are *${totalPosts}* total job postings on the <https://ctsnl.ca/jobs/|CTS-NL Job Postings Page>.`,
			},
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `New job posts for week ${date.format('WW')} of ${date.format('YYYY')}`,
			},
		},
		{
			type: 'divider',
		},
	];

	for (const post of todaysPosts) {
		const url = post.indeed ? `https://www.indeed.com/viewjob?jk=${post.indeed}` : post.link;
		message.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: [
					`*<${url}|${post.title}>*`,
					`<${post.company.url}|${post.company.name}>`,
				].join('\n'),
			},
		});
	}

	message.push({
		type: 'divider',
	});

	console.log(`Sending message with ${todaysPosts.length} jobs`);

	const response = await fetch(slackPostUrl, {
		method: 'POST',
		body: JSON.stringify({blocks: message}),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (response.status !== 200) {
		console.error(`Status code: ${response.status}`);
		console.error(await response.text());
	}

	console.log('Message sent');
};
