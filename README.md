# BotStuff
[![Build Status](https://travis-ci.org/sirDonovan/Cassius.svg)](https://travis-ci.org/sirDonovan/Cassius)

A bot for [Pokemon Showdown][1].

  [1]: https://github.com/Zarel/Pokemon-Showdown

## Installation
BotStuff requires [Node.js][2] version 6.0.0 or later and a command line (e.g. `Command Prompt` on Windows or `Terminal` on Mac OS/Linux) to run. Once you have compatible software, complete installation by following these steps:

1. Obtain a copy of BotStuff

  You can do this through the [GitHub client][3] by clicking the "Save" button on the home page of the repository (which is to the left of the "Download ZIP" button), download a .zip file with the aforementioned button, or clone the repository with the following [Git][4] command:
  
  `git clone https://github.com/CheeseMuffin/BotStuff.git`

  [2]: https://nodejs.org/
  [3]: https://desktop.github.com/
  [4]: https://git-scm.com/

2. Navigate to the root directory

  The remaining steps will take place in the root directory of your BotStuff files. Navigate there with the command:

  `cd DIRECTORY`
  
  Replace `DIRECTORY` with the filepath to your directory (e.g. `C:\Users\CheeseMuffin\GitHub\BotStuff`).

3. Install dependencies

  Run the following command to install required dependencies:

  `npm install --production`

  If you plan to contribute to development, run the command without the `--production` flag to also install dependencies used for testing.

4. Set up the config file

  Copy and paste the `config-example.js` file, rename it to `config.js`, and open it in your text editor to enter your desired information.

From this point on, you can start the bot by running the following command:

  `node app.js`

## Development

  Issues and pull requests are welcomed! When submitting a pull request, be sure that you have installed and ran ESLint to check for errors in your code.

#### Credits

  * Quinton Lee ([@sirDonovan][5]) - Developer of original framework
  * Luke Harmon([@CheeseMuffin][5]) - Adding games
  * [Pokemon Showdown][1] - In-game data files
  
  [5]: https://github.com/CheeseMuffin

## License

  BotStuff is distributed under the terms of the [MIT License][6].

  [6]: https://github.com/CheeseMuffin/BotStuff/blob/master/LICENSE
