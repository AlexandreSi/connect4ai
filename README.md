# connect4ai
This repository contains:
* a Game file that is an API to play a game of connect4;
* a NeuralNetwork file that allows to use 2 different kinds of networks;
* a Play file that plays a ame of connect4 until the end of a game;
* a QLearning file that conducts the training on all the plays of the winner;
* a Helper file that brings useful functions;
* the file `src/index.js` that trains a neural network.

## Installation
Clone the repo and run `npm install` in the root folder to install dependencies.

## Train the network
Every parameter is included in `src/index.js`.

Included parameters are not the best set for an optimized training.

Run this script by running `npm run train`.

At the end of the training, weights are written to `networkWeightsNN.json` or `networkWeightsCNN.json`. These are then used in https://github.com/AlexandreSi/connect4app to be the bots.