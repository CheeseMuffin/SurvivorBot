'use strict';

const name = "50 Mareep";
const description = "Players try to shepherd back the sheep! **Command:** ``" + Config.commandCharacter + "pick [station]``";
const id = Tools.toId(name);

function shuffle(array) {
	let currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

class Sheep extends Games.Game {
	constructor(room) {
		super(room);
		this.description = description;
		this.name = name;
		this.id = Tools.toId(name);
		this.stations = [];
		this.order = [];
		this.curPlayer = null;
		this.numStations = 0;
		this.points = new Map();
		this.sheepLeft = 50;
		this.guessed = true;
	}

	onStart() {
		this.room.say("Now randomizing sheep...");
		this.numStations = 2 * this.playerCount;
		let sheepLeft = 50;
		for (let i = 0; i < this.numStations; i++) {
			if (sheepLeft === 0) {
				this.stations.push(0);
			}
			let cur = Math.floor(sheepLeft / (this.numStations - i) + 2 - Math.random() * 4);
			cur = Math.min(cur, sheepLeft);
			this.stations.push(cur);
			sheepLeft -= cur;
		}
		if (sheepLeft !== 0) this.stations[0] += sheepLeft;
		this.stations = shuffle(this.stations);
		for (let i = 0; i < this.stations.length; i++) {
			console.log(this.stations[i]);
		}
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}

	onNextRound() {
		if (this.round === 3) {
			this.say("Everyone has had a chance to pick their stations! Now pming results...");
			let max = -1;
			let bestID = [];
			for (let userID in this.players) {
				let player = this.players[userID];
				let points = this.points.get(player) || 0;
				player.say("You collected " + points + " sheep!");
				if (points > max) {
					bestID = [player.name];
				} else if (points === max) {
					bestID.push(player.name);
				}
			}
			this.say("The winner" + (bestID.length === 1 ? " is " : "s are ") + bestID.join(", "));
			clearTimeout(this.timeout);
			this.timeout = null;
			this.end();
			return;
		} else {
			this.guessed = true;
			this.order = shuffle(Object.keys(this.players));
			this.say("**Round " + this.round + "**!");
			this.nextPlayer();
		}
	}

	nextPlayer() {
		if (!this.guessed) {
			console.log("rip");
			this.curPlayer.say("You didn't choose a station!");
		}
		if (this.order.length === 0) {
			console.log("ok...");
			this.nextRound();
		} else {
			let curID = this.order[0];
			this.curPlayer = this.players[curID];
			this.order.splice(0, 1);
			this.say("It is now " + this.curPlayer.name + "'s turn to choose a station!");
			this.timeout = setTimeout(() => this.nextPlayer(), 15 * 1000);
		}
	}

	pick(target, user) {
		let player = this.players[user.id];
		if (!player || player.id !== this.curPlayer.id) return;
		let stat = Math.floor(target);
		if (!stat || stat < 1 || stat > this.numStations) {
			user.say("Invalid station");
		} else {
			stat--;
			if (this.stations[stat] === 0) {
				user.say("Sorry, there doesn't appear to be any sheep here...");
			} else {
				user.say("You have found " + this.stations[stat] + " sheep!");
				let points = this.points.get(player) || 0;
				this.points.set(player, points + this.stations[stat]);
				this.sheepLeft -= this.stations[stat];
				this.stations[stat] = 0;
			}
			this.guessed = true;
			clearTimeout(this.timeout);
			this.timeout = null;
			this.nextPlayer();
		}
	}
}

exports.id = id;
exports.name = name;
exports.description = description;
exports.game = Sheep;
exports.aliases = ["sheep"];