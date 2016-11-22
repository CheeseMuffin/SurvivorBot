'use strict';

const data = {
	"Pokemon Move" : [],
	"Pokemon Item" : [],
	"Pokemon Ability": [],
	"Pokemon": [],
};

data["Pokemon Character"] = Tools.data.characters;
data["Pokemon Location"] = Tools.data.locations;

for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (!mon.species || mon.num < 1) continue;
	data["Pokemon"].push(mon.species);
}
for (let i in Tools.data.moves) {
	let move = Tools.data.moves[i];
	if (!move.name) continue;
	data["Pokemon Move"].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name) continue;
	data["Pokemon Item"].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.data.abilities[i];
	if (!ability.name) continue;
	data["Pokemon Ability"].push(ability.name);
}

const name = "Piplup's Placements";
const id = Tools.toId(name);
const description = "The host will show you a topic and 3 letters. You must find something of that topic that contains those letters side by side, in the order given. **Command:** ``" + Config.commandCharacter + "g [answer]``";

class LetterFinder extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.name = name;
		this.description = description;
		this.freeJoin = true;
		this.answers = [];
		this.curAnswer = null;
		this.points = new Map();
		this.categories = Object.keys(data);
		this.maxPoints = 5;
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	isGood(cur) {
		cur = Tools.toId(cur);
		for (let i = 0; i < cur.length; i++) {
			if (cur.substr(i, 3) === this.curAnswer) {
				return true;
			}
		}
		return false;
	}
	onNextRound() {
		if (this.answers.length > 0) {
			let answers = this.answers.length;
			this.say("Time's up! The answer" + (answers > 1 ? "s were" : " was") + " __" + this.answers.join(", ") + "__");
		}
		this.answers = [];
		this.category = this.categories[Math.floor(Math.random() * this.categories.length)];
		let curThing = Tools.toId(data[this.category][Math.floor(Math.random() * data[this.category].length)]);
		let curLetter = Math.floor(Math.random() * (curThing.length - 2));
		this.curAnswer = curThing.substr(curLetter, 3);
		for (let i = 0; i < data[this.category].length; i++) {
			let cur = data[this.category][i];
			if (this.isGood(cur)) this.answers.push(cur);
		}
		this.say("Find a **" + this.category + "** with the letters **" + this.curAnswer.toUpperCase() + "** in order!");
		this.timeout = setTimeout(() => this.nextRound(), 15 * 1000);
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
			if (this.round === this.maxPoints) {
				this.addChieve("Letter Professional", user.name);
			}
			this.winUser(500, player);
			this.end();
			return;
		}
		this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = [];
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}
}

exports.game = LetterFinder;
exports.name = name;
exports.id = id;
exports.description = description;
exports.aliases = ['plp'];