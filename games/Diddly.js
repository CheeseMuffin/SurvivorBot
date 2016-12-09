'use strict';

const name = 'Diddly Dice';
const description = 'Stuff happens with bidding. **Command:** ``' + Config.commandCharacter + 'bid [number]``';
const id = Tools.toId(name);

class Diddly extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.description = description;
		this.id = id;
		this.freeJoin = false;
	}

	onStart() {
		this.nextRound();
	}

	onNextRound() {
		if (this.getRemainingPlayerCount() === 1) {
			let remainingPlayers = this.getRemainingPlayers();
			let player = remainingPlayers[Object.keys(remainingPlayers)[0]];
			this.say("**Winner**: " + player.name);
			Storage.addPoints(500, player, this.room.id);
			this.end();
			return;
		}
		this.bestPlayer = null;
		this.bestBid = -1;
		this.canBid = true;
		this.pl();
		this.say("Please bid between 1 and 100 in the chat! You have 30 seconds.");
		this.timeout = setTimeout(() => this.bids(), 30 * 1000);
	}

	bids() {
		this.canBid = false;
		this.say("Good luck to **" + this.bestPlayer.name + "** with a bid of " + this.bestBid + ".");
		this.timeout = setTimeout(() => this.doRoll(), 5 * 1000);
	}

	doRoll() {
		let num = Math.floor(Math.random() * 100) + 1;
		if (num >= this.bestBid) {
			this.say("The randomly chosen number is " + num + "! GG **" + this.bestPlayer.name + "**!");
			Storage.addPoints(500, this.bestPlayer, this.room.id);
			this.end();
			return;
		} else {
			this.say("The randomly chosen number is " + num + "! RIP **" + this.bestPlayer.name + "**.");
			this.players[this.bestPlayer.id].eliminated = true;
			this.nextRound();
		}
	}
	bid(target, user) {
		console.log("hi");
		if (!this.canBid) return;
		target = parseInt(target);
		let player = this.players[user.id];
		if (!target || !player || player.eliminated || target < 1 || target > 100) {
			return;
		}
		if (target > this.bestBid) {
			this.bestBid = target;
			this.bestPlayer = player;
		}
	}
}

exports.game = Diddly;
exports.name = name;
exports.description = description;
exports.id = id;
exports.aliases = ['dd'];