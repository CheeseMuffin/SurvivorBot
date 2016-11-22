'use strict';

class Battle {
	constructor(room) {
		this.room = room;
		this.myPokemon = [];
		this.num = 0;
		this.moves = [];
		this.oppMon = null;
	}

	say(message) {
		this.room.say(message);
	}

	handleRequest(message) {
		if (message.side) this.myPokemon = message.side.pokemon;
		this.myMon = Math.floor(Math.random() * this.myPokemon.length) + 1;
		let order = [1, 2, 3, 4, 5, 6];
		order[0] = this.myMon;
		order[this.myMon - 1] = 1;
		let mon1 = this.myPokemon[this.myMon - 1];
		for (let thing in mon1) {
			console.log(thing + ":" + mon1[thing]);
		}
		this.moves = mon1.moves;
		this.say("/team " + order.join("") + "|1");
	}

	move(turn) {
		let bestMoveIndex = 0;
		let bestpower = this.effectiveBasePower(this.moves[0]);
		console.log(this.moves[0] + " " + bestpower);
		for (let i = 1; i < this.moves.length; i++) {
			let curEffect = this.effectiveBasePower(this.moves[i]);
			if (curEffect > bestpower) {
				bestpower = curEffect;
				bestMoveIndex = i;
			}
			console.log(this.moves[i] + " " + bestpower + " " + curEffect);
		}
		this.say("/choose move " + (bestMoveIndex + 1) + "| " + (Math.floor(turn) + 1));
	}

	effectiveBasePower(move) {
		let realMove = Tools.data.moves[Tools.toId(move)];
		let realMon = this.myPokemon[this.myMon - 1];
		realMon = Tools.data.pokedex[Tools.toId(realMon.ident.substr(4))];
		let effectiveness = Tools.effectiveness(realMove.id, this.oppMon);
		let basePower = realMove.basePower;
		for (let i = 0; i < realMon.types.length; i++) {
			if (realMove.type === realMon.types[i]) {
				basePower *= 1.5;
				break;
			}
		}
		return basePower * effectiveness;
	}

	handleSwitch(stuff) {
		if (stuff.charAt(1) === '2') {
			this.oppMon = stuff.substr(5);
			console.log(this.oppMon);
		}
	}
}

class Battles {
	constructor() {
		this.battles = {};
	}

	handleRequest(message, room) {
		console.log(room.id);
		if (!(room.id in this.battles)) this.battles[room.id] = new Battle(room);
		this.battles[room.id].handleRequest(message);
	}

	move(room, turn) {
		this.battles[room.id].move(turn);
	}

	handleSwitch(room, stuff) {
		this.battles[room.id].handleSwitch(stuff);
	}
}

module.exports = new Battles();