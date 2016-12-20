/**
 * Commands
 * BotStuff - https://github.com/CheeseMuffin/BotStuff
 *
 * This file contains the base commands for BotStuff.
 *
 * @license MIT license
 */
'use strict';
const gifts = ["A new pair of pants", "A hug C:", "The new copy of sun and moon you were hoping for!"];
const jokes = ["How does a tree go? It leaves.",
			  // "Why didn't the skeleton go to the party? He had no-body to dance with!",
			  // "Why didn't the skeleton cross the road? Because he didn't have the guts!",
			   '"Somebody told me you remind them of an owl." "Who?"',
			   "How do you make an octopus laugh? With ten-tickles!",
			   "What's an octupus' favorite dessert? Octo-pi!",
			   //"This joke is like a bar at a wedding; it has no punchline.",
			   'There were two twins named Juan and Amal. I saw a picture of Juan, and wanted to see Amal to compare them, but my friend said, "once you\'ve seen Juan you\'ve seen Amal.',
			   "What do you call an alligator in a vest? An investigator!",
			   //"Whats a ghosts favorite fruit? Booberries.",
			  // "Whats a vampires favorite fruit? Necktarines.",
			   "What do you get when you cross a snowman and a vampire? Frostbite.",
			   "What do you call it when you Santa stops moving? Santa Pause."
				]

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
	
	roomsay: function (target, room, user) {
		if (!user.isDeveloper()) return;
		let splitStr = target.split(",");
		if (splitStr.length !== 2) return;
		let realroom = Rooms.get(splitStr[0]);
		if (!realroom) return;
		realroom.say(splitStr[1]);
	},
	pick: function (target, room, user) {
		if (!user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		if (Users.self.hasRank(room, '*')) {
			let stuff = target.split(",");
			let str = "<em>We randomly picked:</em> " + Tools.sample(stuff);
				
			if (room.id === 'survivor') {
				room.say("/addhtmlbox " + str);
			} else {
				room.say("!htmlbox " + str);
			}
		}
		else {
			this.say("!pick " + target);
		}
	},

	hostqueue: function (target, room, user) {
		if (!user.hasRank(room, '%')) return;
		if (Games.hosts.length === 0) {
			return room.say("The hostqueue is empty.");
		}
		room.say("__" + Games.hosts.join("__, __") + "__");
	},

	nexthost: function (target, room, user) {
		if (!user.hasRank(room, '%')) return;
		if (Games.host) {
			return room.say("A game is currently in progress!");
		}
		if (Games.hosts.length === 0) {
			return room.say("The hostqueue is empty.");
		}
		let name = Games.hosts.shift();
		room.say("survgame! " + name + " is hosting! Do ``/me in`` to join!");
		Games.host = Users.get(name);
	},

	host: function (target, room, user) {
		if (!user.hasRank(room, '%')) return;
		let realuser = Users.get(target);
		if (!realuser) return;
		if (Games.host) {
			room.say(realuser.name + " was added to the hostqueue!");
			console.log(Games.hosts);
			Games.hosts.push(realuser.name);
			return;
		}
		Games.host = realuser;
		room.say("survgame! " + realuser.name + " is hosting! Do ``/me in`` to join!");
	},

	rollswitch: 'rs',
	rs: function (target, room, user) {
		if (room !== user && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		room.say("**Roll Switch**: Randomly pick between Golf and Normal rules before each attack");
	},

	golf: function (target, room, user) {
		if (room !== user && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		room.say("**Golf**: Lower rolls win. Opposite of normal survivor");
	},

	gift: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		let userTar = Users.get(target);
		if (!userTar) return;
		this.say("Inside " + userTar.name + "'s gift is ..." + Tools.sample(gifts));
	},
	
	joke: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		room.say(Tools.sample(jokes));
	},

	soccer: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		room.say("I swear, the Z is what makes my name professional xD");
	},
	
	bon: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		room.say("Lol, more like can't dance.");
	},
	
	henka: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		room.say("Henka will be your chef in hungry times!");
	},
	
	swirlyder: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		return;
	},

	themes: function (target, room, user) {
		if (!user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		room.say("The list of game types can be found here: http://survivor-ps.weebly.com/themes-and-more.html");
	},
	timer: function (target, room, user) {
		if (!user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		let x = Math.floor(target);
		if (!x || x >= 120 || (x < 10 && x > 2) || x <= 0) return room.say("The timer must be between 10 seconds and 2 minutes.");
		if (x === 1) x = 60;
		let minutes = Math.floor(x / 60);
		let seconds = x % 60;
		clearTimeout(Games.timeout);
		this.say("Timer set for " + (minutes > 0 ? "1 minute" + (seconds > 0 ? " and " : "") : "") + (seconds > 0 ? ((seconds) + " second" + (seconds > 1 ? "s" : "")) : "") + ".");
		Games.timeout = setTimeout(() => Games.timer(room), x * 1000);
	},
	intro: function (target, room, user) {
		if (room !== user && !user.hasRank(room, '+')) return;
		this.say("Hello, welcome to Survivor! I'm the room bot. 'Survivor' is a luck-based game that uses Pokémon Showdown's /roll feature. For more info, go to: http://survivor-ps.weebly.com/");
	},

	done: function (target, room, user) {
		if (!Games.host || Games.host.id !== user.id) return;
		Games.host = null;
		room.say("Thanks for playing!");
	},

	dehost: function (target, room, user) {
		if (!user.hasRank(room, "%")) return;
		let realuser = Users.get(target);
		if (!realuser) return;
		if (Games.host && Games.host.id === realuser.id) {
			Games.host = null;
			return;
		}
		let i = 0, len = Games.hosts.length;
		for (; i < len; i++) {
			if (realuser.id === Tools.toId(Games.hosts[i])) {
				break;
			}
		}
		if (i !== len) {
			Games.hosts.splice(i, 1);
			return room.say(realuser.name + " was removed from the hosting queue.");
		}
	},

	roll: function (target, room, user) {
		let realtarget = target;
		if (!user.hasRank(room, '+') && (!Games.host || Games.host.id !== user.id)) return;
		let plusIndex = target.indexOf("+");
		let adder = 0;
		if (plusIndex !== -1) {
			adder = parseInt(target.substr(plusIndex + 1));
			let str = adder.toString();
			if (str.length !== (target.substr(plusIndex + 1)).length) return;
			if (!adder) return;
			target = target.substr(0, plusIndex);
		}
		let dIndex = target.indexOf("d");
		let numDice = 1;
		let roll;
		if (dIndex !== -1) {
			numDice = parseInt(target.substr(0, dIndex));;
			if (!numDice) return;
			roll = parseInt(target.substr(dIndex + 1));
			if (!roll) return;	
		} else {
			roll = parseInt(target);
			if (!roll) return;
		}
		let rolls = [];
		let sum = 0;
		for (let i = 0; i < numDice; i++) {
			rolls.push(Tools.random(roll) + 1);
			sum += rolls[i];
		}
		if ((Users.self.hasRank(room, "*"))) {
			if (numDice === 1) {
				let str = "Roll (1 - " + roll + "): " + rolls[0];
				if (room.id === 'survivor') {
					this.say("/addhtmlbox " + str);
				} else {
					this.say("!htmlbox " + str);
				}
			} else {
				let str = numDice + " Rolls (1 - " + roll + "): " + rolls.join(", ") + "<br></br>" + "Sum: " + sum;
				if (room.id === 'survivor') {
					this.say("/addhtmlbox " + str);
				} else {
					this.say("!htmlbox " + str);
				}
			}
		} else {
			room.say("Rolls: " + rolls.join(",") + " || Total: " + (sum + adder));
		}
	},
	gamesignups: 'signups',
	signups: function (target, room, user) {
		if (!user.isDeveloper() && !user.hasRank(room, '+')) return;
		if (!Config.games || !Config.games.indexOf(room.id) === -1) return this.say("Games are not enabled for this room.");
		if (!Games.createGame(target, room)) return;
		room.game.signups();
	},

	startgame: 'start',
	start: function (target, room, user) {
		if ((!user.isDeveloper() && !user.hasRank(room, '+')) || !room.game) return;
		if (typeof room.game.start === 'function') room.game.start();
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

	sanjay: function (target, room, user) {
		if (!user.hasRank(room, '+') && !user.isDeveloper()) return;
		room.say("/me RESIGNs");
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

	destroy: function (target, room, user) {
		for (room in Rooms.rooms) {
			let realRoom = Rooms.rooms[room];
			if (realRoom.game && typeof realRoom.game.destroy === 'function') realRoom.game.destroy(target, user);
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

	say: function (target, room, user) {
		if (!user.isDeveloper()) return;
		room.say(target);
	},
};

module.exports = commands;
