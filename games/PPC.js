/**
 * Example game
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains example code for a game (Trivia)
 *
 * @license MIT license
 */

'use strict';

const name = "Politoed's Port Chain";
const id = Tools.toId(name);
const description = "Guess a Pokemon that shares 2 - 4 letters with the beginning or end of the given Pokemon. **Command:** ``" + Config.commandCharacter + "g [mon]``";
const data = {};

function isPort(mon1, mon2) {
	for (let i = 2; i < Math.min(mon1.length, mon2.length, 5); i++) {
		if (mon1.slice(0, i) === mon2.slice(mon2.length - i) || mon1.slice(mon1.length - i) === mon2.slice(0, i)) {
			return true;
		}
	}
	return false;
}

//console.log(isPort("corsola", "lapras"));
for (let i in Tools.data.pokedex) {
	let mon1 = Tools.data.pokedex[i];
	if (!mon1.species || mon1.num < 1) continue;
	data[mon1.species] = [];
	for (let j in Tools.data.pokedex) {
		let mon2 = Tools.data.pokedex[j];
		if (!mon2.species || mon2.num < 1) continue;
		if (i !== j && isPort(i, j)) {
			data[mon1.species].push(mon2.species);
		}
	}
}

class PPC extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = id;
		this.description = description;
		this.freeJoin = false;
		this.answers = null;
		this.categories = Object.keys(data);
		this.questions = [];
		this.curPlayer = null;
		this.guessed = false;
		this.currentMon = null;
		this.curUsed = [];
	}

	onStart() {
		this.nextRound();
	}

	valid() {
		for (let i = 0; i < data[this.curMon].length; i++) {
			let j;
			for (j = 0; j < this.curUsed.length; j++) {
				if (Tools.toId(this.curUsed[j]) === Tools.toId(data[this.curMon][i])) {
					break;
				}
			}
			if (j === this.curUsed.length) return true;
		}
		return false;
	}
	chooseMon() {
		let found = true;
		while (found) {
			this.curMon = Object.keys(data)[Math.floor(Math.random() * Object.keys(data).length)];
			console.log(this.curMon);
			if (this.valid()) found = false;
		}
	}

	onNextRound() {
		if (this.playerCount === 1) {
			this.say("**Winner:** " + this.players[Object.keys(this.players)[0]].name);
			this.winUser(500, this.players[Object.keys(this.players)[0]]);
			this.end();
			return;
		} else if (this.playerCount === 0) {
			this.say("No winners this game. Better luck next time!");
			this.end();
			return;
		} else if (this.round === 21) {
			let goodNames = [];
			for (let userID in this.players) {
				goodNames.push(this.players[userID].name);
			}
			this.say("**Winner" + (goodNames.length > 1 ? "s" : "") + ":** " + goodNames.join(", "));
		}
		this.guessed = true;
		this.curPlayer = null;
		this.chooseMon();
		//this.curMon = "Axew";
		this.order = Tools.shuffle(Object.keys(this.players));
		this.say("**Round " + this.round + "**!");
		this.pl();
		this.curUsed = [Tools.toId(this.curMon)];
		this.timeout = setTimeout(() => this.nextPlayer(), 5 * 1000);
	}

	nextPlayer() {
		if (!this.guessed) {
			this.say("Times up!");
			delete this.players[this.curPlayer.id];
			this.playerCount--;
		}
		if (this.order.length === 0) {
			this.nextRound();
		} else {
			let userID = this.order[0];
			this.curPlayer = this.players[userID];
			this.order.splice(0, 1);
			this.guessed = false;
			console.log(data[this.curMon]);
			console.log(this.curUsed);
			if (!this.valid()) {
				this.chooseMon();
				this.say("No mons left! **" + this.curPlayer.name + "** you're up! The Politoed randomly chose " + this.curMon);
			} else {
				this.say("**" + this.curPlayer.name + "** you're up! The Politoed spelled out " + this.curMon);
			}
			this.timeout = setTimeout(() => this.nextPlayer(), (10 - this.round / 20) * 1000);
		}
	}

	guess(guess, user) {
		if (!this.curPlayer) return;
		let player = this.players[user.id];
		if (!player || player.id !== this.curPlayer.id) return;
		guess = Tools.toId(guess);
		if (this.curUsed.indexOf(guess) !== -1) return;
		if (isPort(guess, Tools.toId(this.curMon))) {
			this.curMon = Tools.data.pokedex[guess].species;
			this.guessed = true;
			this.curUsed.push(guess);
			clearTimeout(this.timeout);
			this.nextPlayer();
		}
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = PPC;
exports.aliases = ['ppc'];