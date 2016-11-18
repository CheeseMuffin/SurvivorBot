'use strict';

const name = 'Excluded';
const description = 'Excluded! Players try to guess pokemon that aren\'t excluded by the parameter. **Commands:** ``' + Config.commandCharacter + 'exclude [pokemon]``, ``' + Config.commandCharacter + 'ge [param]``';
const id = Tools.toId(name);
const data = {};
const monForms = {};

const generations = [151, 251, 386, 493, 649, 721];

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

function generation(dexNum) {
	let i, len = generations.length;
	for (i = 0; i < len; i++) {
		if (generations[i] >= dexNum) {
			break;
		}
	}
	return i + 1;
}

for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (mon.num < 1) continue;
	let species = mon.species;
	data[species] = {};
	data[species]["type"] = mon.types;
	/*for (let i = 0, len = mon.types.length; i < len; i++) {
		if (data["Types"].indexOf(mon.types[i]) === -1) {
			data["Types"].push(mon.types[i]);
		}
	}*/
	data[species]["color"] = [mon.color];
	//data[species]["Base Stats"] = mon.base
	/*data[species]["ability"] = Object.keys(mon.abilities).map(function (key) {
		return mon.abilities[key];
	});*/
	if (mon.otherFormes) {
		for (let i = 0, len = mon.otherFormes.length; i < len; i++) {
			monForms[mon.otherFormes[i]] = species;
		}
	}
	data[species]["Pokemon Moves"] = [];
	if (i in Tools.data.learnsets) {
		for (let move in Tools.data.learnsets[i].learnset) {
			data[species]["Pokemon Moves"].push(Tools.data.moves[move].name);
		}
	}
	if (i in monForms) {
		data[species]["Pokemon Moves"].push.apply(data[species]["Pokemon Moves"], data[monForms[i]]["Pokemon Moves"]);
	}
	data[species]["generation"] = [generation(mon.num)];
	if (Tools.data.battle[i]) {
		data[species]["tier"] = [Tools.data.battle[i].tier];
	}
}

class Excluded extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.description = description;
		this.name = name;
		this.param = null;
		this.category = null;
		this.curPlayer = null;
		this.order = [];
		this.guessedMons = [];
	}

	isValid(move) {
		let count = 0;
		for (let species in data) {
			if (species in monForms) continue;
			let moves = data[species]["Pokemon Moves"];
			if (moves.indexOf(move) !== -1) {
				count++;
			}
		}
		return count >= 30 && count <= 508;
	}
	onStart() {
		this.say("Now choosing a parameter...");
		let valid = false;
		while (!valid) {
			let keys = Object.keys(data);
			let mon = keys[Math.floor(Math.random() * keys.length)];
			console.log(mon);
			this.category = Object.keys(data[mon])[Math.floor(Math.random() * Object.keys(data[mon]).length)];
			console.log(this.category);
			this.param = data[mon][this.category][Math.floor(Math.random() * data[mon][this.category].length)];
			if (this.category === "Pokemon Moves") {
				valid = this.isValid(this.param);
			} else {
				valid = true;
			}
		}
		console.log(this.param);
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}

	onNextRound() {
		if (this.playerCount === 0) {
			this.say("All players have been eliminated! The parameter was: __" + this.param + "__");
			this.end();
			return;
		}
		this.curPlayer = null;
		this.order = shuffle(Object.keys(this.players));
		this.say("**Round " + this.round + "**!");
		this.guessed = true;
		this.timeout = setTimeout(() => this.nextPlayer(), 5 * 1000);
	}

	nextPlayer() {
		if (!this.guessed) {
			this.curPlayer.say("You didn't try to exclude a pokemon!");
			delete this.players[this.curPlayer.id];
			this.playerCount--;
		}
		if (this.order.length === 0) {
			this.nextRound();
		} else {
			let curID = this.order[0];
			this.curPlayer = this.players[curID];
			this.order.splice(0, 1);
			this.guessed = false;
			this.say("It is now " + this.curPlayer.name + "'s turn to exclude a pokemon!");
			this.timeout = setTimeout(() => this.nextPlayer(), 15 * 1000);
		}
	}

	exclude(target, user) {
		let player = this.players[user.id];
		if (!player || !this.curPlayer || player.id !== this.curPlayer.id) return;
		target = Tools.toId(target);
		let realmon = Tools.data.pokedex[target];
		if (!realmon) return;
		let species = realmon.species;
		if (this.guessedMons.indexOf(species) !== -1 || (Tools.toId(species) in monForms)) return;
		this.guessedMons.push(species);
		if (data[species][this.category].indexOf(this.param) === -1) {
			this.say(species + " was **NOT** Excluded!");
		} else {
			this.say(species + " was Excluded! " + player.name + " has been eliminated");
			delete this.players[user.id];
			this.playerCount--;
		}
		clearTimeout(this.timeout);
		this.guessed = true;
		this.nextPlayer();
	}

	ge(target, user) {
		let player = this.players[user.id];
		if (!player || !this.curPlayer || player.id !== this.curPlayer.id) return;
		this.guessed = true;
		if (Tools.toId(target) === Tools.toId(this.param)) {
			this.say(player.name + " has guessed the correct parameter (__" + this.param + "__) and won the game!");
			clearTimeout(this.timeout);
			this.timeout = null;
			this.end();
			return;
		} else {
			this.say(user.name + " has guessed an incorrect param and has been eliminated!");
			delete this.players[user.id];
			clearTimeout(this.timeout);
			this.nextPlayer();
		}
	}
}

exports.id = id;
exports.name = name;
exports.description = description;
exports.game = Excluded;
exports.aliases = ['exclusions', 'exclude'];
