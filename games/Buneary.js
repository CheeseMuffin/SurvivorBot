'use strict';

const name = 'Buneary\'s Bountiful Buffet';
const id = Tools.toId(name);
const description = 'Players try and choose the tables for maximum points, but tables picked by multiple people are shared! **Command:** ``' + Config.commandCharacter + 'choose [table]`` (in pms)';

const data = ["Chansey Eggs",
			  "Slowpoke Tails",
			  "Tropius Fruit",
			  "Moomoo Milk",
			  "Combee Honey",
			  "Shuckle Juice",
			  "Farfetch'd Breast",
			  "Cooked Magikarp",
			  "Octillery Tentacle",
			  "Basculin Fillet",
			  "Cherubi Balls"];

const acronyms = {"ce": "Chansey Eggs",
				  "st": "Slowpoke Tails",
				  "tf": "Tropius Fruit",
				  "mo": "Moomoo Milk",
				  "ch": "Combee Honey",
				  "sj": "Shuckle Juice",
				  "fb": "Farfetch'd Breast",
				  "cm": "Cooked Magikarp",
				  "ot": "Octillery Tentacle",
				  "bf": "Basculin Fillet",
				  "cb": "Cherubi Balls"};
class Buneary extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = id;
		this.description = description;
		this.tables = null;
		this.guesses = new Map();
		this.points = new Map();
	}

	onStart() {
		this.nextRound();
	}

	onNextRound() {
		if (this.tables) {
			let counts = [];
			for (let i = 0; i < this.numTables; i++) {
				counts.push(0);
			}
			for (let userID in this.players) {
				let index = this.guesses.get(this.players[userID]);
				if (!index && index !== 0) continue;
				counts[index]++;
			}
			for (let userID in this.players) {
				let player = this.players[userID];
				let index = this.guesses.get(player);
				if (!index && index !== 0) {
					player.say("You didn't choose a table this round!");
				} else {
					let points = this.points.get(player) || 0;
					let earnedPoints = Math.floor(this.tables[index] / counts[index]);
					player.say("You earned " + earnedPoints + " points this round!");
					this.points.set(player, points + earnedPoints);
				}
			}
		}
		if (this.round === 6) {
			this.say("The buffet has ended! Now calculating scores...");
			let maxPoints = -1;
			let bestPlayer = null;
			for (let userID in this.players) {
				let player = this.players[userID];
				let points = this.points.get(player);
				if (!points) continue;
				if (points > maxPoints) {
					maxPoints = points;
					bestPlayer = player;
				}
			}
			if (!bestPlayer) {
				this.say("Noone earned any points this game");
			} else {
				this.say("The winner is **" + bestPlayer.name + "** with " + maxPoints + " points!");
				this.winUser(500, bestPlayer);
			}
			this.end();
			return;
		}
		this.guesses.clear();
		this.tables = [];
		this.meals = Tools.shuffle(data);
		let strs = [];
		this.numTables = Math.ceil(this.playerCount) / 3;
		for (let i = 0; i < this.numTables; i++) {
			let num1 = Math.floor(Math.random() * 99) + 1;
			let num2 = Math.floor(Math.random() * 99) + 1;
			this.tables.push(num1 + num2);
			strs.push("**" + this.meals[i] + "**: " + this.tables[i]);
		}
		this.say("**Round " + this.round + "!** Current Tables: " + strs.join(", "));
		this.timeout = setTimeout(() => this.nextRound(), 30 * 1000);
	}

	choose(user, target) {
		let userID = user.id;
		let player = this.players[userID];
		if (!player || this.guesses.get(player) || this.guesses.get(player) > -1) return;
		let index;
		if (Tools.toId(target) in acronyms) {
			target = acronyms[target];
		}
		for (index = 0; index < this.numTables; index++) {
			if (Tools.toId(target) === Tools.toId(this.meals[index])) {
				break;
			}
		}
		if (index === this.numTables) return;
		this.guesses.set(player, index);
		console.log(index);
		player.say("You have chosen the **" + this.meals[index] + "** table!");
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Buneary;
exports.aliases = ['bbb'];