'use strict';

const name = 'Dexterity';
const description = 'Pick items and do stuff';
const id = Tools.toId(name);

const data = {"twig": {atk:50, acc:100},
			  "club": {atk:75, acc:85},
			  "sword":{atk:100, acc:70},
			  "jabulin": {atk:125, acc:50},
			  "sofa": {atk:135, acc:40},
			  "ax": {atk:150, acc:30},
			  "death": {atk:200, acc:10}};

class Dexterity extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.description = description;
		this.name = name;
		this.order = [];
		this.items = new Map();
		this.attacks = new Map();
		this.timePer = 10;
		this.canChooseItems = false;
		this.canAttack = false;
		this.doneAcc = false;
	}

	onStart() {
		this.nextRound();
	}

	onNextRound() {
		if (this.getRemainingPlayerCount() === 1) {
			let winPlayer = this.getLastPlayer();
			this.say("**Winner:** " + winPlayer.name);
			this.end();
			return;
		}
		this.pl();
		this.oplayer = null;
		this.curPlayer = null;
		this.order = [];
		this.canChooseItems = false;
		this.canAttack = false;
		this.items.clear();
		this.attacks.clear();
		this.roll1 = null;
		this.roll2 = null;
		this.chooseItems();
	}

	chooseItems() {
		this.canChooseItems = true;
		this.say("Everyone please pm me an item! **Command:** ``" + Config.commandCharacter + "choose [item]`` (in pms) Valid items are " + Object.keys(data).join(", "));
		this.timeout = setTimeout(() => this.chooseAttacks(), this.timePer * 2000);
	}

	chooseAttacks() {
		for (let userID in this.getRemainingPlayers()) {
			let player = this.players[userID];
			let item = this.items.get(player);
			if (!item) {
				player.say("You didn't choose an item!");
				this.players[userID].eliminated = true;
			}
		}
		if (this.getRemainingPlayerCount() === 1) {
			this.say("Some people didn't choose items, hence " + this.players[Object.keys(this.players)[0]].name + " won!");
			this.end();
			return;
		}
		this.canChooseItems = false;
		this.canAttack = true;
		this.say("Everyone please pm me your target! **Command:** ``" + Config.commandCharacter + "destroy [user]`` (in pms)");
		this.timeout = setTimeout(() => this.handleAttacks(), this.timePer * 3000);
	}

	doAttacks() {
		let item = this.items.get(this.curPlayer);
		let item2 = this.items.get(this.oplayer);
		this.roll1 = null;
		this.roll2 = null;
		this.winIndex = null;
		this.say("Rolling for **" + this.curPlayer.name + "** power.");
		this.say("!roll " + data[item].atk);
		this.say("Rolling for **" + this.oplayer.name + "** power.");
		this.say("!roll " + data[item2].atk);
	}
	handleAttacks() {
		if (this.order.length === 0) {
			this.nextRound();
		} else {
			this.curPlayer = this.order[0];
			this.oplayer = this.attacks.get(this.curPlayer);
			this.order.splice(0, 1);
			if (!(this.curPlayer.id in this.players) || !this.oplayer) {
				this.handleAttacks();
			}
			let item = this.items.get(this.curPlayer);
			this.say(this.curPlayer.name + " is attacking " + this.oplayer.name + " with a " + item);
			this.doAttacks();
		}
	}

	choose(user, target) {
		if (!this.canChooseItems) return;
		let curPlayer = this.players[user.id];
		if (!curPlayer) return;
		if (!(target in data)) {
			user.say("That is not a valid item!");
			return;
		}
		let curItem = this.items.get(curPlayer);
		if (curItem) {
			user.say("You have already chosen an item!");
			return;
		}
		this.items.set(curPlayer, target);
		user.say("You have chosen the **" + target + "**!");
	}

	handleRoll(roll) {
		if (!this.roll1) {
			this.roll1 = roll;
		} else if (!this.roll2) {
			this.roll2 = roll;
			if (this.roll1 > this.roll2) {
				this.say("**" + this.curPlayer.name + "** beats up **" + this.oplayer.name + "**!");
				this.winIndex = 0;
			} else if (this.roll1 < this.roll2) {
				this.say("**" + this.oplayer.name + "** beats up **" + this.curPlayer.name + "**!");
				this.winIndex = 1;
			} else {
				this.say("The rolls were a tie! Rerolling...");
				this.doAttacks();
			}
			if (this.winIndex) {
				let bothPlayers = [this.curPlayer, this.oplayer];
				let item = this.items.get(bothPlayers[this.winIndex]);
				let realitem = data[item];
				let acc = realitem.acc;
				if (acc === 100) {
					this.say("The item has 100% accuracy! Rip **" + bothPlayers[1 - this.winIndex].name);
					delete this.players[bothPlayers[1 - this.winIndex].id];
				} else {
					this.say("Rolling for " + bothPlayers[this.winIndex].name + "'s accuracy!");
					this.say("!roll 100");
				}
			}
		} else {
			let actAcc = roll;
			let bothPlayers = [this.curPlayer, this.oplayer];
			let item = this.items.get(bothPlayers[this.winIndex]);
			let realitem = data[item];
			let acc = realitem.acc;
			if (actAcc <= acc) {
				this.say("The attack hits! Rip " + bothPlayers[1 - this.winIndex].name);
				delete this.players[bothPlayers[1 - this.winIndex].id];
			} else {
				this.say("Fortunately for " + bothPlayers[1 - this.winIndex].name + ", the attack missed!");
			}
			this.timeout = setTimeout(() => this.handleAttacks(), 5 * 1000);
		}
	}

	destroy(target, user) {
		if (!this.canAttack) return;
		let curPlayer = this.players[user.id];
		if (!curPlayer) return;
		let realID = Tools.toId(target);
		let oplayer = this.players[realID];
		if (!oplayer) {
			user.say("That player is not in the game!");
			return;
		}
		let curAtt = this.attacks.get(curPlayer);
		if (curAtt) {
			user.say("You have already attacked someone this round!");
			return;
		}
		this.order.push(curPlayer);
		user.say("You have chosen to attack **" + oplayer.name + "**!");
		this.attacks.set(curPlayer, oplayer);
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Dexterity;
exports.aliases = ["dext"];