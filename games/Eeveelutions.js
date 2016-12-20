'use strict';

const name =  'Eeveelutions'
const description = "Pick eeveelutions that do stuff.";
const id = Tools.toId(name);

const eevees = {
	eevee: {name: "Eevee", effects: {points: 1}, numDice: 1, roll:100 },
	flareon: {name: "Flareon", effects: {roll: 25, attack: true, targetSelf: true}, numDice: 1, roll:100},
	vaporeon: {name: "Vaporeon", effects: {reroll: 25}, numDice: 1, roll:100},
	jolteon: {name: "Jolteon", numDice: 2, roll: 100},
	espeon: {name: "Espeon", numDice: 1, roll:100, copy: true},
	umbreon: {name: "Umbreon", numDice: 1, roll:100, cancel: true},
	glaceon: {name: "Glaceon", numDice: 1, roll:100, dodge: 20},
	leafeon: {name: "Leafeon", effects: {roll: 25, attack: false, targetSelf: true}, numDice: 1, roll: 100},
	sylveon: {name: "Sylveon", effects: {roll: -25, attack: false, targetSelf: false} },
	
}

class Eeveelutions extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.description = description;
		this.id = id;
		this.eevees = new Map();
	}

	onSignups() {
		this.say("Sorry, but this game is not yet ready.");
		this.end();
		return;
	}
	onStart() {
		this.numPicks = 0;
		this.say("Please pm me your eeveelution in pms! **Command:** ``" + Config.commandCharacter + "choose [eevee]``");
		this.timeout = setTimeout(() => this.askAgain(), 60 * 1000);
	}

	askAgain() {
		let waitings = [];
		for (let userID in this.players) {
			let player = this.players[userID];
			let eevee = this.eevees.get()
		}
	}

	choose(target, user) {
		
	}
}