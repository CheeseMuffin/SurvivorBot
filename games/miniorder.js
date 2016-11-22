'use strict';

const name = "Order";
const description = "A variation of hangman in which the host starts with a single letter. Instead of players guessing letters, the host will start to add more letters. Players have to be the first to guess the complete words to gain points. **Command:** ``" + Config.commandCharacter + "g [answer]``";
const id = Tools.toId(name);
const data = {
	"Pokemon Moves" : [],
	"Pokemon Items" : [],
	"Pokemon Abilities": [],
};

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

class Order extends Games.Minigame {
	constructor(room) {
		super(room);
		this.description = description;
		this.name = name;
		this.id = Tools.toId(name);
		this.answer = null;
		this.categories = Object.keys(data);
		this.locations = [];
		this.category = null;
	}

	onSignups() {
		this.nextRound();
	}

	nextLetter() {
		if (this.locations.length === (this.answer.length - 1)) {
			this.say("All letters have been revealed! The answer was " + this.answer);
			this.end();
			return;
		} else {
			let other = [];
			let realAnswer = this.answer;
			this.answer = Tools.toId(this.answer);
			for (let i = 0; i < this.answer.length; i++) {
				if (this.locations.indexOf(i) === -1) {
					other.push(i);
				}
			}
			let value = Math.floor(Math.random() * other.length);
			this.locations.push(other[value]);
			this.locations.sort(function (a, b) {return a - b;});
			let str = "";
			for (let i = 0; i < this.locations.length; i++) {
				str += this.answer[this.locations[i]];
			}
			this.room.say("**" + str + "**");
			this.answer = realAnswer;
			this.timeout = setTimeout(() => this.nextLetter(), 5 * 1000);
		}
	}

	onNextRound() {
		this.category = this.categories[Math.floor(Math.random() * this.categories.length)];
		let x = Math.floor(Math.random() * data[this.category].length);
		this.answer = data[this.category][x];
		this.locations = [];
		this.say("The chosen category is **" + this.category + "**");
		this.nextLetter();
	}

	guess(guess, user) {
		console.log(this.timeout);
		guess = Tools.toId(guess);
		if (!this.answer || guess !== Tools.toId(this.answer)) return;
		clearTimeout(this.timeout);
		this.say("Correct! " + user.name + " has guessed the answer! (__" + this.answer + "__)");
		this.winUser(25, user);
		this.end();
		return;
	}
}


exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Order;
exports.aliases = [];
exports.minigame = true;