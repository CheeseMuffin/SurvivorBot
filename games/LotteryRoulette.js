'use strict';

const name = "Lottery Roulette.";
const description = "http://s15.zetaboards.com/PS_Game_Corner/topic/10053608/1/#new";
const id = Tools.toId(name);

class LotteryRoulette extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.description = description;
		this.id = id;
		this.wagers = new Map();
		this.attacks = new Map();
	}

	onStart() {
		this.say("Please wager your bits! **Command:** ``" + Config.commandCharacter + "wager [bits]``");
		this.canWager = true;
		this.timeout = setTimeout(() => this.handleWagers(), 30 * 1000);
	}

	handleWagers() {
		this.canWager = false;
		for (let userID in this.players) {
			let player = this.players[userID];
			let wager = this.wagers.get(player);
			if (!wager) this.wagers.set(player, 10);
		}
		this.nextRound();
	}

	onNextRound() {
		this.attacks.clear();
		this.say("Please select your victim! **Command:** ``" + Config.commandCharacter + "select [user]``");
		this.timeout = setTimeout(() => this.chooseVictim(), 30 * 1000);
	}

	chooseVictim() {
		let multiplier = 1 + this.round / this.playerCount;
		let remainPlayers = this.getRemainingPlayers();
		let elimPlayer = remainPlayers[Object.keys(remainPlayers)[Math.floor(Math.random() * Object.keys(remainPlayers).length)]];
		this.say(elimPlayer.name + " was randomly chosen to be eliminated!");
		elimPlayer.eliminated = true;
		let num = 1;
		for (let userID in remainPlayers) {
			let player = remainPlayers[userID];
			if (player === elimPlayer) continue;
			let guessedPlayer = this.attacks.get(player);
			if (!guessedPlayer || guessedPlayer !== elimPlayer) continue;
			let wager = this.wagers.get(player);
			Storage.addPoints(Math.floor(wager * multiplier), player, this.room.id);
			player.say("You earned " + Math.floor(wager * multiplier) + " bits for guessing the eliminated player correctly!");
			num++;
		}
		let wager = this.wagers.get(elimPlayer);
		Storage.addPoints(wager * -1 * num, elimPlayer, this.room.id);
		elimPlayer.say("You lost " + (wager * num) + " bits for being eliminated.");
	}

	select(target, user) {
		let attackingPlayer = this.players[user.id];
		let attackedPlayer = this.players[Tools.toId(target)];
		if (!attackingPlayer || !attackedPlayer || attackingPlayer.eliminated || attackedPlayer.eliminated) return;
		this.attacks.set(attackingPlayer, attackedPlayer);
	}

	wager(target, user) {
		if (!this.canWager) return;
		console.log("sup");
		let player = this.players[user.id];
		target = Math.floor(target);
		let curBits = 10;
		if (user.id in Storage.databases[this.room.id].leaderboard) {
			curBits = Storage.databases[this.room.id].leaderboard[user.id].points;
		}
		if (!target || !player || player.eliminated || target < 0) return;
		if (target > curBits) target = curBits;
		if (target > 300) target = 300;
		this.wagers.set(player, target);
		user.say("Your wager for " + target + " bits has been placed!");
	}
}

exports.game = LotteryRoulette;
exports.name = name;
exports.description = description;
exports.id = id;
exports.aliases = ['lr'];