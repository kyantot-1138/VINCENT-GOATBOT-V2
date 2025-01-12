const axios = require('axios');
const fs = require('fs');
const request = require('request');

module.exports = {
	config: {
		name: "shoticronv2",
		author: "Armenion",
		version: "2.0.0",
		cooldowns: 0,
		role: 0,
		shortDescription: {
			en: "send random video"
		},
		longDescription: {
			en: "randomshoti"
		},
		category: "Shoti",
		guide: {
			en: "&shoticronv2 {p} <setinterval> <time> <hour> <minutes><seconds>"
		}
	},

	onStart: async function ({ api, event }) {
		const threadID = event.threadID;
		const commandArgs = event.body.toLowerCase().split(' ');

		const allowedAdminUID = '100053549552408';
		if (commandArgs[1] === 'setinterval') {
			const newIntervalValue = parseFloat(commandArgs[2]);
			const newIntervalUnit = commandArgs[3]?.toLowerCase();

			if (!isNaN(newIntervalValue) && newIntervalValue > 0) {
				let newInterval;

				if (newIntervalUnit === 'hour' || newIntervalUnit === 'hours') {
					newInterval = newIntervalValue * 60 * 60 * 1000;
					const unit = newIntervalValue === 1 ? 'hour' : 'hours';
					api.sendMessage(`🚀 |•Interval time set to ${newIntervalValue} ${unit}.`, threadID);
				} else if (newIntervalUnit === 'minute' || newIntervalUnit === 'minutes') {
					newInterval = newIntervalValue * 60 * 1000;
					const unit = newIntervalValue === 1 ? 'minute' : 'minutes';
					api.sendMessage(`🚀 |•Interval time set to ${newIntervalValue} ${unit}.`, threadID);
				} else {
					api.sendMessage('🚀 |•Invalid unit. Please use "minutes" or "hours".', threadID);
					return;
				}

				shotiAutoInterval[threadID] = newInterval;
			} else {
				api.sendMessage('🚀 |•Invalid interval time. Please provide a valid positive number.', threadID);
			}
			return;
		} else if (commandArgs[1] === 'interval') {
			const currentInterval = shotiAutoInterval[threadID] || defaultInterval;
			const unit = currentInterval === 60 * 60 * 1000 ? 'hour' : 'minute';
			api.sendMessage(`🚀 |•Current interval time is set to ${currentInterval / (unit === 'hour' ? 60 * 60 * 1000 : 60 * 1000)} ${unit}.`, threadID);
			return;
		} else if (commandArgs[1] === 'on') {
			if (!shotiAutoState[threadID]) {
				shotiAutoState[threadID] = true;
				const intervalUnit = shotiAutoInterval[threadID] ? (shotiAutoInterval[threadID] === 60 * 60 * 1000 ? 'hour' : 'minute') : 'hour';
				const intervalValue = shotiAutoInterval[threadID] ? shotiAutoInterval[threadID] / (intervalUnit === 'hour' ? 60 * 60 * 1000 : 60 * 1000) : 1;
				const intervalMessage = `will send video every ${intervalValue} ${intervalUnit}${intervalValue === 1 ? '' : 's'}`;

				api.sendMessage(`🚀 |•Command feature is turned on, ${intervalMessage}.`, threadID);

				shoticron(api, event, threadID);

				setInterval(() => {
					if (shotiAutoState[threadID]) {
						shoticron(api, event, threadID);
					}
				}, shotiAutoInterval[threadID] || defaultInterval);
			} else {
				api.sendMessage('🚀 |•Command feature is already turned on', threadID);
			}
			return;
		} else if (commandArgs[1] === 'off') {
			shotiAutoState[threadID] = false;
			api.sendMessage('🚀|•Command feature is turned off', threadID);
			return;
		} else if (commandArgs[1] === 'status') {
			const statusMessage = shotiAutoState[threadID] ? 'on' : 'off';
			const intervalMessage = shotiAutoInterval[threadID] ? `Interval time set to ${shotiAutoInterval[threadID] / (shotiAutoInterval[threadID] === 60 * 60 * 1000 ? 60 : 1000)} minutes.` : 'Interval time not set. Using the default 1 -hour interval.';
			const errorMessage = lastVideoError[threadID] ? `Last video error: ${lastVideoError[threadID]}` : '';

			api.sendMessage(`🚀|•Command feature is currently ${statusMessage}.\n🚀|•Total videos sent: ${videoCounter}\n🚀|•Total error videos: ${errorVideoCounter}\n${errorMessage}`, threadID);
			return;
		} else if (commandArgs[1] === 'resetcount') {
			// Check if the user has permission to reset counts
			if (event.senderID === allowedAdminUID) {
				videoCounter = 0;
				errorVideoCounter = 0;
				api.sendMessage('🚀 |•Video counts have been reset.', threadID);
			} else {
				api.sendMessage('🚀 |•You do not have permission to reset counts.', threadID);
			}
			return;
		}

		api.sendMessage('🔴🟡🟢\n\n╭─❍\n➠•Invalid command.\n╰───────────⟡\n╭─❍\n➠•"shoticron on", "shoticron off" - to turn ON or turn OFF.\n╰───────────⟡\n╭─❍\n➠•"shoticron setinterval <minutes/hours>" - set the timer for video\n╰───────────⟡\n╭─❍\n➠•"shoticron interval" - check the interval\n╰───────────⟡\n╭─❍\n➠•"shoticron status" - check the status off command\n╰───────────⟡\n', threadID);
	},
};

const moment = require('moment-timezone');

const targetTimeZone = 'Asia/Manila';

const now = moment().tz(targetTimeZone);
const currentDate = now.format('YYYY-MM-DD');
const currentDay = now.format('dddd');
const currentTime = now.format('HH:mm:ss');

const shotiAutoState = {};
const shotiAutoInterval = {};
let videoCounter = 0;
let errorVideoCounter = 0;
const startTime = Date.now();
const lastVideoErr
