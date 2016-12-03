'use strict';

const name = 'Anagrams';
const id = Tools.toId(name);
const description = 'Players try to guess the scrambled words! **Command:** ``' + Config.commandCharacter + 'g [answer]``';

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

class Anagrams extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.name = name;
		this.description = description;
		this.freeJoin = true;
		this.category = null;
		this.answer = null;
		this.points = new Map();
		this.categories = Object.keys(data);
		this.maxPoints = 5;
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	onNextRound() {
		if (this.answer) {
			this.say("Time's up! The answer was: __" + this.answer + "__");
		}
		this.category = this.categories[Math.floor(Math.random() * this.categories.length)];
		let x = Math.floor(Math.random() * data[this.category].length);
		this.answer = data[this.category][x];
		let chars = [], idAns = Tools.toId(this.answer);
		for (let i = 0, len = idAns.length; i < len; i++) {
			chars.push(idAns.charAt(i));
		}
		chars = Tools.shuffle(chars);
		this.say("**[" + this.category + "]** __" + chars.join(", ") + "__");
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	guess(guess, user) {
		guess = Tools.toId(guess);
		if (!this.answer || guess !== Tools.toId(this.answer)) return;
		clearTimeout(this.timeout);
		if (!(user.id in this.players)) this.addPlayer(user);
		let player = this.players[user.id];
		let points = this.points.get(player) || 0;
		points += 1;
		this.points.set(player, points);
		if (points >= this.maxPoints) {
			this.room.say("Correct! " + user.name + " wins the game! (Answer: __" + this.answer + "__)");
			if (this.round === this.maxPoints) {
				Games.addChieve("Wordmaster", user.name);
			}
			Storage.addPoints(500, player, this.room.id);
			this.end();
			return;
		}
		this.room.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer: __" + this.answer + "__)");
		this.answer = null;
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Anagrams;
exports.aliases = ['anags'];
exports.minigame = false;