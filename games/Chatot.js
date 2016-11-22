'use strict';

const name = "Chatot's Musical Chairs!";
const description = "Players try to sit in chairs after the music stops! **Command:** ``" + Config.commandCharacter + "sit [chair]``";
const id = Tools.toId(name);

class Chatot extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = Tools.toId(name);
		this.musicPlaying = false;
		this.sittings = new Map();
		this.sat = [];
		this.betweenRounds = 10;
		this.numSits = 0;
		this.numBadSits = 0;
		this.curMax = -1;
		this.description = description;
	}

	onStart() {
		this.nextRound();
	}

	stopMusic() {
		this.musicPlaying = true;
		this.room.say("**The music STOPS!**");
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}
	sayStart() {
		this.room.say("**The music started playing...**");
		this.timeout = setTimeout(() => this.stopMusic(), (Math.random() * this.betweenRounds + this.betweenRounds) * 1000);
	}
	onNextRound() {
		if (this.musicPlaying) {
			for (let userID in this.players) {
				let player = this.players[userID];
				let chair = this.sittings.get(player);
				if (!chair || chair === 0) {
					player.say("You failed to sit this round!");
					delete this.players[userID];
					this.playerCount--;
				}
			}
		}
		if (this.playerCount === 1) {
			let player = this.players[Object.keys(this.players)[0]];
			this.room.say("**Winner**: " + player.name);
			this.winUser(500, player);
			this.end();
			return;
		} else if (this.playerCount === 0) {
			this.room.say("No winners this game!");
			this.end();
			return;
		}
		this.numSits = 0;
		this.sat = [];
		this.sittings.clear();
		this.musicPlaying = false;
		let players = [];
		for (let userID in this.players) {
			players.push(this.players[userID].name);
		}
		this.numBadSits = 1;
		this.curMax = this.playerCount;
		this.room.say("**Round " + this.round + "!** There " + (this.playerCount === 2 ? "is" : "are") + " " + (this.playerCount - 1) + " chair" + (this.playerCount === 2 ? "" : "s") + " remaining. Remaining players: " + players.join(", "));
		this.timeout = setTimeout(() => this.sayStart(), 5 * 1000);
	}

	sit(target, user) {
		if (!this.started) return;
		let player = this.players[user.id];
		if (!player || this.sittings.get(player)) return;
		let num = Math.floor(target);
		if (!this.musicPlaying) {
			this.sittings.set(player, 0);
			user.say("You sat before the music stopped!");
			delete this.players[user.id];
			this.playerCount--;
			if (this.playerCount === 0) {
				clearTimeout(this.timeout);
				this.nextRound();
			}
		} else if (num < this.curMax && num > 0 && this.sat.indexOf(num) === -1) {
			user.say("You have sat in chair #" + num + "!");
			this.sat.push(num);
			this.sittings.set(player, num);
			this.numSits++;
			if (this.numSits === this.playerCount) {
				clearTimeout(this.timeout);
				this.nextRound();
			}
		}
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Chatot;
exports.aliases = ["cmc"];