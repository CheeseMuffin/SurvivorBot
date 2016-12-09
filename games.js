/**
 * Games
 * BotStuff - https://github.com/CheeseMuffin/BotStuff
 *
 * This file contains the game system and related commands for BotStuff.
 *
 * @license MIT license
 */

'use strict';

const fs = require('fs');
const data = {};
const monForms = {};
for (let i in Tools.data.pokedex) {
	let mon = Tools.data.pokedex[i];
	if (mon.num < 1) continue;
	let species = mon.species;
	data[species] = {};
	data[species]["stuff"] = [mon.color];
	for (let key in mon.abilities) {
		data[species]["stuff"].push(mon.abilities[key]);
	}
	for (let j = 0; j < mon.types.length; j++) {
		data[species]["stuff"].push(mon.types[j]);
	}
	if (mon.otherFormes) {
		for (let j = 0, len = mon.otherFormes.length; j < len; j++) {
			monForms[mon.otherFormes[j]] = species;
		}
	}
	let gen = Tools.generation(mon.num);
	if (mon.formeLetter === "M") {
		gen = 6;
	} else if (mon.formeLetter === "A") {
		gen = 7;
	}
	data[species]["stuff"].push(gen);
	if (species === "Smeargle") {
		data[species]["Pokemon Moves"] = [];
		for (let move in Tools.data.moves) {
			data[species]["Pokemon Moves"].push(Tools.data.moves[move].name);
			data[species]["stuff"].push(Tools.data.moves[move].name);
		}
	} else if (i in Tools.data.learnsets) {
		data[species]["Pokemon Moves"] = [];
		for (let move in Tools.data.learnsets[i].learnset) {
			data[species]["Pokemon Moves"].push(Tools.data.moves[move].name);
			data[species]["stuff"].push(Tools.data.moves[move].name);
		}
	} else if (i in monForms) {
		data[species]["Pokemon Moves"] = data[monForms[i]]["Pokemon Moves"];
		for (let j = 0; j < data[species]["Pokemon Moves"].length; j++) {
			data[species]["stuff"].push(data[species]["Pokemon Moves"][j]);
		}
	}
	if (mon.prevo) {
		let prevoMon = Tools.data.pokedex[mon.prevo];
		if (prevoMon.species in data) {
			let prevoMoves = data[prevoMon.species]["Pokemon Moves"];
			for (let j = 0; j < prevoMoves.length; j++) {
				if (data[species]["Pokemon Moves"].indexOf(prevoMoves[j]) === -1) {
					data[species]["Pokemon Moves"].push(prevoMoves[j]);
					data[species]["stuff"].push(prevoMoves[j]);
				}
			}
		}
	}
	if (Tools.data.battle[i] && Tools.data.battle[i].tier) {
		data[species]["stuff"].push(Tools.data.battle[i].tier);
	} else if (i in monForms) {
		data[species]["stuff"].push(Tools.data.battle[Tools.toId(monForms[i])].tier);
	}
}


class Player {
	constructor(user) {
		this.name = user.name;
		this.id = user.id;
		this.eliminated = false;
	}

	say(message) {
		Users.add(this.name).say(message);
	}
}

class Game {
	constructor(room) {
		this.room = room;
		this.players = {};
		this.playerCount = 0;
		this.round = 0;
		this.started = false;
		this.ended = false;
		this.freeJoin = false;
		this.playerCap = -1;
		this.minigame = false;
		this.canLateJoin = false;
		this.canRejoin = false;
	}

	say(message) {
		this.room.say(message);
	}

	html(message) {
		this.room.html(message);
	}

	signups() {
		this.say("Hosting a game of " + this.name + "! " + (this.freeJoin ? "(free join)" : "If you would like to play, use the command ``" + Config.commandCharacter + "join``."));
		if (this.description) this.say("Description: " + this.description);
		if (typeof this.onSignups === 'function') this.onSignups();
		if (this.freeJoin) this.started = true;
	}

	winUser(numBits, player) {
		player.say("You were awarded " + numBits + " bits for winning the game! You can use the command ``" + Config.commandCharacter + "bits`` to check your bits.");
		Games.addBits(numBits, player.name); // eslint-disable-line no-use-before-define
	}

	start() {
		if (this.started) return;
		if (this.playerCount < 2) {
			this.say("The game needs at least two players to start!");
			return;
		}
		this.started = true;
		if (typeof this.onStart === 'function') this.onStart();
	}

	autostart(target) {
		let x = Math.floor(target);
		if (!x || x >= 120 || (x < 10 && x > 2) || x <= 0) return;
		if (x === 1) x = 60;
		let minutes = Math.floor(x / 60);
		let seconds = x % 60;
		this.say("The game will automatically start in " + (minutes > 0 ? "1 minute, " : "") + seconds + " seconds.");
		this.timeout = setTimeout(() => this.start(), x * 1000);
	}

	cap(target) {
		let x = Math.floor(target);
		if (!x || x < 2) return;
		this.playerCap = x;
		if (this.playerCount >= x) {
			this.start();
		} else {
			this.say("The game will automatically start with " + x + " players!");
		}
	}

	end() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		if (typeof this.onEnd === 'function') this.onEnd();
		this.ended = true;
		this.room.game = null;
	}

	forceEnd() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		this.say("The game was forcibly ended.");
		this.ended = true;
		this.room.game = null;
	}

	nextRound() {
		if (this.timeout) clearTimeout(this.timeout);
		this.round++;
		if (typeof this.onNextRound === 'function') this.onNextRound();
	}

	addPlayer(user) {
		if (user.id in this.players) return;
		let player = new Player(user);
		this.players[user.id] = player;
		this.playerCount++;
		if (this.playerCount === this.playerCap) {
			this.start();
		}
		return player;
	}

	removePlayer(user) {
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		if (this.started) {
			this.players[user.id].eliminated = true;
		} else {
			delete this.players[user.id];
			this.playerCount--;
		}
	}

	renamePlayer(user, oldName) {
		let oldId = Tools.toId(oldName);
		if (!(oldId in this.players)) return;
		let player = this.players[oldId];
		player.name = user.name;
		if (player.id === user.id || user.id in this.players) return;
		player.id = user.id;
		this.players[user.id] = player;
		delete this.players[oldId];
		if (this.onRename) this.onRename(user);
	}

	join(user) {
		if (this.started && !this.canLateJoin) return;
		if (user.id in this.players && !this.canRejoin) return;
		if (this.freeJoin) {
			user.say("This game does not require you to join!");
			return;
		}
		if (user.id in this.players) {
			let player = this.players[user.id];
			if (!player.eliminated) return;
			user.say("You have rejoined the game of " + this.name + "!");
			player.eliminated = false;
			this.players[user.id] = player;
		} else {
			this.addPlayer(user);
			user.say('You have joined the game of ' + this.name + '!');
		}
		if (typeof this.onJoin === 'function') this.onJoin(user);
	}

	leave(user) {
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		this.removePlayer(user);
		user.say("You have left the game of " + this.name + "!");
		if (typeof this.onLeave === 'function') this.onLeave(user);
	}

	getRemainingPlayers() {
		let remainingPlayers = {};
		for (let i in this.players) {
			if (!this.players[i].eliminated) remainingPlayers[i] = this.players[i];
		}
		return remainingPlayers;
	}

	getRemainingPlayerCount() {
		let count = 0;
		for (let i in this.players) {
			if (!this.players[i].eliminated) count++;
		}
		return count;
	}

	shufflePlayers(players) {
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			list.push(players[i]);
		}
		return Tools.shuffle(list);
	}

	pl() {
		let players = [];
		for (let userID in this.players) {
			if (this.players[userID].eliminated) continue;
			players.push(this.players[userID].name);
		}
		this.room.say("**Players (" + this.getRemainingPlayerCount() + ")**: " + players.join(", "));
	}
	handlehtml(message) {
		message = message[0];
		message = message.substr(21);
		console.log(message);
		console.log(message.substr(4, 2));
		if (message.substr(0, 4) === "Roll") {
			let colonIndex = message.indexOf(":");
			message = message.substr(colonIndex + 2);
			message = message.substr(0, message.length - 6);
			if (typeof this.handleRoll === 'function') this.handleRoll(Math.floor(message));
		} else if (message.substr(4, 2) === "We") {
			let colonIndex = message.indexOf(":");
			message = message.substr(colonIndex + 7);
			message = message.substr(0, message.length - 6);
			if (typeof this.handlePick === 'function') this.handlePick(message);
		}
	}
}

class Minigame extends Game {
	constructor(room) {
		super(room);
		this.freeJoin = true;
		this.minigame = true;
	}

	signups() {
		this.say(this.description);
		if (typeof this.onSignups === 'function') this.onSignups();
	}
}

class GamesManager {
	constructor() {
		this.games = {};
		this.aliases = {};
		this.pastGames = {};
	}

	onLoad() {
		this.loadGames();
	}

	loadGames() {
		Object.keys(require.cache).forEach(function (key) { delete require.cache[key]; });
		let games;
		try {
			games = fs.readdirSync('./games');
		} catch (e) {}
		if (!games) return;
		for (let i = 0, len = games.length; i < len; i++) {
			let file = games[i];
			if (!file.endsWith('.js')) continue;
			file = require('./games/' + file);
			if (file.game && file.name && file.id) this.games[file.id] = file;
			this.aliases[file.name] = file.aliases;
		}
	}

	sayDescription(game, room) {
		let id = Tools.toId(game);
		for (let fileID in this.games) {
			let game = this.games[fileID];
			if (game.aliases.indexOf(id) !== -1) {
				id = fileID;
				break;
			} else if (id === fileID) {
				break;
			}
		}
		if (!(id in this.games)) return;
		if (this.games[id].minigame) return;
		room.say(this.games[id].description);
	}

	createMiniGame(game, room) {
		if (room.game) return room.say("A game is already in progress!");
		if (room.canVote) return room.say("Voting is in progress");
		this.loadGames();
		let id = Tools.toId(game);
		for (let fileID in this.games) {
			let game = this.games[fileID];
			if (game.aliases.indexOf(id) !== -1) {
				id = fileID;
				break;
			} else if (id === fileID) {
				break;
			}
		}
		if (!(id in this.games)) return room.say("The game '" + game.trim() + "' was not found.");
		if (!this.games[id].minigame) return room.say("Needs to be a minigame!");
		room.game = new this.games[id].game(room); // eslint-disable-line new-cap
		room.game.signups();
	}
	createGame(game, room) {
		this.loadGames();
		if (room.canVote) return room.say("Voting is in progress");
		if (room.game) {
			if (room.game.minigame) {
				return room.say("A minigame is in progress!");
			} else {
				return room.say("A game of " + room.game.name + " is already in progress.");
			}
		}
		let id = Tools.toId(game);
		for (let fileID in this.games) {
			let game = this.games[fileID];
			if (game.aliases.indexOf(id) !== -1) {
				id = fileID;
				break;
			} else if (id === fileID) {
				break;
			}
		}
		if (!(id in this.games)) return room.say("The game '" + game.trim() + "' was not found.");
		if (this.games[id].minigame) return room.say("You cannot signup a minigame!");
		room.game = new this.games[id].game(room); // eslint-disable-line new-cap
		if (room.name in this.pastGames) {
			let cur = this.pastGames[room.name];
			cur.push(room.game.name);
			if (cur.length > 8) {
				cur.splice(0, 1);
			}
			this.pastGames[room.name] = cur;
		} else {
			this.pastGames[room.name] = [room.game.name];
		}
	}

	addBits(numBits, username) {
		fs.readFile('bits.txt', function (err, data) {
			if (err) {
				return console.error(err);
			}
			data = JSON.parse(data);
			let found = false;
			for (let name in data) {
				if (Tools.toId(name) === Tools.toId(username)) {
					let curBits = data[name];
					curBits += numBits;
					data[name] = curBits;
					found = true;
					break;
				}
			}
			if (!found) {
				data[username] = numBits;
			}
			fs.writeFile('bits.txt', JSON.stringify(data));
		});
	}

	addChieve(chieveName, username) {
		fs.readFile('chieves.txt', function (err, data) {
			if (err) {
				console.error(err);
			}
			data = JSON.parse(data);
			let stuff = [];
			for (let key in data) {
				if (Tools.toId(key) === Tools.toId(username)) {
					stuff = data[key];
					if (stuff.indexOf(chieveName) !== -1) return;
					stuff.push(chieveName);
					data[key] = stuff;
					break;
				}
			}
			if (stuff.length === 0) {
				data[username] = [chieveName];
			}
			Users.get(username).say("You got the chieve " + chieveName + " and received 500 bits!");
			fs.writeFile('chieves.txt', JSON.stringify(data));
			Games.addBits(500, username); // eslint-disable-line no-use-before-define
		});
	}

	follows(mon, paramList) {
		let stuff = data[mon]["stuff"];
		for (let i = 0; i < paramList.length; i++) {
			if (stuff.indexOf(paramList[i]) === -1) return false;
		}
		return true;
	}
	solveParam(numParams, mons, user) {
		let monsList = mons.split(", ");
		let sharedParams = [];
		let firstParams = data[monsList[0]]["stuff"];
		for (let i = 0; i < firstParams.length; i++) {
			let bad = false;
			for (let j = 1; j < monsList.length; j++) {
				if (data[monsList[j]]["stuff"].indexOf(firstParams[i]) === -1) {
					bad = true;
					break;
				}
			}
			if (!bad) {
				sharedParams.push(firstParams[i]);
			}
		}
		console.log(sharedParams);
		if (numParams === 2) {
			for (let i = 0; i < sharedParams.length; i++) {
				for (let j = i + 1; j < sharedParams.length; j++) {
					let paramsList = [sharedParams[i], sharedParams[j]];
					let found = false;
					for (let mon in data) {
						if (this.follows(mon, paramsList) && monsList.indexOf(mon) === -1) {
							let dexEntry = Tools.data.pokedex[Tools.toId(mon)];
							if (dexEntry.baseSpecies) {
								let otherName = dexEntry.baseSpecies;
								if (this.follows(otherName, paramsList) && monsList.indexOf(otherName) === -1) {
									found = true;
								}
							} else {
								console.log(paramsList.join(", ") + " " + mon);
								found = true;
							}
							if (found) break;
						}
					}
					if (!found) {
						user.say("A possible set of params is " + paramsList.join(", "));
						return;
					}
				}
			}
		} else if (numParams === 3) {
			for (let i = 0; i < sharedParams.length; i++) {
				for (let j = i + 1; j < sharedParams.length; j++) {
					for (let k = j + 1; k < sharedParams.length; k++) {
						let paramsList = [sharedParams[i], sharedParams[j], sharedParams[k]];
						let found = false;
						for (let mon in data) {
							if (this.follows(mon, paramsList) && monsList.indexOf(mon) === -1) {
								let dexEntry = Tools.data.pokedex[Tools.toId(mon)];
								if (dexEntry.baseSpecies) {
									let otherName = dexEntry.baseSpecies;
									if (this.follows(otherName, paramsList) && monsList.indexOf(otherName) === -1) {
										found = true;
									}
								} else {
									found = true;
								}
								if (found) break;
							}
						}
						if (!found) {
							user.say("A possible set of params is " + paramsList.join(", "));
							return;
						}
					}
				}
			}
		} else if (numParams === 4) {
			for (let i = 0; i < sharedParams.length; i++) {
				for (let j = i + 1; j < sharedParams.length; j++) {
					for (let k = j + 1; k < sharedParams.length; k++) {
						for (let l = k + 1; l < sharedParams.length; l++) {
							let paramsList = [sharedParams[i], sharedParams[j], sharedParams[k], sharedParams[l]];
							let found = false;
							for (let mon in data) {
								if (this.follows(mon, paramsList) && monsList.indexOf(mon) === -1) {
									let dexEntry = Tools.data.pokedex[Tools.toId(mon)];
									if (dexEntry.baseSpecies) {
										let otherName = dexEntry.baseSpecies;
										if (this.follows(otherName, paramsList) && monsList.indexOf(otherName) === -1) {
											found = true;
										}
									} else {
										found = true;
									}
									if (found) break;
								}
							}
							if (!found) {
								user.say("A possible set of params is " + paramsList.join(", "));
								return;
							}
						}
					}
				}
			}
		}
		user.say("I couldn't find an answer for your param rip.");
	}
}

let Games = new GamesManager();


Games.Minigame = Minigame;
Games.Game = Game;
Games.Player = Player;

module.exports = Games;
