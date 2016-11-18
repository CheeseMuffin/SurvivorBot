'use strict';

const name = "Ponyta's Pinata Party";
const id = Tools.toId(name);
const description = "Players try to hit the pinata before it explodes! **Command:** ``" + Config.commandCharacter + "hit``";

class Ponyta extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.name = name;
		this.description = description;
		this.points = new Map();
		this.freeJoin = true;
		this.num = 0;
		this.guessed = new Map();
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	onNextRound() {
		if (this.round === 21) {
			this.say("All Piñatas have been broken!");
			this.end();
			return;
		}
		this.guessed.clear();
		this.num = 0;
		this.say("**Round " + this.round + "!** ");
		this.say("The Piñata has appeared!");
		let num1 = Math.floor(Math.random() * 6) + 1;
		let num2 = Math.floor(Math.random() * 6) + 1;
		this.timeout = setTimeout(() => this.explodePinata(), (num1 + num2) * 1000);
	}

	explodePinata() {
		this.say("The Piñata broke!");
		if (this.num === 0) {
			this.say("Nobody hit the Piñata this round!");
		} else {
			for (let userID in this.players) {
				let player = this.players[userID];
				let guessNum = this.guessed.get(player);
				if (!guessNum) continue;
				let points = this.points.get(player) || 0;
				this.points.set(player, points + guessNum / this.num);
				player.say("You earned " + Math.floor(50 * guessNum / this.num) + " bits this round!");
			}
		}
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}

	hit(target, user) {
		if (!(user.id in this.players)) this.addPlayer(user);
		let player = this.players[user.id];
		let guess = this.guessed.get(player);
		if (guess) return;
		this.guessed.set(player, this.num + 1);
		this.num++;
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Ponyta;
exports.aliases = ["ppp"];