# connect4ai
This repository contains:
* a Game file that is an API to play a game of connect4;
* the file `src/index.js` that uses this API to train a neural network.

## Installation
Clone the repo and run `npm install` in the root folder to install dependencies.

## Train the network
Every parameter is included in `src/index.js`.

Run this script by running `npm run api-build`.

At the end of the training, weights are written to `networkWeights.json`. These are then used in https://github.com/AlexandreSi/connect4app to be the bot.