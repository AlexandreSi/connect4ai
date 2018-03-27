// @flow
const convnetjs = require("convnetjs");
const deepqlearn = require('convnetjs/build/deepqlearn');
const connect4 = require('./Game');
const Helper = require('./Helper');
const fs = require('fs');
const savedNetwork = require('../savedNetworkWeightsCNNv2_4x4_pad2_32filter_100k_SGD_HVD_OK_gamma_08_lr5e-4_eps015-030+200k_lr1e-4-6_eps_03_05_gamma08+200k_lr1e-4-6_eps_015_04_gamma08+200k_lr1e-5-7_eps_015_03_gamma08.json');

let myNetwork;

if (false) {
  const layer_defs = [];
  layer_defs.push({type:'input', out_sx:7, out_sy:6, out_depth:2});
  layer_defs.push({type:'conv', sx:4, filters:32, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'fc', num_neurons:60, activation:'relu'});
  layer_defs.push({type:'regression', num_neurons:7});
  myNetwork = new convnetjs.Net();
  myNetwork.makeLayers(layer_defs);
} else {
  myNetwork = new convnetjs.Net();
  myNetwork.fromJSON(savedNetwork);
}

const learningRateInit = 0.00001;

const trainer = new convnetjs.Trainer(
  myNetwork,
  {
    method: 'sgd',
    learning_rate: learningRateInit,
    momentum: 0.9,
    l2_decay: 0.001,
    l1_decay: 0.001,
    batch_size: 1,
  }
);

const gamma = 0.6;
const learnTimes = 100000;
let writeIndex = 0;

for (let i = 0; i < learnTimes; i++) {
  if (i % (learnTimes / 100) === 0) console.log(i);
  const game = new connect4.Game();
  const boardStatesAsPlayer1 = [];
  const boardStatesAsPlayer2 = [];
  const playsAsPlayer1 = [];
  const playsAsPlayer2 = [];
  const epsilon = 0.6;
  const learningRate = learningRateInit / (1 + 99 * i / learnTimes);
  trainer.learning_rate = learningRate;

  let playerIdToPlay = 1;
  let pat = false;
  let winner = 0;
  while (!pat && !winner) {
    const boardArray = game.getConvolutionnalVol(playerIdToPlay);
    // Play
    const explore = !(Math.random() < epsilon);
    let columnIndex;
    if (!explore) {
      const out_q = myNetwork.forward(boardArray).w;
      columnIndex = out_q.indexOf(Math.max(...out_q));
    } else {
      columnIndex = Helper.randomChoice([0, 1, 2, 3, 4, 5, 6]);
    }
    const playAgain = game.playChip(playerIdToPlay, columnIndex);
    // The same player may have to play again if the column he chose was full
    if (!playAgain) {
      // Save board states and plays
      if (playerIdToPlay === 1) {
        boardStatesAsPlayer1.push(boardArray);
        playsAsPlayer1.push(columnIndex);
      } else if (playerIdToPlay === 2) {
        boardStatesAsPlayer2.push(boardArray);
        playsAsPlayer2.push(columnIndex);
      }

      // Check for wins
      const gameState = game.checkForWin();
      switch (gameState) {
        case 0:
          // Nobody won, switch player
          playerIdToPlay = playerIdToPlay === 1 ? 2 : 1;
          break;
        case -1:
          // Pat
          pat = true;
          break;
        case 1:
          // Player 1 won
          winner = 1;
          break;
        case 2:
          // Player 2 won
          winner = 2;
          break;
        default:
          break;
      }
    } else {
      // Maybe backpropagate the fact that it played bad
      // For the moment, just ignore
    }
  }
  if (winner > 0) {
    // If game ended because a player won, backpropagate
    if (i % (learnTimes / 100) === 0) game.display();
    const winnerBoardStates = winner === 1 ? boardStatesAsPlayer1 : boardStatesAsPlayer2;
    const winnerPlays = winner === 1 ? playsAsPlayer1 : playsAsPlayer2;
    const loserBoardStates = winner === 1 ? boardStatesAsPlayer2 : boardStatesAsPlayer1;
    const loserPlays = winner === 1 ? playsAsPlayer2 : playsAsPlayer1;

    // backpropagate full reward for the final winner play
    trainer.train(
      winnerBoardStates[winnerPlays.length - 1],
      Helper.getArrayFromIndex(winnerPlays[winnerPlays.length - 1], 100),
    );

    let output = myNetwork.forward(winnerBoardStates[winnerPlays.length - 1]);
    let PsPrime = output.w[winnerPlays[winnerPlays.length - 1]];

    // backpropagate on the previous winnerPlays
    for (let playIndex = winnerPlays.length - 2; playIndex >= 0; playIndex--) {
      output = myNetwork.forward(winnerBoardStates[playIndex]);
      let Ps = output.w[winnerPlays[playIndex]];
      trainer.train(
        winnerBoardStates[playIndex],
        Helper.getArrayFromIndex(
          winnerPlays[playIndex],
          Ps + gamma * (PsPrime - Ps)
        ),
      );
      PsPrime = myNetwork.forward(winnerBoardStates[playIndex]).w[winnerPlays[playIndex]];
    }

    // backpropagate reward for the final loser play if he could have prevented it
    if (winnerPlays[winnerPlays.length - 1] !== loserPlays[loserPlays.length - 1]) {
      trainer.train(
        loserBoardStates[loserPlays.length - 1],
        Helper.getArrayFromIndex(
          winnerPlays[winnerPlays.length - 1],
          75,
        ),
      );
    } else {
      trainer.train(
        loserBoardStates[loserPlays.length - 1],
        Helper.getArrayFromIndex(
          loserPlays[loserPlays.length - 1],
          -75,
        ),
      );
    }
  }
  if (i % (learnTimes / 100) === 0) {
    console.log('HVD 410', Helper.evaluateLearningCNN(myNetwork));
  }
  if (i % (learnTimes / 4) === 0) {
    const networkWeights = myNetwork.toJSON();
    const json = JSON.stringify(networkWeights);
    writeIndex++;

    fs.writeFile(`networkWeightsCNN${writeIndex}.json`, json, 'utf8', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  }
}

const networkWeights = myNetwork.toJSON();
const json = JSON.stringify(networkWeights);

fs.writeFile('networkWeightsCNN.json', json, 'utf8', (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});

const testGame = new connect4.Game();
console.log(myNetwork.forward(testGame.getConvolutionnalVol(1)));
