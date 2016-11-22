'use strict';

const name = "Inverse Lost Letters!";
const id = Tools.toId(name);
const description = "Players guess the missing letters to find the answers! **Command:** ``" + Config.commandCharacter + "g [answer]``";

const data = {
	"Pokemon Moves" : [],
	"Pokemon Items" : [],
	"Pokemon Abilities": [],
	"Pokemon": [],
};

data["Pokemon Characters"] = Tools.data.characters;
data["Pokemon Locations"] = Tools.data.locations;

for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (!mon.species || mon.num < 1) continue;
	data["Pokemon"].push(mon.species);
}

for (let i in Tools.data.moves) {
	let move = Tools.data.moves[i];
	if (!move.name || !move.desc) continue;
	data["Pokemon Moves"].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name || !item.desc) continue;
	data["Pokemon Items"].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.data.abilities[i];
	if (!ability.name || !ability.desc) continue;
	data["Pokemon Abilities"].push(ability.name);
}

class ILL extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.description = description;
		this.id = id;
		this.freeJoin = true;
		this.answers = null;
		this.points = new Map();
		this.maxPoints = 5;
		this.categories = Object.keys(data);
		this.category = null;
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	isVowel(ch) {
		let vowels = ["a", "e", "i", "o", "u", " "];
		return (vowels.indexOf(Tools.toId(ch)) !== -1);
	}

	convert(str) {
		let newstr = "";
		str = Tools.toId(str);
		for (let i = 0; i < str.length; i++) {
			if (this.isVowel(str.charAt(i))) {
				newstr += str.charAt(i);
			}
		}
		return newstr;
	}
	nextRound() {
		if (this.answers) {
			let answers = this.answers.length;
			this.say("Time's up! The answer" + (answers > 1 ? "s were:" : " was") + " __" + this.answers.join(", ") + "__");
		}
		this.category = "Pokemon";//this.categories[Math.floor(Math.random() * this.categories.length)];
		let x = Math.floor(Math.random() * data[this.category].length);
		let answer = this.convert(data[this.category][x]);
		this.answers = [];
		for (let i = 0; i < data[this.category].length; i++) {
			if (this.convert(data[this.category][i]) === answer) {
				this.answers.push(data[this.category][i]);
			}
		}
		this.say("**[" + this.category + "]**: __" + answer + "__");
		this.timeout = setTimeout(() => this.nextRound(), 20 * 1000);
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
				Games.addChieve("No Blanks", user.name);
			}
			this.winUser(500, player);
			this.end();
			return;
		}
		this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = null;
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}
}

exports.game = ILL;
exports.description = description;
exports.name = name;
exports.id = id;
exports.aliases = ["ill"];