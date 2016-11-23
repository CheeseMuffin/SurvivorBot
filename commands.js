/**
 * Commands
 * BotStuff - https://github.com/CheeseMuffin/BotStuff
 *
 * This file contains the base commands for Cassius.
 *
 * @license MIT license
 */

'use strict';

let commands = {
	// Developer commands
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
};

module.exports = commands;
