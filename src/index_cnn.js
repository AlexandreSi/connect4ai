// @flow
const convnetjs = require("convnetjs");
const deepqlearn = require('convnetjs/build/deepqlearn');
const connect4 = require('./Game');
const Helper = require('./Helper');
const fs = require('fs');

const num_inputs = 84;
const num_actions = 7;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
const layer_defs = [];
layer_defs.push({type:'input', out_sx:7, out_sy:6, out_depth:2});
layer_defs.push({type:'conv', sx:2, filters:16, stride:1, activation:'relu'});
layer_defs.push({type:'conv', sx:2, filters:32, stride:1, activation:'relu'});
layer_defs.push({type:'fc', num_neurons:100, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:7});

const myNetwork = new convnetjs.Net();
myNetwork.makeLayers(layer_defs);

const trainer = new convnetjs.Trainer(
  myNetwork,
  {
    method: 'adagrad',
    learning_rate: 0.01,
    l2_decay: 0.001,
    batch_size: 1,
  }
);

const learningRateInit = 0.00008;
const gamma = 0.95;
const learnTimes = 100000;

for (let i = 0; i < learnTimes; i++) {
  if (i % (learnTimes / 100) === 0) console.log(i);
  const game = new connect4.Game();
  const boardStatesAsPlayer1 = [];
  const boardStatesAsPlayer2 = [];
  const playsAsPlayer1 = [];
  const playsAsPlayer2 = [];
  const epsilon = 0.2 + 0.1 * i / learnTimes;
  const learningRate = learningRateInit / (1 + 99 * i / learnTimes);

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
      PsPrime = Ps;
    }

    // backpropagate reward for the final loser play if he could have prevented it
    if (winnerPlays[winnerPlays.length - 1] !== loserPlays[loserPlays.length - 1]) {
      trainer.train(
        loserBoardStates[loserPlays.length - 1],
        Helper.getArrayFromIndex(
          winnerPlays[winnerPlays.length - 1],
          100,
        ),
      );
    } else {
      trainer.train(
        loserBoardStates[loserPlays.length - 1],
        Helper.getArrayFromIndex(
          loserPlays[loserPlays.length - 1],
          -20,
        ),
      );
    }
  }
  if (i % (learnTimes / 100) === 0) console.log('HVD 410', Helper.evaluateLearningCNN(myNetwork));
  if (i % (learnTimes / 4) === 0) {
    const networkWeights = myNetwork.toJSON();
    const json = JSON.stringify(networkWeights);

    fs.writeFile('networkWeights.json', json, 'utf8', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  }
}

const networkWeights = myNetwork.toJSON();
const json = JSON.stringify(networkWeights);

fs.writeFile('networkWeights.json', json, 'utf8', (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});

const testGame = new connect4.Game();
console.log(myNetwork.forward(testGame.getConvolutionnalVol(1)));
