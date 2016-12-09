'use strict';

const name = "Pikachu's Pool Party";
const id = Tools.toId(name);
const description = "Essentially just mario party";
const colors = {
	" ": "FFFFFF",
	"o": "CC4314",
	"x": "0029FF",
	"$": "71FF00",
	"*": "FFFF00",
};

const cards = {
	"galladesfocuspunch": {aliases: ["gfp"], name: "Gallade's Focus Punch", cost: 600, canTarget: true, effect: {duration: 1, coin: -200, spaces: -4}},
	"mismagiusscurse": {aliases: ["mc"], name: "Mismagius's Curse", cost: 600, canTarget: true, effect: {duration: 1, rollMax: 3}},
	"tentacruelstoxicspikes": {aliases: ["tts"], name: "Tentacruel's Toxic Spikes", cost: 300, targetSquare: true, effect: {duration:2, rollCut: 2}},
	"pinecosspikes": {aliases: ["ps"], name: "Pineco's Spikes", cost: 200, targetSquare: true, effect: {duration: 1, rollMax: 4}},
	"accelgorsagility": {aliases: ["aa"], name: "Accelgor's Agility", cost: 300, effect: {duration: 1, rollCut: -2}},
};

const data = {
	"Pokemon Moves" : [],
	"Pokemon Items" : [],
	"Pokemon Abilities": [],
	"Pokemon": [],
};

data["Pokemon Characters"] = Tools.data.characters;
data["Pokemon Locations"] = Tools.data.locations;

for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (!mon.species || mon.num < 1) continue;
	data["Pokemon"].push(mon.species);
}

for (let i in Tools.data.moves) {
	let move = Tools.data.moves[i];
	if (!move.name || !move.desc) continue;
	data["Pokemon Moves"].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name || !item.desc) continue;
	data["Pokemon Items"].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.data.abilities[i];
	if (!ability.name || !ability.desc) continue;
	data["Pokemon Abilities"].push(ability.name);
}

class Pikachu extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.name = name;
		this.description = description;
		this.freeJoin = false;
		this.order = null;
		this.numRows = 10;
		this.numCols = 14;
		this.canRejoin = true;
		this.canLateJoin = true;
		this.spaces = new Map();
		this.coins = new Map();
		this.cards = new Map();
		this.effects = new Map();
		this.points = new Map();
		this.stars = new Map();
		this.spaceEffects = {};
		this.maxPoints = 5;
		this.categories = Object.keys(data);
		this.map = [];
		this.timerPerAction = 30;
		this.numGoodSquares = 2 * (this.numRows + this.numCols) - 4;
		this.games = ["Anagrams", "Inverse Lost Letters", "Piplup's Letter Placements", "Mashups", "Lost Letters"];
		let arr = [];
		for (let i = 0; i < this.numGoodSquares; i++) {
			arr.push(i);
		}
		arr = Tools.shuffle(arr);
		arr = arr.slice(0, 3);
		let cur = 0;
		for (let i = 0; i < this.numRows; i++) {
			this.map.push([]);
			for (let j = 0; j < this.numCols; j++) {
				let addstr;
				if (j > 0 && j < (this.numCols - 1) && i > 0 && i < (this.numRows - 1)) {
					addstr = " ";
				} else {
					let index = arr.indexOf(cur);
					if (index !== -1) {
						if (index < 2) {
							addstr = "$";
						} else {
							addstr = "*";
							this.starSpot = [i, j];
						}
					} else {
						if (Math.random() < 0.2) {
							addstr = "o";
						} else {
							addstr = "x";
						}
					}
					cur++;
				}
				this.map[i].push(addstr);
			}
		}
	}

	displayBoard() {
		let str = "<div class = \"infobox\"><html><body><table align=\"center\" border=\"2\">";
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
				if (i === (this.numRows - 1) && j === 0) {
					color = "000000";
				} else {
					color = colors[cur];
				}
				newstr += "<td style=background-color:#" + color + "; width=\"20px\" height=\"20px\"; align=\"center\"><b> </b></td>";
			}
			strs.push(newstr + "</td>");
		}
		str += strs.join("");
		str += "</table><table align=\"center\" border=\"2\"><tr><td style=background-color:#71FF00; width=\"20px\"; height=\"20px\"; float: left;></td><td>Shop</td></tr><tr><td style=background-color:#CC4314; width=\"20px\"; height=\"20px\"; float: left;></td><td>Card</td></tr><tr><td style=background-color:#0029FF; width=\"20px\"; height=\"20px\"; float: left;></td><td>Empty</td></tr><tr><td style=background-color:#000000; width=\"20px\"; height=\"20px\"; float: left;></td><td>Starting Position</td></tr><tr><td style=background-color:#FFFF00; width=\"20px\"; height=\"20px\"; float: left;></td><td>Star</td></tr></table></body></html></div>";
		this.say("!htmlbox " + str);
	}

	onStart() {
		this.say("Everyone will begin in the lower left corner!");
		for (let userID in this.players) {
			let player = this.players[userID];
			this.spaces.set(player, [this.numRows - 1, 0]);
			this.coins.set(player, 0);
			this.cards.set(player, []);
		}
		this.order = Tools.shuffle(Object.keys(this.players));
		this.nextRound();
	}

	onJoin(user) {
		if (this.order && this.order.indexOf(user.id) === -1) {
			this.order.push(user.id);
		}
		let player = this.players[user.id];
		let curSpace = this.spaces.get(player);
		if (!curSpace) {
			this.spaces.set(player, [this.numRows - 1, 0]);
			this.coins.set(player, 0);
			this.cards.set(player, []);
		}
	}

	onLeave(user) {
		if (!this.order) return;
		let index = this.order.indexOf(user.id);
		this.order.splice(index, 1);
		if (index < (this.curNum)) {
			this.curNum--;
		}
		if (index === (this.curNum)) {
			clearTimeout(this.timeout);
			this.nextPlayer();
		}
	}
	onNextRound() {
		this.game = null;
		this.curNum = 0;
		for (let userID in this.players) {
			let player = this.players[userID];
			let points = this.points.get(player);
			if (!points) continue;
			let curCoins = this.coins.get(player) || 0;
			let addCoins = 25 * points;
			curCoins += addCoins;
			player.say("You earned **" + addCoins + "** coins for your performance in the previous game, increasing your total to **" + curCoins + "**!");
			this.coins.set(player, curCoins);
		}
		this.nextPlayer();
	}
	getDirection(curSpace) {
		let curX = curSpace[0];
		let curY = curSpace[1];
		if (curX === (this.numRows - 1)) {
			if (curY === (this.numCols - 1)) {
				return [-1, 0];
			} else {
				return [0, 1];
			}
		} else if (curX === 0) {
			if (curY === 0) {
				return [1, 0];
			} else {
				return [0, -1];
			}
		} else {
			if (curY === 0) {
				return [1, 0];
			} else {
				return [-1, 0];
			}
		}
	}
	nextPlayer() {
		this.items = [];
		if (this.canShop) {
			this.say(this.curPlayer.name + " decided to skip the shop.");
			this.canShop = false;
		}
		if (this.canBuy) {
			this.say(this.curPlayer.name + " decided not to buy anything at the shop.");
			this.canBuy = false;
		}
		if (this.curNum === this.order.length) {
			this.curNum++;
			this.curPlayer = null;
			this.doGame();
		} else {
			this.didAction = false;
			this.displayBoard();
			let curID = this.order[this.curNum];
			this.curNum++;
			this.curPlayer = this.players[curID];
			if (this.curPlayer.eliminated) {
				this.nextPlayer();
			} else {
				this.guessed = false;
				let curSpace = this.spaces.get(this.curPlayer);
				let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
				this.say("It is now " + this.curPlayer.name + "'s turn. They are located at **(" + letters[curSpace[0]] + "," + (curSpace[1] + 1) + ")**. Please choose: ``" + Config.commandCharacter + "roll`` or ``" + Config.commandCharacter + "play [card]``");
				this.timeout = setTimeout(() => this.rollP(), this.timerPerAction * 1000);
			}
		}
	}

	rollP() {
		let curMax = 6;
		let adder = 0;
		let effects = this.effects.get(this.curPlayer);
		if (effects) {
			if (effects.rollMax) {
				curMax = effects.rollMax;
			}
			if (effects.rollCut) {
				adder = effects.rollCut;
			}
			if (effects.coins) {
				let curCoins = this.coins.get(this.curPlayer) || 0;
				curCoins -= effects.coins;
				if (curCoins < 0) {
					curCoins = 0;
				}
				this.coins.set(this.curPlayer, 0);
			}
		}
		let points = this.points.get(this.curPlayer) || 0;
		curMax += points;
		let roll = Math.floor(Math.random() * curMax) + 1 + adder;
		let curSpace = this.spaces.get(this.curPlayer);
		let passedStar = false;
		for (let i = 0; i < roll; i++) {
			let curDir = this.getDirection(curSpace);
			curSpace[0] += curDir[0];
			curSpace[1] += curDir[1];
			if (curSpace[0] === this.starSpot[0] && curSpace[1] === this.starSpot[1]) {
				passedStar = true;
			}
		}
		if (passedStar) {
			let coins = this.coins.get(this.curPlayer) || 0;
			if (coins < 100) {
				this.say(this.curPlayer.name + " passed a star position, but didn't have enough money to buy!");
			} else {
				this.say(this.curPlayer.name + " passed by a star position and was able to buy it!");
				coins -= 100;
				this.coins.set(this.curPlayer, coins);
				let stars = this.stars.get(this.curPlayer) || 0;
				stars++;
				this.stars.set(this.curPlayer, stars);
				let valid = false;
				while (!valid) {
					let newX, newY;
					if (Math.random() < 0.5) {
						newX = Math.floor(Math.random() * 2) * this.numRows;
						newY = Math.floor(Math.random() * this.numCols);
					} else {
						newX = Math.floor(Math.random() * this.numRows);
						newY = Math.floor(Math.random() * 2) * this.numCols;
					}
					let curStr = this.map[newX][newY];
					if (curStr !== "x") continue;
					valid = true;
					this.map[this.starSpot[0]][this.starSpot[1]] = "x";
					this.map[newX][newY] = "*";
					this.starSpot = [newX, newY];
				}
			}
		}
		let trapLand = false;
		let badCard = null;
		for (let place in this.spaceEffects) {
			if (place[0] === curSpace[0] && place[1] === curSpace[1]) {
				trapLand = true;
				badCard = this.spaceEffects[place];
				this.spaceEffects[place] = null;
				break;
			}
		}
		let beginstr = (this.curPlayer.name + " rolled a " + curMax + "-sided die and rolled a " + roll + "!");
		if (this.map[curSpace[0]][curSpace[1]] === 'o') {
			let cardIndex = Math.floor(Math.random() * Object.keys(cards).length);
			let card = cards[Object.keys(cards)[cardIndex]];
			this.say(beginstr + " They landed on a card space and drew a " + card.name + "!");
			if (trapLand) {
				this.say("They also landed on a trap card of " + badCard.effects);
				this.effects.set(this.curPlayer, badCard.effects);
			}
			let curCards = this.cards.get(this.curPlayer);
			curCards.push(card);
			this.cards.set(this.curPlayer, curCards);
			this.hand("", Users.get(this.curPlayer.name));
			this.nextPlayer();
		} else if (this.map[curSpace[0]][curSpace[1]] === '$') {
			this.say(beginstr + " They landed on a shop. Would they like to go in? (``" + Config.commandCharacter + "no`` or ``" + Config.commandCharacter + "yes``)");
			this.canShop = true;
			this.timeout = setTimeout(() => this.nextPlayer(), this.timerPerAction * 1000);
		} else {
			this.say(beginstr + " They landed on an empty space.");
			if (trapLand) {
				this.say("They also landed on a trap card of " + badCard.effects);
				this.effects.set(this.curPlayer, badCard.effects);
			}
			this.nextPlayer();
		}
	}

	roll(target, user) {
		let player = this.players[user.id];
		if (!player || !this.curPlayer || player.id !== this.curPlayer.id) return;
		this.didAction = true;
		clearTimeout(this.timeout);
		this.rollP();
	}

	play(target, user) {
		let player = this.players[user.id];
		if (!player || !this.curPlayer || player.id !== this.curPlayer.id) return;
		let playList = target.split(",");
		//let card = cards[Tools.toId(playList[0])];
		let card = null;
		for (let cardName in cards) {
			let curCard = cards[cardName];
			if (cardName === Tools.toId(playList[0]) || curCard.aliases.indexOf(Tools.toId(playList[0])) !== -1) {
				card = curCard;
				break;
			}
		}
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
		if (card.canTarget) {
			if (playList.length === 1) {
				this.say("Usage: ``" + Config.commandCharacter + "play " + card.name + ", [username]``");
				return;
			} else {
				let playerAttack = this.players[Tools.toId(playList[1])];
				if (!playerAttack) {
					this.say("That player is not in the game!");
				} else {
					this.say("You have attacked " + playerAttack.name + "!");
					this.effects.set(playerAttack, card.effect);
				}
			}
		} else if (card.targetSquare) {
			if (playList.length < 3) {
				this.say("Usage: ``" + Config.commandCharacter + "play " + card.name + ", [row], [column]``");
				return;
			} else {
				let letters = "abcdefghij";
				let x = letters.indexOf(Tools.toId(playList[1]));
				let y = Math.floor(Tools.toId(playList[2])) - 1;
				if ((x !== 0 && x !== (this.numRows - 1)) && (y !== 0 && y !== (this.numCols - 1))) {
					this.say("That square is not on the edge of the grid!");
					return;
				} else {
					this.say("You have placed a trap!");
					this.spaceEffects[[x, y]] = card;
				}
			}
		} else {
			this.say("You have used a movement card!");
			this.effects.set(player, card.effects);
		}
		curCards.splice(i, 1);
		this.cards.set(player, curCards);
	}

	doGame() {
		this.points.clear();
		this.game = this.games[Math.floor(Math.random() * this.games.length)];
		this.say("**Round " + this.round + "** completed! We will now be playing " + this.game + "!");
		this.nextQuestion();
	}

	isVowel(ch) {
		let vowels = ["a", "e", "i", "o", "u", " "];
		return (vowels.indexOf(Tools.toId(ch)) !== -1);
	}

	convert(str) {
		let newstr = "";
		str = Tools.toId(str);
		for (let i = 0; i < str.length; i++) {
			if (this.isVowel(str.charAt(i))) {
				newstr += str.charAt(i);
			}
		}
		return newstr;
	}

	llconvert(str) {
		let newstr = "";
		str = Tools.toId(str);
		for (let i = 0; i < str.length; i++) {
			if (!this.isVowel(str.charAt(i))) {
				newstr += str.charAt(i);
			}
		}
		return newstr;
	}

	isGood(cur) {
		cur = Tools.toId(cur);
		for (let i = 0; i < cur.length; i++) {
			if (cur.substr(i, 3) === this.curAnswer) {
				return true;
			}
		}
		return false;
	}

	nextQuestion() {
		if (this.answers) {
			this.say("Time's up! The answer" + (this.answers.length > 1 ? "s were" : " was") + " __" + this.answers.join(", ") + "__");
		}
		if (this.game === "Anagrams") {
			this.maxPoints = 5;
			this.category = this.categories[Math.floor(Math.random() * this.categories.length)];
			let x = Math.floor(Math.random() * data[this.category].length);
			this.answers = [data[this.category][x]];
			let chars = [], idAns = Tools.toId(this.answers[0]);
			for (let i = 0, len = idAns.length; i < len; i++) {
				chars.push(idAns.charAt(i));
			}
			chars = Tools.shuffle(chars);
			this.say("**[" + this.category + "]** __" + chars.join(", ") + "__");
			this.timeout = setTimeout(() => this.nextQuestion(), 10 * 1000);
		} else if (this.game === "Inverse Lost Letters") {
			this.maxPoints = 3;
			this.category = "Pokemon";//this.categories[Math.floor(Math.random() * this.categories.length)];
			let x = Math.floor(Math.random() * data[this.category].length);
			let answer = this.convert(data[this.category][x]);
			this.answers = [];
			for (let i = 0; i < data[this.category].length; i++) {
				if (this.convert(data[this.category][i]) === answer) {
					this.answers.push(data[this.category][i]);
				}
			}
			this.say("**[" + this.category + "]**: __" + answer + "__");
			this.timeout = setTimeout(() => this.nextQuestion(), 20 * 1000);
		} else if (this.game === "Piplup's Letter Placements") {
			this.maxPoints = 5;
			this.answers = [];
			this.category = this.categories[Math.floor(Math.random() * this.categories.length)];
			let curThing = Tools.toId(data[this.category][Math.floor(Math.random() * data[this.category].length)]);
			let curLetter = Math.floor(Math.random() * (curThing.length - 2));
			this.curAnswer = curThing.substr(curLetter, 3);
			for (let i = 0; i < data[this.category].length; i++) {
				let cur = data[this.category][i];
				if (this.isGood(cur)) this.answers.push(cur);
			}
			this.say("Find a **" + this.category + "** with the letters **" + this.curAnswer.toUpperCase() + "** in order!");
			this.timeout = setTimeout(() => this.nextQuestion(), 15 * 1000);
		} else if (this.game === "Mashups") {
			this.maxPoints = 5;
			let newDat = Tools.shuffle(data["Pokemon"]);
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
			this.timeout = setTimeout(() => this.nextQuestion(), 10 * 1000);
		} else if (this.game === "Lost Letters") {
			this.maxPoints = 5;
			this.category = this.categories[Math.floor(Math.random() * this.categories.length)];
			let x = Math.floor(Math.random() * data[this.category].length);
			let answer = this.llconvert(data[this.category][x]);
			this.answers = [];
			for (let i = 0; i < data[this.category].length; i++) {
				if (this.llconvert(data[this.category][i]) === answer) {
					this.answers.push(data[this.category][i]);
				}
			}
			this.say("**[" + this.category + "]**: __" + answer + "__");
			this.timeout = setTimeout(() => this.nextQuestion(), 20 * 1000);
		}
	}

	guess(guess, user) {
		if (!this.answers) return;
		let player = this.players[user.id];
		if (!player || player.eliminated) return;
		let correct = false;
		if (this.game === "Mashups") {
			let commaIndex = guess.indexOf(",");
			if (commaIndex === -1) return false;
			let mon1 = Tools.toId(guess.substr(0, commaIndex));
			let mon2 = Tools.toId(guess.substr(commaIndex + 1));
			if ((mon1 === Tools.toId(this.answers[0]) && mon2 === Tools.toId(this.answers[1])) || (mon1 === Tools.toId(this.answers[1]) && mon2 === Tools.toId(this.answers[0]))) correct = true;
		} else {
			guess = Tools.toId(guess);
			for (let i = 0, len = this.answers.length; i < len; i++) {
				if (Tools.toId(this.answers[i]) === guess) {
					correct = true;
					break;
				}
			}
		}
		if (!correct) return;
		clearTimeout(this.timeout);
		if (!(user.id in this.players)) this.addPlayer(user);
		let points = this.points.get(player) || 0;
		points += 1;
		this.points.set(player, points);
		if (points >= this.maxPoints) {
			this.say("Correct! " + user.name + " wins the game! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.nextRound();
			this.answers = null;
			return;
		}
		this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = null;
		this.timeout = setTimeout(() => this.nextQuestion(), 5 * 1000);
	}

	hand(target, user) {
		let player = this.players[user.id];
		if (!player) return;
		let cards = this.cards.get(player);
		let strs = [];
		for (let i = 0; i < cards.length; i++) {
			strs.push(cards[i].name);
		}
		if (cards.length === 0) {
			user.say("You don't have any cards!");
		} else {
			user.say("Current hand: " + strs.join(", "));
		}
	}

	yes(user) {
		let player = this.players[user.id];
		if (!player || !this.canShop || !this.curPlayer || player.id !== this.curPlayer.id) return;
		this.canShop = false;
		let items = [];
		for (let cardID in cards) {
			items.push(cards[cardID]);
		}
		items = Tools.shuffle(items);
		this.items = [];
		let itemNames = [];
		for (let i = 0; i < 3; i++) {
			this.items.push(items[i]);
			itemNames.push(items[i].name + "(" + items[i].cost + ")");
		}
		this.say(this.curPlayer.name + " entered the shop! The shop is currently selling " + itemNames.join(", ") + "! Use ``" + Config.commandCharacter + "buy [item]`` to buy an item, or ``" + Config.commandCharacter + "leaveshop`` to leave the shop.");
		this.canBuy = true;
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => this.nextPlayer(), this.timerPerAction * 1000);
	}

	no(user) {
		let player = this.players[user.id];
		if (!player || !this.canShop || !this.curPlayer || player.id !== this.curPlayer.id) return;
		clearTimeout(this.timeout);
		this.nextPlayer();
	}

	getCoins(user) {
		let player = this.players[user.id];
		if (!player) return;
		let numCoins = this.coins.get(player) || 0;
		if (numCoins === 0) {
			user.say("You don't have any coins!");
		} else {
			user.say("You currently have " + numCoins + " coins!");
		}
	}

	getStars(user) {
		let player = this.players[user.id];
		if (!player) return;
		let numStars = this.stars.get(player) || 0;
		if (numStars === 0) {
			user.say("You don't have any stars!");
		} else {
			user.say("You currently have " + numStars + " stars.");
		}
	}
	buy(target, user) {
		target = Tools.toId(target);
		let player = this.players[user.id];
		let card = null;
		for (let cardName in cards) {
			let curCard = cards[cardName];
			if (cardName === Tools.toId(target) || curCard.aliases.indexOf(Tools.toId(target)) !== -1) {
				card = curCard;
				break;
			}
		}
		if (!card || !player || !this.curPlayer || player.id !== this.curPlayer.id || !this.canBuy) return;
		let coins = this.coins.get(player);
		if (coins < card.cost) {
			this.say("You don't have enough money to buy that!");
			return;
		}
		let curCards = this.cards.get(player);
		curCards.push(card);
		this.coins.set(player, coins - card.cost);
		clearTimeout(this.timeout);
		this.canBuy = false;
		this.nextPlayer();
	}

	leaveshop(user) {
		let player = this.players[user.id];
		if (!player || !this.canBuy || !this.curPlayer || player.id !== this.curPlayer.id) return;
		clearTimeout(this.timeout);
		this.nextPlayer();
	}
}

exports.id = id;
exports.name = name;
exports.description = description;
exports.game = Pikachu;
exports.aliases = ['pikachu'];