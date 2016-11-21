'use strict';

const name = "Pidove's Tribute Trivia";
const id = Tools.toId(name);
const description = "Players nominate other players to undergo the PV Trial, where they must correctly answer 3 Trivia Questions in a row";
const data = {
	"Pokemon Moves": {},
	"Pokemon Items": {},
	"Pokemon Abilities": {},
};

for (let i in Tools.data.moves) {
	let move = Tools.data.moves[i];
	if (!move.name || !move.desc) continue;
	if (!(move.desc in data["Pokemon Moves"])) data["Pokemon Moves"][move.desc] = [];
	data["Pokemon Moves"][move.desc].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name || !item.desc) continue;
	if (!(item.desc in data["Pokemon Items"])) data["Pokemon Items"][item.desc] = [];
	data["Pokemon Items"][item.desc].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.data.abilities[i];
	if (!ability.name || !ability.desc) continue;
	if (!(ability.desc in data["Pokemon Abilities"])) data["Pokemon Abilities"][ability.desc] = [];
	data["Pokemon Abilities"][ability.desc].push(ability.name);
}

class Pidove extends Games.Game {
	constructor(room) {
		super(room);
		this.id = id;
		this.name = name;
		this.description = description;
		this.nominations = new Map();
		this.points = new Map();
		this.curPlayer = null;
		this.maxPoints = 3;
		this.categories = Object.keys(data);
		this.questions = [];
		for (let i = 0, len = this.categories.length; i < len; i++) {
			this.questions[this.categories[i]] = Object.keys(data[this.categories[i]]);
		}
		this.numNominations = 0;
	}

	onStart() {
		this.nextRound();
	}

	nextRound() {
		if (this.playerCount === 1) {
			this.say("**Winner:** " + this.players[Object.keys(this.players)[0]].name);
			this.winUser(500,this.players[Object.keys(this.players)[0]]);
			this.end();
			return;
		}
		this.nominations.clear();
		this.points.clear();
		this.numNominations = 0;
		this.canElim = false;
		this.curPlayer = null;
		this.pl();
		this.canNom = true;
		this.say("Please begin nominating players! **Command:** ``" + Config.commandCharacter + "nom [user]``");
		this.timeout = setTimeout(() => this.nominatePlayer(), 30 * 1000);
	}

	nominatePlayer() {
		this.canNom = false;
		let bestPlayers = [];
		let numNoms = -1;
		for (let userID in this.players) {
			let player = this.players[userID];
			let points = this.points.get(player);
			if (!points) continue;
			if (points === numNoms) {
				bestPlayers.push(player);
			} else if (points > numNoms) {
				bestPlayers = [player];
				numNoms = points;
			}
		}
		if (bestPlayers.length === 1) {
			this.curPlayer = bestPlayers[0];
			this.say(this.curPlayer.name + " was nominated to go next!");
		} else if (bestPlayers.length > 1) {
			console.log(bestPlayers.length);
			this.curPlayer = bestPlayers[Math.floor(Math.random() * bestPlayers.length)];
			this.say("Voting resulted in a tie, and " + this.curPlayer.name + " was randomly chosen to go next!");
		} else {
			this.curPlayer = this.players[Object.keys(this.players)[Math.floor(Math.random() * Object.keys(this.players).length)]];
			this.say("Nobody was nominated, so we randomly picked " + this.curPlayer.name + " to go next!");
		}
		this.points.clear();
		this.answers = null;
		this.nextQuestion();
	}

	nextQuestion() {
		if (this.answers) {
			let answers = this.answers.length;
			this.say("Time's up! The answer" + (answers > 1 ? "s were" : " was") + " __" + this.answers.join(", ") + "__");
			this.say(this.curPlayer.name + " didn't answer a question and is eliminated!");
			delete this.players[this.curPlayer.id];
			this.answers = null;
			this.playerCount--;
			this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
		} else {
			let category = this.categories[Math.floor(Math.random() * this.categories.length)];
			let question = this.questions[category][Math.floor(Math.random() * this.questions[category].length)];
			this.answers = data[category][question];
			this.say("**[" + category + "]**: __" + question + "__");
			this.timeout = setTimeout(() => this.nextQuestion(), 10 * 1000);
		}
	}

	guess(guess, user) {
		if (!this.curPlayer || this.curPlayer.id !== user.id) return;
		if (!this.answers) return;
		guess = Tools.toId(guess);
		let correct = false;
		for (let i = 0, len = this.answers.length; i < len; i++) {
			if (Tools.toId(this.answers[i]) === guess) {
				correct = true;
				break;
			}
		}
		if (!correct) return;
		clearTimeout(this.timeout);
		if (!(user.id in this.players)) this.addPlayer(user);
		let player = this.players[user.id];
		let points = this.points.get(player) || 0;
		points += 1;
		this.points.set(player, points);
		if (points >= this.maxPoints) {
			this.say("Correct! " + user.name + " wins the game! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.say(user.name + " please choose someone to eliminate! **Command:** ``" + Config.commandCharacter + "elim [user]``");
			this.canElim = true;
			this.timeout = setTimeout(() => this.elimPlayer(null), 15 * 1000);
		} else {
			this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.answers = null;
			this.timeout = setTimeout(() => this.nextQuestion(), 5 * 1000);
		}
	}

	elimPlayer(target) {
		if (!target) {
			let possibleElims = [];
			for (let userID in this.player) {
				let player = this.players[userID];
				if (this.nominations.get(player) !== this.curPlayer) continue;
				possibleElims.push(player);
			}
			let elimPlayer;
			if (possibleElims.length === 0) {
				elimPlayer = this.players[Object.keys(this.players)[Math.floor(Math.random() * Object.keys(this.players).length)]];
			} else {
				elimPlayer = possibleElims[Math.floor(Math.random() * possibleElims.length)];
			}
			this.say(this.curPlayer.name + " did not choose someone to eliminate, and so we randomly chose " + elimPlayer.name + " to be eliminated!");
			delete this.players[elimPlayer.id];
			this.playerCount--;
		} else {
			this.say(target.name + " was eliminated!");
			this.playerCount--;
			delete this.players[target.id];
		}
		this.canElim = false;
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}

	nom(target, user) {
		if (!this.canNom) return;
		let player = this.players[user.id];
		let oplayer = this.players[Tools.toId(target)];
		if (!player || !oplayer || this.nominations.get(player) || player.id === oplayer.id) return;
		player.say("You nominated **" + oplayer.name + "**!");
		this.nominations.set(player, oplayer);
		let points = this.points.get(oplayer) || 0;
		this.points.set(oplayer, points + 1);
		this.numNominations++;
		console.log(this.playerCount);
		if (this.numNominations === this.playerCount) {
			console.log(this.numNominations);
			clearTimeout(this.timeout);
			this.nominatePlayer();
		}
	}

	elim(target, user) {
		if (!this.canElim || user.id !== this.curPlayer.id) return;
		console.log("hi");
		let oplayer = this.players[Tools.toId(target)];
		if (!oplayer) return;
		if (oplayer.id === this.curPlayer.id) {
			this.say(">eliminating yourself");
			return;
		}
		if (this.nominations.get(oplayer) !== this.curPlayer) {
			this.say("You must eliminate someone that nominated you!");
			return;
		}
		console.log("ok");
		clearTimeout(this.timeout);
		this.elimPlayer(oplayer);
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.game = Pidove;
exports.aliases = ['ptt'];
exports.minigame = false;