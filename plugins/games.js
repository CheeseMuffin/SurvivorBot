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
	data[species]["stuff"].push(Tools.generation(mon.num));
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
		this.say("Hosting a game of " + this.name + "! " + (this.freeJoin ? " (free join)" : "If you would like to play, use the command ``" + Config.commandCharacter + "join``."));
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
		if (this.playerCount < 1) {
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

	numPlayers() {
		let numPlayers = 0;
		for (let userID in this.players) {
			let player = this.players[userID];
			if (!player.eliminated) numPlayers++;
		}
		return numPlayers;
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

	remainingPlayer() {
		for (let userID in this.players) {
			let player = this.players[userID];
			if (!player.eliminated) return player;
		}
		return null;
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
		if (!(user.id in this.players)) return;
		this.removePlayer(user);
		user.say("You have left the game of " + this.name + "!");
		if (typeof this.onLeave === 'function') this.onLeave(user);
	}

	pl() {
		let players = [];
		for (let userID in this.players) {
			players.push(this.players[userID].name);
		}
		this.room.say("**Players (" + this.playerCount + ")**: " + players.join(", "));
	}
	handlehtml(message) {
		return;
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

class Plugin {
	constructor() {
		this.name = 'Games';
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
			file = require('./../games/' + file);
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
		room.game.signups();
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

let Games = new Plugin();

let commands = {
	gamesignups: 'signups',
	signups: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+')) return;
		Games.createGame(target, room);
	},
	startgame: 'start',
	start: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		if (typeof room.game.start === 'function') room.game.start();
	},

	pastgames: function (target, room, user) {
		if (!user.hasRank(room, '+')) return;
		if (room.name in Games.pastGames) {
			let curGames = Games.pastGames[room.name];
			curGames.reverse();
			room.say("**[Recent games]** " + curGames.join(", "));
		}
	},
	endgame: 'end',
	end: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+')) return;
		if (!room.game) {
			if (!room.canVote) return;
			room.say("Voting was ended.");
			room.canVote = false;
			clearTimeout(room.timeout);
		} else {
			room.game.forceEnd();
		}
	},

	solveparam: 'sp',
	sp: function (target, room, user) {
		if (!user.isDeveloper() || room !== user) return;
		let stuff = target.split('|');
		let spaceIndex = stuff[0].indexOf(" ");
		let paramNum = Math.floor(stuff[0].substr(0, spaceIndex));
		Games.solveParam(paramNum, stuff[1].trim(), user);
	},
	
	solveport: function (target, room, user) {
		if (!user.isDeveloper() || room !== user) return;
		let ports = target.split("]");
		let realPorts = [];
		for (let i = 0; i < ports.length; i++) {
			realPorts.push(ports[i].split(" "));
		}
		let actualPorts = [];
		for (let i = 0; i < realPorts.length; i++) {
			actualPorts.push([]);
			for (let j = 0; j < realPorts[i].length; j++) {
				let cur = realPorts[i][j];
				if (cur !== "") {
					actualPorts[i].push(Tools.toId(cur));
				}
			}
			if (actualPorts[i].length === 0) {
				actualPorts.splice(i,1);
			}
		}
		let satisfyingList = [];
		for (let i = 0; i< actualPorts.length; i++) {
			satisfyingList.push([]);
			if (actualPorts[i].length === 3) {
				if (actualPorts[i][2] === 'pokemon') {
					for (let monName in Tools.data.pokedex) {
						let mon = Tools.data.pokedex[monName];
						if (mon.baseSpecies || mon.num < 0) continue;
						if (actualPorts[i][0] === 'gen') {
							if (Tools.generation(mon.num) === Math.floor(actualPorts[i][1])) {
								satisfyingList[i].push(monName);
							}
						}
						else if (actualPorts[i][1] === 'type') {
							let found = false;
							for (let k = 0; k < mon.types.length; k++) {
								if (Tools.toId(mon.types[k]) === actualPorts[i][0]) {
									found = true;
									break;
								}
							}
							if (found) satisfyingList[i].push(monName);
						}
					}	
				}
				else {
					console.log("in here");
					for (let moveName in Tools.data.moves) {
						let move = Tools.data.moves[moveName];
						if (Tools.toId(move.type) === actualPorts[i][0]) {
							satisfyingList[i].push(moveName);
						}
					}
				}
			}
			else {
				for (let monName in Tools.data.pokedex) {
					let mon = Tools.data.pokedex[monName];
					if (mon.baseSpecies || mon.num < 0) continue;
					if (Tools.toId(mon.color) === actualPorts[i][0]) {
						satisfyingList[i].push(monName);
					}
				}
			}
		}
		console.log(satisfyingList);
		if (satisfyingList.length === 2) {
			for (let i = 0; i < satisfyingList[0].length; i++) {
				for (let j = 0; j < satisfyingList[1].length; j++) {
					let t1 = satisfyingList[0][i], t2 = satisfyingList[1][j];
					let ans = Tools.isPort(t1, t2)
					if (Tools.isPort(t1, t2)) {
						user.say("A possible answer is " + ans);
						return;
					}
				}
			}
			user.say("I couldn't find an answer for your port rip.");
		} else if (satisfyingList.length === 3) {
			for (let i = 0; i < satisfyingList[0].length; i++) {
				for (let j = 0; j < satisfyingList[1].length; j++) {
					let t1 = satisfyingList[0][i], t2 = satisfyingList[1][j];
					let ans1 = Tools.isPort(t1, t2);
					if (ans1) {
						for (let k = 0; k < satisfyingList[2].length; k++) {
							let t3 = satisfyingList[2][k];
							let ans2 = Tools.isPort(ans1, t3);
							if (ans2) {
								user.say("A possible answer is " + ans2);
								return;
							}
						}
					}
				}
			}
		} else if (satisfyingList.length === 4) {
			for (let i = 0; i < satisfyingList[0].length; i++) {
				for (let j = 0; j < satisfyingList[1].length; j++) {
					let t1 = satisfyingList[0][i], t2 = satisfyingList[1][j];
					let ans1 = Tools.isPort(t1, t2);
					if (ans1) {
						for (let k = 0; k < satisfyingList[2].length; k++) {
							let t3 = satisfyingList[2][k];
							let ans2 = Tools.isPort(ans1, t3);
							if (ans2) {
								for (let l = 0; l < satisfyingList[3].length; l++) {
									let t4 = satisfyingList[3][l];
									let ans3 = Tools.isPort(ans2, t4);
									if (ans3) {
										user.say("A possible answer is " + ans3);
									}
								}
							}
						}
					}
				}
			}
		}
	},
	players: 'pl',
	pl: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		if (typeof room.game.pl === 'function') room.game.pl();
	},
	pg: 'g',
	pokemonguess: 'g',
	guess: 'g',
	g: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.guess === 'function') room.game.guess(target, user);
	},

	r: 'roll',
	roll: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.roll === 'function') room.game.roll(target, user);
	},

	pair: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.pair === 'function') room.game.pair(target, user);
	},

	joingame: 'join',
	join: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.join === 'function') room.game.join(user);
	},
	leavegame: 'leave',
	leave: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.leave === 'function') room.game.leave(user);
	},

	choose: function (target, room, user) {
		for (room in Rooms.rooms) {
			let realRoom = Rooms.rooms[room];
			if (realRoom.game && typeof realRoom.game.choose === 'function') realRoom.game.choose(user, target);
		}
	},

	suspect: function (target, room, user) {
		if (room.name !== user.name) return;
		let firstComma = target.indexOf(',');
		if (firstComma === -1) {
			user.say("The correct syntax is " + Config.commandCharacter + "suspect user, pokemon, room");
			return;
		}
		let userID = target.substr(0, firstComma);
		target = target.substr(firstComma + 1);
		if (target.charAt(0) === ' ') {
			target = target.substr(1);
		}
		for (room in Rooms.rooms) {
			let realRoom = Rooms.rooms[room];
			if (realRoom.game && typeof realRoom.game.suspect === 'function') realRoom.game.suspect(user, userID, target);
		}
	},

	suggest: 'vote',
	vote: function (target, room, user) {
		if (room.game) return;
		if (!room.canVote) {
			if (!user.hasRank(room, '+')) return;
			let goodGames = [];
			for (let fileID in Games.games) {
				let game = Games.games[fileID];
				if (!(Games.pastGames[room.name] && Games.pastGames[room.name].indexOf(game.name) !== -1) && !game.minigame && game.name !== "Pikachu's Pool Party" && game.name !== "PokeWars") {
					console.log(game.name);
					goodGames.push(game.name);
				}
			}
			goodGames = Tools.shuffle(goodGames);
			let realGoodGames = [];
			for (let i = 0; i < 3; i++) {
				realGoodGames.push(goodGames[i]);
			}
			room.say("Vote for the next game with ``" + Config.commandCharacter + "vote [game]!`` Chuffin suggests: " + realGoodGames.join(", "));
			room.votes = new Map();
			room.canVote = true;
			room.timeout = setTimeout(() => room.doGame(), 30 * 1000);
		} else {
			room.vote(target, user);
		}
	},

	steal: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.steal === 'function') room.game.steal(target, user);
	},

	count: function (target, room, user) {
		if (!room.game) {
			if ((!user.hasRank(room, '+') && room !== user) || Tools.toId(target) !== "start") {
				return;
			}
			Games.createMiniGame("count", room);
		} else if (typeof room.game.count === 'function') {
			room.game.count(target, user);
		}
	},
	sit: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.sit === 'function') room.game.sit(target, user);
	},

	pick: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.pick === 'function') room.game.pick(target, user);
	},

	play: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.play === 'function') room.game.play(target, user);
	},

	coins: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.getCoins === 'function') room.game.getCoins(user);
	},
	
	stars: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.getStars === 'function') room.game.getStars(user);
	},

	exclude: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.exclude === 'function') room.game.exclude(target, user);
	},

	leaveshop: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.leaveshop === 'function') room.game.leaveshop(user);
	},

	buy: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.buy === 'function') room.game.buy(target, user);
	},

	guessExclude: 'ge',
	ge: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.ge === 'function') room.game.ge(target, user);
	},

	games: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+')) return;
		this.say("List of games: http://hastebin.com/moruzomaye.md");
	},

	hit: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.hit === 'function') room.game.hit(target, user);
	},

	destroy: function (target, room, user) {
		for (room in Rooms.rooms) {
			let realRoom = Rooms.rooms[room];
			if (realRoom.game && typeof realRoom.game.destroy === 'function') realRoom.game.destroy(user, target);
		}
	},

	attack: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.attack === 'function') room.game.attack(target, user);
	},

	hand: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.hand === 'function') room.game.hand(target, user);
	},

	yes: 'y',
	y: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.yes === 'function') room.game.yes(user);
	},

	no: 'n',
	n: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.no === 'function') room.game.no(user);
	},

	nominate: 'nom',
	nom: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.nom === 'function') room.game.nom(target, user);
	},
	eliminate: 'elim',
	elim: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.elim === 'function') room.game.elim(target, user);
	},
	autostart: function (target, room, user) {
		if (!room.game || !user.hasRank(room, '+')) return;
		if (typeof room.game.autostart === 'function') room.game.autostart(target);
	},

	playercap: 'cap',
	cap: function (target, room, user) {
		if (!room.game || !user.hasRank(room, '+')) return;
		if (typeof room.game.cap === 'function') room.game.cap(target);
	},

	order: function (target, room, user) {
		if (!user.hasRank(room, '+')) return;
		Games.createMiniGame("order", room);
	},

	il: function (target, room, user) {
		if (!user.hasRank(room, '+')) return;
		Games.createMiniGame("il", room);
	},

	mashup: function (target, room, user) {
		if (!user.hasRank(room, '+') || room.game) return;
		Games.createMiniGame("mashup", room);
	},

	say: function (target, room, user) {
		if (!user.isDeveloper()) return;
		room.say(target);
	},

	forceguess: function (target, room, user) {
		if (!user.isDeveloper()) return;
		room.say(Config.commandCharacter + "guess " + target);
	},

	dobattle: function (target, room, user) {
		if (!user.isDeveloper()) return;
		Client.send('|/utm null');
	},

	jointourney: function (target, room, user) {
		if (!user.isDeveloper()) return;
		room.say("/tour join");
	},

	git: function (target, room, user) {
		if (!user.hasRank(room, '+')) return;
		room.say("Git source code: www.github.com/CheeseMuffin/BotStuff");
	},

	bits: function (target, room, user) {
		if (!user.hasRank(room, '+') && room.name !== user.name) return;
		fs.readFile('bits.txt', function (err, data) {
			if (err) {
				return console.error(err);
			}
			let userID;
			if (target) {
				userID = Users.get(Tools.toId(target)).name;
			} else {
				userID = user.name;
			}
			data = JSON.parse(data);
			let curBits = 0;
			let items = Object.keys(data).map(function (key) {
				return [key, data[key]];
			});
			items.sort(function (first, second) {
				return second[1] - first[1];
			});
			let i;
			for (i = 0; i < items.length; i++) {
				if (Tools.toId(userID) === Tools.toId(items[i][0])) {
					curBits = items[i][1];
					break;
				}
			}
			if (userID === user.name) {
				if (curBits === 0) {
					room.say("You currently don't have any bits!");
				} else {
					room.say("You are #" + (i + 1) + " on the leaderboard with " + curBits + " bits!");
				}
			} else {
				if (curBits === 0) {
					room.say("**" + userID + "** does not have any bits!");
				} else {
					room.say("**" + userID + "** is currently #" + (i + 1) + " on the leaderboard with " + curBits + " bits!");
				}
			}
		});
	},

	topbits: 'top',
	top: function (target, room, user) {
		if (!user.hasRank(room, '+') && room.name !== user.name) return;
		fs.readFile('bits.txt', function (err, data) {
			if (err) {
				console.error(err);
			}
			data = JSON.parse(data);
			let items = Object.keys(data).map(function (key) {
				return [key, data[key]];
			});
			items.sort(function (first, second) {
				return second[1] - first[1];
			});
			let strs = [];
			let realNum = 5;
			let realTarget = Math.floor(target);
			if (realTarget) {
				realNum = realTarget;
			}
			if (realNum < 5) {
				realNum = 5;
			}
			if (realNum > items.length) {
				realNum = items.length;
			}
			for (let i = Math.max(0, realNum - 5); i < realNum; i++) {
				strs.push(i + 1 + Tools.getSuffix(i + 1) + ": __" + items[i][0] + "__(" + items[i][1] + ")");
			}
			room.say("``Top " + realNum + " of " + items.length + "``: " + strs.join(", "));
		});
	},

	chieve: function (target, room, user) {
		if (!user.hasRank(room, '+') && room.name !== user.name) return;
		fs.readFile("chieveList.txt", function (err, data) {
			if (err) {
				console.error(err);
			}
			data = JSON.parse(data);
			let found = false;
			for (let name in data) {
				if (Tools.toId(name) === Tools.toId(target)) {
					room.say(name + ": " + data[name]);
					found = true;
					break;
				}
			}
			if (!found) {
				room.say("Please enter a valid achievement.");
			}
		});
	},
	
	say: function (target, room, user) {
		if (!user.isDeveloper()) return;
		room.say(target);
	},

	chieves: function (target, room, user) {
		if (!user.hasRank(room, '+') && room.name !== user.name) return;
		fs.readFile("chieves.txt", function (err, data) {
			let userID;
			if (target) {
				userID = target;
			} else {
				userID = user.name;
			}
			let found = false;
			data = JSON.parse(data);
			for (let key in data) {
				if (Tools.toId(userID) === Tools.toId(key)) {
					room.say((userID === user.name ? "Your " : userID + "'s ") + "achievements: " + data[key].join(", "));
					found = true;
					break;
				}
			}
			if (!found) {
				room.say(userID + " hasn't unlocked any achievements.");
			}
		});
	},
};
Games.Minigame = Minigame;
Games.Game = Game;
Games.Player = Player;
Games.commands = commands;

module.exports = Games;
