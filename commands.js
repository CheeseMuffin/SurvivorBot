/**
 * Commands
 * BotStuff - https://github.com/CheeseMuffin/BotStuff
 *
 * This file contains the base commands for BotStuff.
 *
 * @license MIT license
 */

'use strict';
const fs = require('fs');
let commands = {
	js: 'eval',
	eval: function (target, room, user) {
		if (!user.isDeveloper()) return;
		try {
			target = eval(target);
			this.say(JSON.stringify(target));
		} catch (e) {
			this.say(e.name + ": " + e.message);
		}
	},
	gamesignups: 'signups',
	signups: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+')) return;
		console.log(Config.games);
		if (!Config.games || !Config.games.indexOf(room.id) === -1) return this.say("Games are not enabled for this room.");
		Games.createGame(target, room);
		room.game.signups();
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
				actualPorts.splice(i, 1);
			}
		}
		let satisfyingList = [];
		for (let i = 0; i < actualPorts.length; i++) {
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
						} else if (actualPorts[i][1] === 'type') {
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
				} else {
					console.log("in here");
					for (let moveName in Tools.data.moves) {
						let move = Tools.data.moves[moveName];
						if (Tools.toId(move.type) === actualPorts[i][0]) {
							satisfyingList[i].push(moveName);
						}
					}
				}
			} else {
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
					let ans = Tools.isPort(t1, t2);
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

	bid: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.bid === 'function') room.game.bid(target, user);
	},

	wager: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.wager === 'function') room.game.wager(target, user);
	},

	select: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.select === 'function') room.game.select(target, user);
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
		if ((!user.hasRank(room, '+') && room !== user) || room.game) return;
		Games.createMiniGame("mashup", room);
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

	bits: 'points',
	points: function (target, room, user) {
		if (room !== user) return;
		let targetUserid = target ? Tools.toId(target) : user.id;
		let points = [];
		user.rooms.forEach((rank, room) => {
			if (!(room.id in Storage.databases) || !('leaderboard' in Storage.databases[room.id])) return;
			if (targetUserid in Storage.databases[room.id].leaderboard) points.push("**" + room.id + "**: " + Storage.databases[room.id].leaderboard[targetUserid].points);
		});
		if (!points.length) return this.say((target ? target.trim() + " does not" : "You do not") + " have points on any leaderboard.");
		this.say(points.join(" | "));
	},

	topbits: 'top',
	top: function (target, room, user) {
		if (!user.hasRank(room, '+') && room !== user) return;
		if (!target) target = 'groupchat-ladymonita-theworkshop';
		if (!(target in Storage.databases) || !('leaderboard' in Storage.databases[target])) return;
		let items = Object.keys(Storage.databases[target].leaderboard).map(function (key) {
			return [key, Storage.databases[target].leaderboard[key].points];
		});
		let strs = [];
		let realNum = 5;
		if (realNum > items.length) {
			realNum = items.length;
		}
		for (let i = Math.max(0, realNum - 5); i < realNum; i++) {
			strs.push(i + 1 + Tools.getSuffix(i + 1) + ": __" + items[i][0] + "__(" + items[i][1] + ")");
		}
		room.say("``Top " + realNum + " of " + items.length + "``: " + strs.join(", "));
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
		if (!user.hasRank(room, '+') && room !== user) return;
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

module.exports = commands;
