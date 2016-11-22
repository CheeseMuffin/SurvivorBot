'use strict';

const name = "Pancham's Pairs";
const description = "Players try to pair the given mons according to ``/dexsearch`` parameters! Valid parameters include tier, generation, color, type, and ability. **Command:** ``" + Config.commandCharacter + "pair mon1, mon2, param``";
const id = Tools.toId(name);
const data = {};

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

for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (mon.num < 1) continue;
	let species = mon.species;
	data[species] = {};
	data[species]["type"] = mon.types;
	data[species]["color"] = [mon.color];
	//data[species]["Base Stats"] = mon.base
	data[species]["ability"] = Object.keys(mon.abilities).map(function (key) {
		return mon.abilities[key];
	});
	data[species]["generation"] = [Tools.generation(mon.num)];
	if (Tools.data.battle[i]) {
		data[species]["tier"] = [Tools.data.battle[i].tier];
	}
}
class Pancham extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = Tools.toId(name);
		this.advanced = new Map();
		this.numAdvanced = 0;
		this.mons = null;
		this.description = description;
	}
	onStart() {
		this.nextRound();
	}

	listStuff(numLeft) {
		if (numLeft === 0) {
			this.nextRound();
		} else {
			let players = [];
			for (let userID in this.players) {
				let player = this.players[userID];
				if (!this.advanced.get(player)) {
					players.push(player.name);
				}
			}
			this.room.say("These players still haven't paired! " + players.join(", "));
			this.room.say("**Current Pokemon**: " + this.mons.join(", "));
			this.timeout = setTimeout(() => this.listStuff(numLeft - 1), 15 * 1000);
		}
	}
	onNextRound() {
		if (this.mons) {
			for (let userID in this.players) {
				let player = this.players[userID];
				if (!this.advanced.get(player)) {
					player.say("You didn't pair any pokemon and have been eliminated!");
					delete this.players[userID];
					this.playerCount--;
				}
			}
		}
		if (this.playerCount === 1) {
			this.room.say("**Winner:** " + this.players[Object.keys(this.players)[0]].name);
			this.winUser(500, this.players[Object.keys(this.players)[0]]);
			this.end();
			return;
		} else if (this.playerCount === 0) {
			this.room.say("No winners this game. Better luck next time!");
			this.end();
			return;
		}
		this.numAdvanced = 0;
		this.advanced.clear();
		let shuffled = shuffle(Object.keys(data));
		this.mons = [];
		let i;
		for (i = 1; i < shuffled.length; i++) {
			if (this.isPair(shuffled[0], shuffled[i], false)) {
				this.mons.push(shuffled[0]);
				this.mons.push(shuffled[i]);
				break;
			}
		}
		for (let j = 1; j < 2 * this.playerCount - 2; j++) {
			this.mons.push(shuffled[i + j]);
		}
		this.mons = shuffle(this.mons);
		this.room.say("**Round " + this.round + "**!");
		this.pl();
		this.room.say("**Current Pokemon**: " + this.mons.join(", "));
		this.timeout = setTimeout(() => this.listStuff(3), 15 * 1000);
	}

	isParamPair(mon1, mon2, paramName, isIn) {
		mon1 = Tools.toId(mon1);
		mon2 = Tools.toId(mon2);
		let species1, species2;
		if (Tools.data.pokedex[mon1]) species1 = Tools.data.pokedex[mon1].species;
		if (Tools.data.pokedex[mon2]) species2 = Tools.data.pokedex[mon2].species;
		if (!species1 || !species2 || (isIn && (this.mons.indexOf(species1) === -1 || this.mons.indexOf(species2) === -1))) return false;
		if (!(paramName in data[species1])) return;
		for (let param in data[species1][paramName]) {
			if (data[species2][paramName].indexOf(data[species1][paramName][param]) !== -1) {
				return [species1, species2];
			}
		}
	}
	isPair(mon1, mon2, isIn) {
		mon1 = Tools.toId(mon1);
		mon2 = Tools.toId(mon2);
		let species1, species2;
		if (Tools.data.pokedex[mon1]) species1 = Tools.data.pokedex[mon1].species;
		if (Tools.data.pokedex[mon2]) species2 = Tools.data.pokedex[mon2].species;
		if (!species1 || !species2 || (isIn && (this.mons.indexOf(species1) === -1 || this.mons.indexOf(species2) === -1))) return false;
		for (let paramName in data[species1]) {
			for (let param in data[species1][paramName]) {
				if (data[species2][paramName].indexOf(data[species1][paramName][param]) !== -1) {
					return [species1, species2];
				}
			}
		}
		return false;
	}

	pair(target, user) {
		let player = this.players[user.id];
		if (!player || this.advanced.get(player)) return;
		let commaIndex = target.indexOf(",");
		if (commaIndex === -1) {
			return;
		}
		let mon1 = Tools.toId(target.substr(0, commaIndex));
		let rest = target.substr(commaIndex + 1);
		commaIndex = rest.indexOf(",");
		if (commaIndex === -1) {
			return;
		}
		let mon2 = Tools.toId(rest.substr(0, commaIndex));
		let param = Tools.toId(rest.substr(commaIndex + 1));
		if (param === 'gen') param = 'generation';
		let pair = this.isParamPair(mon1, mon2, param, true);
		if (pair) {
			this.advanced.set(player, true);
			player.say("You have paired " + pair[0] + " and " + pair[1] + " and advanced to the next round!");
			this.mons.splice(this.mons.indexOf(pair[0]), 1);
			this.mons.splice(this.mons.indexOf(pair[1]), 1);
			let hasPair = false;
			this.numAdvanced++;
			if (this.numAdvanced === (this.playerCount - 1)) {
			    clearTimeout(this.timeout);
			    this.nextRound();
			} else {
				for (let i = 0; i < this.mons.length; i++) {
					for (let j = i + 1; j < this.mons.length; j++) {
						if (this.isPair(this.mons[i], this.mons[j], false)) {
							hasPair = true;
						}
					}
				}
				if (!hasPair) {
					this.say("No pairs Left! Moving to next round!");
					clearTimeout(this.timeout);
					this.nextRound();
			    }
			}
		}
	}
}
exports.id = id;
exports.name = name;
exports.description = description;
exports.aliases = ["pairs"];
exports.game = Pancham;