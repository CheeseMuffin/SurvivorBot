/**
 * Games
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the game system and related commands for Cassius.
 *
 * @license MIT license
 */

'use strict';

const fs = require('fs');

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
	
	winUser(numBits,player) {
		player.say("You were awarded " + numBits + " bits for winning the game! You can use the command ``" + Config.commandCharacter + "bits`` to check your bits.");
		Games.addBits(numBits,player.name);
	}
	addChieve(chieveName,username) {
		fs.readFile('chieves.txt', function (err,data) {
			if (err) {
				console.error(err);
			}
			data = JSON.parse(data);
			let stuff = [];
			for (let key in data) {
				if (Tools.toId(key) === Tools.toId(username)) {
					stuff = data[key];
					if (stuff.indexOf(chieveName) !== -1) return;
					stuff.add(chieveName);
					data[key] = stuff;
					break;
				}
			}
			if (stuff.length === 0) {

				data[username] = [chieveName];
			}
			Users.get(username).say("You got the chieve " + chieveName + " and received 500 bits!");
			fs.writeFile('chieves.txt', JSON.stringify(data));
			Games.addBits(500, username);
		});
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
		if (user.id in this.players || this.started) return;
		if (this.freeJoin) {
			user.say("This game does not require you to join!");
			return;
		}
		this.addPlayer(user);
		user.say('You have joined the game of ' + this.name + '!');
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
		room.game.signups();
	}
	
	addBits(numBits,username) {
		fs.readFile('bits.txt',function (err, data) {
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
	endgame: 'end',
	end: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		room.game.forceEnd();
	},

	players: 'pl',
	pl: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		if (typeof room.game.pl === 'function') room.game.pl();
	},

	guess: 'g',
	g: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.guess === 'function') room.game.guess(target, user);
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

	steal: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.steal === 'function') room.game.steal(target, user);
	},

	count: function (target, room, user) {
		if (!room.game) {
			if (!user.hasRank(room, '+') || Tools.toId(target) !== "start") {
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

	exclude: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.exclude === 'function') room.game.exclude(target, user);
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

	forcejoin: function (target, room, user) {
		if (!user.isDeveloper()) return;
		room.say(Config.commandCharacter + "join");
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
		fs.readFile('bits.txt',function (err,data) {
			
			if (err) {
				return console.error(err);
			}
			let userID,username;
			if (target) {
				userID = Users.get(Tools.toId(target)).name;
			}
			else {
				userID = user.name;
			}	
			data = JSON.parse(data);
			let curBits = 0;
			var items = Object.keys(data).map(function(key) {
				return [key, data[key]];
			});
			items.sort(function(first, second) {
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
					}
					else {
						room.say("You are #" + (i + 1) + " on the leaderboard with " + curBits + " bits!");
					}
				}
				else {
					if (curBits === 0) {
						room.say("**" + userID + "** does not have any bits!");
					}
					else {
						room.say("**" + userID + "** is currently #" + (i+1) + " on the leaderboard with " + curBits + " bits!");
					}
				}
		});
	},
	
	topbits: 'top',
	top: function (target, room, user) {
		if (!user.hasRank(room, '+') && room.name !== user.name) return;
		fs.readFile('bits.txt',function (err,data) {
			
			if (err) {
				console.error(err);
			}
			data = JSON.parse(data);
			var items = Object.keys(data).map(function(key) {
				return [key, data[key]];
			});
			items.sort(function(first, second) {
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
			
			for (let i = Math.max(0,realNum-5); i < realNum; i++) {
				strs.push(i+1 + Tools.getSuffix(i+1) + ": __" + items[i][0] + "__(" + items[i][1] + ")");
			}
			room.say("``Top " + realNum + " of " + items.length + "``: " + strs.join(", "));
		});
	},
	
	chieve: function (target, room, user) {
		if (!user.hasRank(room, '+') && room.name !== user.name) return;
		fs.readFile("chieveList.txt", function (err,data) {
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
	
	chieves: function (target, room, user) {
		if (!user.hasRank(room, '+') && room.name !== user.name) return;
		fs.readFile("chieves.txt", function (err,data) {
			let userID;
			if (target) {
				userID = target;
			}
			else {
				userID = user.name;
			}
			let found = false;
			data = JSON.parse(data);
			console.log(data);
			console.log(userID);
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
