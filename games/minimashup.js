'use strict';

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

const name = "Mashup";
const id = Tools.toId(name);
const description = "Players unscramble the combined names of two Pokemon. **Command**: ``" + Config.commandCharacter + "g [mon1], [mon2]``";
const data = [];
for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (!mon.species || mon.num < 1) continue;
	data.push(mon.species);
}

class Mashup extends Games.Minigame {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = Tools.toId(name);
		this.answers = null;
		this.points = new Map();
		this.maxPoints = 5;
		this.freeJoin = true;
		this.description = description;
	}

	onSignups() {
		this.nextRound();
	}

	onNextRound() {
		if (this.answers) {
			this.room.say("Times up! The answer was: __" + this.answers.join(" and ") + "__");
			this.end();
			return;
		}
		let newDat = shuffle(data);
		this.answers = [newDat[0], newDat[1]];
		let mon1 = newDat[0];
		let mon2 = newDat[1];
		let index1 = 0, index2 = 0, str = "";
		while (index1 < mon1.length && index2 < mon2.length) {
			if (Math.random() < 0.5) {
				str += mon1[index1];
				index1++;
			} else {
				str += mon2[index2];
				index2++;
			}
		}
		while (index1 < mon1.length) {
			str += mon1[index1];
			index1++;
		}
		while (index2 < mon2.length) {
			str += mon2[index2];
			index2++;
		}
		this.room.say("**" + Tools.toId(str) + "**");
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	correct(target) {
		let commaIndex = target.indexOf(",");
		if (commaIndex === -1) return false;
		let mon1 = Tools.toId(target.substr(0, commaIndex));
		let mon2 = Tools.toId(target.substr(commaIndex + 1));
		if ((mon1 === Tools.toId(this.answers[0]) && mon2 === Tools.toId(this.answers[1])) || (mon1 === Tools.toId(this.answers[1]) && mon2 === Tools.toId(this.answers[0]))) return true;
		return false;
	}
	guess(target, user) {
		if (!this.answers || !this.correct(target)) return;
		clearTimeout(this.timeout);
		this.say("Correct! " + user.name + " has guessed the answer! (Answer: __" + this.answers.join(" and ") + "__)");
		this.winUser(25, user);
		this.end();
		return;
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Mashup;
exports.aliases = [];
exports.minigame = true;