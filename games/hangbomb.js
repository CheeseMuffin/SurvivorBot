'use strict';

function replaceAt(str, index, character) {
	return str.substr(0, index) + character + str.substr(index + character.length);
}

const name = "Hangman Bomb";
const id = Tools.toId(name);
const description = "A variation of hangman in which each player starts with 5 lives - if you guess the answer, you gain a life, but with every wrong guess or missed round you lose a life. Last survivor wins! **Command:** ``" + Config.commandCharacter + "g [answer]``";
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

class HangmanBomb extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = Tools.toId(name);
		this.answer = null;
		this.points = new Map();
		this.categories = Object.keys(data);
		this.guessed = [];
		this.category = null;
		this.curGuesses = new Map();
		this.letterRound = 0;
		this.description = description;
	}

	onStart() {
		this.nextRound();
	}

	onJoin(user) {
		this.points.set(this.players[user.id], 5);
	}

	onLeave(user) {
		let player = this.players[user.id];
		this.points.delete(player);
		this.curGuesses.delete(player);
		if (this.getRemainingPlayerCount() === 1 && this.started) {
			if (this.answer) {
				this.say("The correct answer was: __" + this.answer + "__");
			}
			let playersLeft = this.getRemainingPlayers();
			let winPlayer = playersLeft[Object.keys(playersLeft)[0]];
			this.say("**Winner:** " + winPlayer.name);
			Storage.addPoints(500, winPlayer, this.room.id);
			clearTimeout(this.timeout);
			this.end();
			return;
		}
	}

	updatePoints(countNon) {
		for (let userID in this.players) {
			let player = this.players[userID];
			if (player.eliminated) continue;
			let guess = this.curGuesses.get(player);
			if (!guess && !countNon) continue;
			let points = this.points.get(player);
			if (!guess || guess.length > 1 || (guess.length === 1 && this.answer.split(guess).length === 1)) {
				points--;
				this.points.set(player, points);
				if (points === 0) {
					player.say("You have lost all of your lives!");
					this.removePlayer(player);
				}
			}
		}
	}
	nextLetter() {
		let realAnswer = this.answer;
		this.answer = this.answer.toLowerCase();
		let str = Array(this.answer.length + 1).join("_");
		let badstr = [];
		for (let i = 0, len = this.answer.length; i < len; i++) {
			if (this.answer[i] === ' ' || this.answer[i] === '\'') {
				str = replaceAt(str, i, '/');
			} else if (this.answer[i] === '-') {
				str = replaceAt(str, i, '-');
			}
		}
		for (let j = 0, guessLen = this.guessed.length; j < guessLen; j++) {
			let guess = this.guessed[j];
			if (guess.length > 1) {
				badstr.push(guess);
				continue;
			}
			let found = false;
			for (let i = 0, len = this.answer.length; i < len; i++) {
				if (this.answer[i] === guess) {
					str = replaceAt(str, i, realAnswer.charAt(i));
					found = true;
				}
			}
			if (!found) {
				badstr.push(guess);
			}
		}
		if (this.letterRound !== 0) {
			this.updatePoints(true);
		} else {
			this.letterRound++;
		}
		let numPlayers = this.getRemainingPlayerCount();
		if (numPlayers === 0) {
			this.say("The correct answer was: __" + realAnswer + "__");
			this.say("No winners this game! Better luck next time!");
			this.end();
			return;
		} else if (numPlayers === 1) {
			let playersLeft = this.getRemainingPlayers();
			let winPlayer = playersLeft[Object.keys(playersLeft)[0]];
			this.say("The correct answer was: __" + realAnswer + "__");
			this.say("**Winner:** " + winPlayer.name);
			this.winUser(500, winPlayer);
			this.end();
			return;
		}
		this.say(str.split("").join(" ") + " | **" + this.category + "** | " + badstr.join(", "));
		this.curGuesses.clear();
		this.answer = realAnswer;
		this.timeout = setTimeout(() => this.nextLetter(), 10 * 1000);
	}
	onNextRound() {
		this.letterRound = 0;
		let players = [];
		for (let userID in this.players) {
			let player = this.players[userID];
			if (player.eliminated) continue;
			players.push(player.name + ": (" + this.points.get(player) + "♥)");
		}
		this.guessed = [];
		this.curGuesses.clear();
		this.category = this.categories[Math.floor(Math.random() * this.categories.length)];
		this.answer = data[this.category][Math.floor(Math.random() * data[this.category].length)];
		this.say("**Players (" + this.getRemainingPlayerCount() + ")**: " + players.join(", "));
		this.nextLetter();
	}
	guess(guess, user) {
		let userID = user.id;
		let player = this.players[userID];
		if (!player || player.eliminated || this.curGuesses.get(player)) {
			return;
		}
		guess = Tools.toId(guess);
		if (this.guessed.indexOf(guess) === -1) {
			this.guessed.push(guess);
			this.curGuesses.set(player, guess);
		}
		if (guess === Tools.toId(this.answer)) {
			this.updatePoints(false);
			clearTimeout(this.timeout);
			let points = this.points.get(player);
			points += 2;
			this.points.set(player, points);
			this.say("**Correct**! " + user.name + " guessed the correct answer and gained one life! (Answer: __" + this.answer + "__)");
			if (points === 10) {
				Games.addChieve("Bombs Away", user.name);
			}
			this.answer = null;
			this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
		}
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = HangmanBomb;
exports.aliases = ["hangbomb"];