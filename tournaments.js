/**
 * Tournaments
 * BotStuff - https://github.com/CheeseMuffin/BotStuff
 *
 * This file contains info about BotStuff joining Tournaments.
 *
 * @license MIT license
 */

'use strict';

class Tournament {
	constructor(room) {
		this.room = room;
		this.curChallenges = null;
		this.challengedBys = null;
		this.started = false;
	}

	say(message) {
		this.room.say(message);
	}
	handleMessage(splitMessage) {
		console.log(splitMessage);
		switch (splitMessage[0]) {
		case 'create':
			this.say("/tour join");
			break;
		case 'update':
			let updateMes = JSON.parse(splitMessage[1]);
			if (updateMes.challenges) {
				this.curChallenges = updateMes.challenges;
			}
			if (updateMes.challengeBys) {
				this.challengedBys = updateMes.challengeBys;
			}
			if (updateMes.challenged) {
				let name = updateMes.challenged;
				if (this.challengedBys && this.challengedBys.indexOf(name) !== -1) {
					this.say("/tour acceptchallenge");
				}
			}
			break;
		case 'start':
			if (this.curChallenges) {
				this.say("/tour challenge " + this.challengedBys[0]);
			}
		}
	}
}

class Tournaments {
	constructor() {
		this.tourns = {};
	}

	get(id) {
		if (!(id in this.tourns)) return;
		return this.tourns[id];
	}

	handleMessage(splitMessage, room) {
		if (!(room in this.tourns)) {
			this.tourns[room] = new Tournament(room);
		}
		this.tourns[room].handleMessage(splitMessage);
	}
}

module.exports = new Tournaments();