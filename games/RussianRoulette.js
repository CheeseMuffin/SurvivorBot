'use strict';

const name = "Russian Roulette";
const description = "Players bet";
const id = Tools.toId(name);

class RussianRoulette extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.description = description;
		this.id = id;
		this.points = new Map();
	}

	onStart() {
		this.nextRound();
	}

	onNextRound() {
		if (this.getRemainingPlayerCount() === 0) {
			this.say("Everyone was eliminated! Better luck next time.");
			this.end();
			return;
		}
		this.order = this.getRandomOrdering();
		let strs = [];
		for (let i = 0; i < this.order.length; i++) {
			let player = this.order[i];
			let points = this.points.get(player) || 0;
			strs.push(player.name + (points > 0 ? "(" + points + ")" : ""));
		}
		this.say("**Players (" + this.getRemainingPlayerCount() + "):** " + strs.join(", "));
		this.nextPlayer();
	}

	nextPlayer() {
		if (this.canBid) {
			this.say(this.curPlayer.name + " didn't bid and is eliminated!");
		}
		if (this.order.length === 0) {
			this.nextRound();
		} else {
			this.curPlayer = this.order[0];
			this.order.splice(0, 1);
			this.canBid = true;
			this.say(this.curPlayer.name + " you're up! Please bid a number between 1 and 6.");
			this.timeout = setTimeout(() => this.nextPlayer(), 30 * 1000);
		}
	}

	bid(target, user) {
		if (!this.canBid) return;
		let player = this.players[user.id];
		if (!player || player !== this.curPlayer) return;
		let bid = Math.floor(target);
		if (bid < 1 || bid > 6) return;
		this.canBid = false;
		let num = Math.floor(Math.random() * 7) + 1;
		clearTimeout(this.timeout);
		if (num <= bid) {
			this.say("The randomly chosen number is " + num + "! RIP " + this.curPlayer.name + ".");
			this.curPlayer.eliminated = true;
			this.timeout = setTimeout(() => this.nextPlayer(), 5 * 1000);
		} else {
			let points = this.points.get(this.curPlayer) || 0;
			points += bid;
			if (points >= 15) {
				this.say("The randomly chosen number is " + num + "! " + this.curPlayer.name + " has reached 15 points and wins!");
				Storage.addPoints(500, this.curPlayer, this.room.id);
				this.end();
				return;
			} else {
				this.say("The randomly chosen number is " + num + "! " + this.curPlayer.name + " advances to " + points + " points.");
				this.points.set(this.curPlayer, points);
				this.timeout = setTimeout(() => this.nextPlayer(), 5 * 1000);
			}
		}
	}
}

exports.game = RussianRoulette;
exports.name = name;
exports.description = description;
exports.id = id;
exports.aliases = ["rr"];