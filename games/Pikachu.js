'use strict';

const name = "Pikachu's Pool Party";
const id = Tools.toId(name);
const description = "Essentially just mario party";
const colors = {
	" ": "FFFFFF",
	"o": "CC4314",
	"x": "0029FF",
	"$": "71FF00",
};
const cards = {
	"galladesfocuspunch": {name: "Gallade's Focus Punch",canTarget: true, effect: {duration: 1,coin: -200, spaces: -4}},
	"mismagiusscurse": {name: "Mismagius's Curse", canTarget: true, effect: {duration: 1,rollMax: 3}},
	"tentacruelstoxicspikes": {name: "Tentacruel's Toxic Spikes", targetSquare: true, effect: {duration:2, rollCut: 2}},
	"pinecosspikes": {name: "Pineco's Spikes", targetSquare: true, effect: {duration: 1, rollMax: 4}},
	"accelgorsagility": {name: "Accelgor's Agility", effect: {duration: 1,rollCut: -2}},
};

class Pikachu extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.name = name;
		this.description = description;
		this.freeJoin = false;
		this.order = null;
		this.numRows = 10;
		this.numCols = 10;
		this.spaces = new Map();
		this.coins = new Map();
		this.cards = new Map();
		this.effects = new Map();
		this.map = [];
		this.numGoodSquares = 2*(this.numRows+this.numCols) - 4;
		let arr = [];
		for (let i = 0; i < this.numGoodSquares; i++) {
			arr.push(i);
		}
		arr = Tools.shuffle(arr);
		let cur = 0;
		for (let i = 0; i < this.numRows; i++) {
			this.map.push([]);
			for (let j = 0; j < this.numCols; j++) {
				let addstr;
				if (j > 0 && j < (this.numCols-1) && i > 0 && i < (this.numRows-1)) {
					addstr = " ";
				}
				else {
					if (cur == arr[0] || cur == arr[1]) {
						addstr = "$"
					}
					else {
						if (Math.random() < 0.4) {
							addstr = "o";
						}
						else {
							addstr = "x";
						}
					}
					cur++;
				}
				this.map[i].push(addstr);
			}
			console.log(this.map[i]);
		}
		console.log(this.map);
	}

	displayBoard() {
		let str = "<div class = \"infobox\"><html><body><table align=\"center\" border=\"2\"";
		let strs = [];
		let str2 = "<tr>";
		for (let i = 0; i < this.numCols + 1; i++) {
			str2 += "<td style=background-color:#FFFFFF; width=\"20px\" height=\"20px\"; align=\"center\"><b>" + (i === 0 ? "" : i) + "</b></td>";
		}
		let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		strs.push(str2);
		for (let i = 0; i < this.numRows; i++) {
			let newstr = "<tr><td style=background-color:#FFFFFF; width=\"20px\" height=\"20px\"; align=\"center\"><b>" + letters.charAt(i) + "</b></td>";
			for (let j = 0; j < this.numCols; j++) {
				let cur = this.map[i][j];
				let color;
				if (i === (this.numRows-1) && j == 0) {
					color = "000000";
				}
				else {
					color = colors[cur];
				}
				newstr += "<td style=background-color:#" + color + "; width=\"20px\" height=\"20px\"; align=\"center\"><b> </b></td>";
			}
			strs.push(newstr + "</td>");
		}
		str += strs.join("");
		str += "</table></body></html></div>";
		//console.log(str);
		this.say("!htmlbox " + str);
	}

	onStart() {
		this.say("Everyone will begin in the lower left corner!");
		for (let userID in this.players) {
			let player = this.players[userID];
			this.spaces.set(player, [this.numRows-1,0]);
			this.coins.set(player, 0);
			this.cards.set(player, []);
		}
		this.nextRound();
		
	}
	
	onNextRound() {
		this.order = Tools.shuffle(Object.keys(this.players));
		this.nextPlayer();
	}
	getDirection(curSpace) {
		let curX = curSpace[0];
		let curY = curSpace[1];
		if (curX === (this.numRows-1)) {
			if (curY === (this.numCols - 1)) {
				return [-1,0];
			}
			else {
				return [0,1];
			}
		}
		else if (curX === 0) {
			if (curY === 0) {
				return [1,0];
			}
			else {
				return [0,-1];
			}
		}
		else {
			if (curY === 0) {
				return [1,0];
			}
			else {
				return [-1,0];
			}
		}
	}
	nextPlayer() {
		if (this.order.length === 0) {
			this.nextRound();
		} else {
			this.didAction = false;
			this.displayBoard();
			let curID = this.order[0];
			this.curPlayer = this.players[curID];
			this.order.splice(0, 1);
			this.guessed = false;
			this.say("It is now " + this.curPlayer.name + "'s turn! Please choose: ``" + Config.commandCharacter + "roll`` or ``" + Config.commandCharacter + "play [card]``");
			this.timeout = setTimeout(() => this.rollP(), 15 * 1000);
		}
	}
	
	rollP() {
		let curMax = 6;
		let adder = 0;
		let effects = this.effects.get(this.curPlayer);
		if (effects) {
			if (effects.rollMax) {
				let curMax = effects.rollMax;
			}
			if (effects.rollCut) {
				let adder = effects.rollCut;
			}
		}
		let roll = Math.floor(Math.random()*curMax) + 1 + adder;
		let curSpace = this.spaces.get(this.curPlayer);
		for (let i = 0; i < roll; i++) {
			let curDir = this.getDirection(curSpace);
			curSpace[0] += curDir[0];
			curSpace[1] += curDir[1];
		}
		let type = "";
		if (this.map[curSpace[0]][curSpace[1]] === 'o') {
			let cardIndex = Math.floor(Math.random() * Object.keys(cards).length);
			console.log(cardIndex);
			let card = cards[Object.keys(cards)[cardIndex]];
			console.log(Object.keys(cards));
			this.say(this.curPlayer.name + " rolled a " + roll + " and drew a " + card.name);
			let curCards = this.cards.get(this.curPlayer);
			curCards.push(card);
			this.cards.set(this.curPlayer, curCards);
		}
		else if (this.map[curSpace[0]][curSpace[1]] == 'S') {
			type = "a shop!"
		}
		else {
			type = "an empty square";
		}
		console.log("curspace: " + curSpace);
		this.nextPlayer();
	}
	
	roll(target, user) {
		this.didAction = true;
		clearTimeout(this.timeout);
		this.rollP();
	}
	
	play(target, user) {
		let player = this.players[user.id];
		if (!player || player.id !== this.curPlayer.id) return;
		let playList = target.split(",");
		let card = cards[Tools.toId(playList[0])];
		if (!card) {
			this.say("That is not a valid card!");
			return;
		}
		let curCards = this.cards.get(player);
		let i;
		for (i = 0; i < curCards.length; i++) {
			let curCard = curCards[i];
			if (curCard.name === card.name) break;
		}
		if (i === curCards.length) {
			this.say("You don't have that card!");
			return;
		}
		curCards.splice(i,1);
		this.cards.set(player,curCards);
		if (card.canTarget) {
			if (playList.length === 1) {
				this.say("Usage: ``" + Config.commandCharacter + "play " + card.name + ", [username]``");
				return;
			}
			else {
				let playerAttack = this.players[Tools.toId(playList[1])];
				if (!playerAttack) {
					this.say("That player is not in the game!");
				}
				else {
					this.say("You have attacked " + playerAttack.name + "!");
					this.effects.set(playerAttack,card.effect);
				}
			}
		}
		else if (card.targetSquare) {
			if (playList.length < 3) {
				this.say("Usage: ``" + Config.commandCharacter + "play " + card.name + ", [row], [column]``");
			}
			else {
				let x = Math.floor(playList[1]) - 1;
				let y = Math.floor(playList[2]) - 1;
				if ((x !== 0 && x !== (this.numRows-1)) || (y !== 0 || y !== (this.numCols - 1))) {
					this.say("That square is not on the edge of the grid!");
					return;
				}
				else {
					this.say("You have placed a trap!");
				}
			}
		}
		else {
			this.say("You have used a movement card!");
		}
	}
}

exports.id = id;
exports.name = name;
exports.description = description;
exports.game = Pikachu;
exports.aliases = ['pikachu'];