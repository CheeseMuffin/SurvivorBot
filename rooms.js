/**
 * Rooms
 * BotStuff - https://github.com/CheeseMuffin/BotStuff
 *
 * This file tracks information about the rooms that the bot joins.
 *
 * @license MIT license
 */

'use strict';

class Room {
	constructor(id) {
		this.id = id;
		this.clientId = id === 'lobby' ? '' : id;
		this.canVote = false;
		this.users = new Map();
		this.votes = new Map();
	}

	vote(gameName, user) {
		let realName;
		for (let realGame in Games.aliases) {
			//console.log(realGame);
			if (Tools.toId(realGame) === Tools.toId(gameName)) {
				realName = realGame;
			} else {
				let aliases = Games.aliases[realGame];
				let found = false;
				for (let i = 0, len = aliases.length; i < len; i++) {
					if (Tools.toId(aliases[i]) === Tools.toId(gameName)) {
						realName = realGame;
						found = true;
						break;
					}
				}
				if (found) break;
			}
		}
		if (!realName) {
			user.say("That is not a valid game!");
		} else {
			if (Games.games[Tools.toId(realName)].minigame) {
				user.say("You cannot suggest a minigame.");
				return;
			}
			let blah = this.votes.get(user);
			console.log(user.name + " suggested " + blah);
			if (Games.pastGames[this.name] && Games.pastGames[this.name].indexOf(realName) !== -1) {
				user.say(realName + " is on the past games list and cannot be voted for. Please choose something else!");
				return;
			} else if (blah) {
				user.say("Your suggestion has been changed to " + realName);
			} else {
				user.say("Thanks for suggesting " + realName + ".");
			}
			this.votes.set(user, realName);
		}
	}

	doGame() {
		this.canVote = false;
		this.say("**Time's up!**");
		let games = [];
		this.votes.forEach(function (key, value, map) {
			games.push(key);
		});
		if (games.length === 0) {
			for (let key in Games.aliases) {
				games.push(key);
			}
		}
		games = Tools.shuffle(games);
		if (this.name in Games.pastGames) {
			let cur = Games.pastGames[this.name];
			cur.push(games[0]);
			if (cur.length > 8) {
				cur.splice(0, 1);
			}
			Games.pastGames[this.name] = cur;
		} else {
			Games.pastGames[this.name] = [games[0]];
		}
		console.log(Tools.toId(games[0]));
		this.game = new Games.games[Tools.toId(games[0])].game(this); // eslint-disable-line new-cap
		this.game.signups();
	}

	onJoin(user, rank) {
		//this.say("Hello " + user.name);
		this.users.set(user, rank);
		user.rooms.set(this, rank);
	}

	onLeave(user) {
		this.users.delete(user);
		user.rooms.delete(this);
	}

	onRename(user, newName) {
		let rank = newName.charAt(0);
		newName = Tools.toName(newName);
		let id = Tools.toId(newName);
		let oldName = user.name;
		if (id === user.id) {
			user.name = newName;
		} else {
			delete Users.users[user.id];
			if (Users.users[id]) {
				user = Users.users[id];
				user.name = newName;
			} else {
				user.name = newName;
				user.id = id;
				Users.users[id] = user;
			}
		}
		this.users.set(user, rank);
		user.rooms.set(this, rank);
		if (this.game) this.game.renamePlayer(user, oldName);
	}

	say(message) {
		if (!message) return;
		if (message.charAt(0) !== '!') message = Tools.normalizeMessage(message);
		//console.log("I'm saying " + message + " in room " + this.id + "!");
		Client.send(this.clientId + '|' + message);
		Client.send(this.clientId + '|' + '/asdf');
	}

	html(message) {
		if (!message) return;
		Client.send(this.clientId + " |!htmlbox " + message);
		Client.send(this.clientId + '|' + '/asdf');
	}
	parseMessage(messageType, splitMessage) {
		let user, rank, stuff;
		switch (messageType) {
		case 'J':
		case 'j':
			user = Users.add(splitMessage[0]);
			if (!user) return;
			this.onJoin(user, splitMessage[0].charAt(0));
			break;
		case 'L':
		case 'l':
			user = Users.add(splitMessage[0]);
			if (!user) return;
			this.onLeave(user);
			break;
		case 'N':
		case 'n':
			user = Users.add(splitMessage[1]);
			if (!user) return;
			this.onRename(user, splitMessage[0]);
			break;
		case 'c':
			user = Users.get(splitMessage[0]);
			if (!user) return;
			rank = splitMessage[0].charAt(0);
			if (user.rooms.get(this) !== rank) user.rooms.set(this, rank);
			if (user.id === Users.self.id) return;
			CommandParser.parse(splitMessage.slice(1).join('|'), this, user);
			break;
		case 'c:':
			user = Users.get(splitMessage[1]);
			if (!user) return;
			rank = splitMessage[1].charAt(0);
			if (user.rooms.get(this) !== rank) user.rooms.set(this, rank);
			//if (user.id === Users.self.id) return;
			CommandParser.parse(splitMessage.slice(2).join('|'), this, user, splitMessage[0] * 1000);
			break;

		case 'html':
			if (this.game && typeof this.game.handlehtml === 'function') {
				this.game.handlehtml(splitMessage);
			}
			break;

		case 'tournament':
			Tournaments.handleMessage(splitMessage, this); // eslint-disable-line no-undef
			break;

		case 'updatechallenges':
			stuff = JSON.parse(splitMessage[0]);
			console.log(stuff.challengesFrom);
			let name = Object.keys(stuff.challengesFrom)[0];
			let format = stuff.challengesFrom[name];
			console.log(format + " " + name);
			if (format === 'challengecup1v1') {
				Users.add(name).say("/accept");
			}
			break;
		case 'request':
			stuff = JSON.parse(splitMessage[0]);
			Battles.handleRequest(stuff, this); // eslint-disable-line no-undef
			break;
		case 'turn':
			console.log("hi");
			stuff = JSON.parse(splitMessage[0]);
			Battles.move(this, stuff); // eslint-disable-line no-undef
			break;
		case 'switch':
			stuff = splitMessage[0];
			Battles.handleSwitch(this, stuff); // eslint-disable-line no-undef
			break;
		}
	}
}

class Rooms {
	constructor() {
		this.rooms = {};
	}

	get(id) {
		if (id && id.users) return id;
		return this.rooms[id];
	}

	add(id) {
		let room = this.get(id);
		if (!room) {
			room = new Room(id);
			this.rooms[id] = room;
		}
		return room;
	}

	destroy(room) {
		room = this.get(room);
		if (!room) return;
		room.users.forEach(function (value, user) {
			user.rooms.delete(room);
		});
		delete this.rooms[room.id];
	}
}

module.exports = new Rooms();
