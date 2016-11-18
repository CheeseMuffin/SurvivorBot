'use strict';

const name = 'Hunger Games';
const description = 'Classic but with a twist: No alliances. Game rules: http://survivor-ps.weebly.com/hunger-games.html';
const id = Tools.toId(name);

class HG extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = id;
		this.description = description;
		this.curPlayer = null;
		this.oplayer = null;
	}
	
	onStart() {
		this.nextRound();
	}
	
	onNextRound() {
		this.curPlayer = Object.keys(this.players)[Math.floor(Math.random() * Object.keys(this.players).length];
		this.say(this.curPlayer.name + " you're up! Please choose another player to attack with ``" + Config.commandCharacter + "attack [player]``");
		this.timeout = setTimeout(() => this.handleAttack(), 30 * 1000);
	}
	
	handleAttack() {
			this.say("ayy lmao");
	}
	
	handlehtml(message) {
		let message = message[0];
		console.log(message);
	}
	attack(target, user) {
		if (!this.curPlayer) return;
		if (this.curPlayer.name !== user.name) return;
		let otherUser = Users.get(target);
		if (!otherUser) return;
		let oplayer = this.players[otherUser.id];
		if (!oplayer) return;
		this.say("**" + this.curPlayer.name + "** has chosen to attack **" + oplayer.name + "**!");
		clearTimeout(this.timeout);
		this.oplayer = oplayer;
		this.timeout = setTimeout(() => this.handleAttack(), 5 * 1000);
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = HG;
exports.aliases = [""];