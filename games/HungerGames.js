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
		this.rolla = null;
		this.rollb = null;
	}
	
	onStart() {
		this.nextRound();
	}
	
	onNextRound() {
		this.oplayer = null;
		this.rolla = null;
		this.rollb = null;
		if (this.playerCount === 1) {
			this.say("**Winner:** " + this.players[Object.keys(this.players)[0]].name);
			this.end();
			return;
		}
		else if (this.playerCount === 2) {
			this.curPlayer = this.players[Object.keys(this.players)[0]];
			this.oplayer = this.players[Object.keys(this.players)[1]];
			this.say("Only **" + this.curPlayer.name + "** and **" + this.oplayer.name + "** are left! Moving directly to attacks.");
			this.timeout = setTimeout(() => this.handleAttack(), 5 * 1000);
		}
		else {
			let names = [];
			for (let userID in this.players) {
				names.push(this.players[userID].name);
			}
			this.say("!pick " + names.join(", "));
			//this.curPlayer = this.players[Object.keys(this.players)[Math.floor(Math.random() * Object.keys(this.players).length)]];
			//this.say("**" + this.curPlayer.name + "** you're up! Please choose another player to attack with ``" + Config.commandCharacter + "attack [player]``");
			
			//this.timeout = setTimeout(() => this.handleAttack(), 90 * 1000);
		}
	}
	
	handleAttack() {
		if (!this.oplayer) {
			this.say("**" + this.curPlayer.name + "** didn't choose a player and is eliminated!");
			delete this.players[this.curPlayer.id];
			this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
		}
		else {
			/*let rolla = 0; 
			let rollb = 0;
			while (rolla === rollb) {
				rolla = Math.floor(Math.random() * 100) + 1;
				rollb = Math.floor(Math.random() * 100) + 1;
			}
			this.say("**" + this.curPlayer.name + "** rolls a " + rolla + "!");
			this.say("**" + this.oplayer.name + "** rolls a " + rollb + "!");
			if (rolla < rollb) {
				this.say("**" + this.oplayer.name + "** beats up **" + this.curPlayer.name + "**!");
				delete this.players[this.curPlayer.id];
			}
			else {
				this.say("**" + this.curPlayer.name + "** beats up **" + this.oplayer.name + "**!");
				delete this.players[this.oplayer.id];
			}
			this.playerCount--;
			this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);*/
			this.say("!roll 100");
			this.say("!roll 100");
			
		}
	}
	
	handleRoll(message) {
		let colonIndex = message.indexOf(":");
		console.log("ayyyyyyy");
		message = message.substr(colonIndex+2);
		message = message.substr(0,message.length-6);
		console.log(Math.floor(message));
		if (!this.rolla) this.rolla = Math.floor(message);
		else if (!this.rollb) {
			this.rollb = Math.floor(message);
			if (this.rolla !== this.rollb) {
				if (this.rolla < this.rollb) {
					this.say("**" + this.oplayer.name + "** beats up **" + this.curPlayer.name + "**!");
					delete this.players[this.curPlayer.id];
				}
				else if (this.rolla > this.rollb) {
					this.say("**" + this.curPlayer.name + "** beats up **" + this.oplayer.name + "**!");
					delete this.players[this.oplayer.id];
				}
				this.playerCount--;
				this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
			}
			else {
				this.say("The rolls were the same! rerolling...");
				this.rolla = null;
				this.rollb = null;
				this.handleAttack();
			}
		}
	}
	
	handlePick(message) {
		let colonIndex = message.indexOf(":");
		message = message.substr(colonIndex+7);
		message = message.substr(0,message.length-6);
		console.log(message);
		if (!this.curPlayer) {
			this.curPlayer = this.players[Tools.toId(message)];
			this.say("**" + this.curPlayer.name + "** you're up! Please choose another player to attack with ``" + Config.commandCharacter + "attack [player]``");
			
		}
	}
	handlehtml(message) {
		
		message = message[0];
		message = message.substr(21);
		console.log(message);
		if (message.substr(0,4) === "Roll") {
			this.handleRoll(message);
		}
		else {
			
			console.log(message.substr(0,4) + "!Roll");
			this.handlePick(message);
		}
		
		
	}
	attack(target, user) {
		if (!this.curPlayer) return;
		if (this.curPlayer.name !== user.name) return;
		let otherUser = Users.get(target);
		if (!otherUser) return;
		let oplayer = this.players[otherUser.id];
		if (!oplayer) return;
		if (oplayer.name === this.curPlayer.name) {
			this.say("Are you really sure you want to attack yourself?");
			return;
		}
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
exports.aliases = ["hg"];