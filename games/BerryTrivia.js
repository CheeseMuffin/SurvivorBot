/**
 * Example game
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains example code for a game (Trivia)
 *
 * @license MIT license
 */

'use strict';

const name = "Berry Trivia";
const description = "Guess berries based on the given descriptions. **Command:** ``" + Config.commandCharacter + "g [answer]``";
const id = Tools.toId(name);
const data = {
	"Pokemon Items": {},
};

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name || !item.desc || !item.isBerry) continue;
	if (!(item.desc in data["Pokemon Items"])) data["Pokemon Items"][item.desc] = [];
	data["Pokemon Items"][item.desc].push(item.name);
}

class BerryTrivia extends Games.Game {
	constructor(room) {
		super(room);
		this.description = description;
		this.name = name;
		this.id = Tools.toId(name);
		this.answers = null;
		this.points = new Map();
		this.maxPoints = 5;
		this.categories = Object.keys(data);
		this.questions = [];
		for (let i = 0, len = this.categories.length; i < len; i++) {
			this.questions[this.categories[i]] = Object.keys(data[this.categories[i]]);
		}
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	nextRound() {
		if (this.answers) {
			let answers = this.answers.length;
			this.say("Time's up! The answer" + (answers > 1 ? "s were" : " was") + " __" + this.answers.join(", ") + "__");
		}
		let category = this.categories[Math.floor(Math.random() * this.categories.length)];
		let question = this.questions[category][Math.floor(Math.random() * this.questions[category].length)];
		this.answers = data[category][question];
		this.say("**" + category + "**: " + question);
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	guess(guess, user) {
		if (!this.answers) return;
		guess = Tools.toId(guess);
		let correct = false;
		for (let i = 0, len = this.answers.length; i < len; i++) {
			if (Tools.toId(this.answers[i]) === guess) {
				correct = true;
				break;
			}
		}
		if (!correct) return;
		clearTimeout(this.timeout);
		if (!(user.id in this.players)) this.addPlayer(user);
		let player = this.players[user.id];
		let points = this.points.get(player) || 0;
		points += 1;
		this.points.set(player, points);
		if (points >= this.maxPoints) {
			this.say("Correct! " + user.name + " wins the game! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.winUser(500,player);
			this.end();
			return;
		}
		this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = null;
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = BerryTrivia;
exports.aliases = [];