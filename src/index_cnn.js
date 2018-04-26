// @flow
const connect4 = require('./Game');
const Helper = require('./Helper');
const QLearning = require('./QLearning');
const fs = require('fs');
const Play = require('./Play')
const NeuralNetwork = require('./NeuralNetwork');
const savedNetwork = require('../savedNetworkWeightsCNNv3_4x4_pad2_32filter_200k_SGD_HVD_NOK_ga_05_lr1e-5-6_eps015_discount07+100k_NOK_ga04_eps015-03+100k_NOK_ga05_eps01_lr2e-5-6+100k_NOK_ga05_eps02_lr2e-5-7+200k_NOK_ga05_eps02-06_lr1e-5-7+100k_NOK_ga03_eps015_lr5e-5-7.json');

const networkType = 'CNN';

const networkConfig = {
  CNN: {
    filters_number: 32,
    padding: 2,
    stride: 1,
    size: 4,
    layers : [60, 30]
  },
  NN: {
    layers: [100]
  }
}

const myNetwork = NeuralNetwork.initialize(networkType, networkConfig);
const myTrainer = NeuralNetwork.getTrainer(networkType, myNetwork);

const learningRateInit = 0.0001;
const learningRateFinalFraction = 10;
const discount = 0.8;
const gamma = 0.3;
const learnTimes = 10000;
const reward = 100;
const sideReward = 75;

for (let i = 0; i < learnTimes; i++) {
  // display info once every 1/100
  if (i % (learnTimes / 100) === 0) console.log(i);
  const display = (i % (learnTimes / 100) === 0) ? true : false;

  // change ratio between exploration and exploitation
  const epsilon = 0.1;

  // play a game of connect4
  const gameInfo = Play.playGame(networkType, epsilon, myNetwork, display);

  // get game info back
  const winnerBoardStates = gameInfo.winnerBoardStates;
  const winnerPlays = gameInfo.winnerPlays;
  const loserBoardStates = gameInfo.loserBoardStates;
  const loserPlays = gameInfo.loserPlays;
  const winnerPlaysLength = winnerPlays.length;
  const loserPlaysLength = loserPlays.length;

  // adapt learning rate
  const learningRate = learningRateInit / (1 + (learningRateFinalFraction - 1) * i / learnTimes);

  if (winnerBoardStates.length !== 0) {
    // backpropagate full reward for the final winner play
    NeuralNetwork.backPropagate(
      networkType,
      myTrainer,
      winnerBoardStates[winnerPlaysLength - 1],
      reward,
      winnerPlays[winnerPlaysLength - 1],
      learningRate
    )

    QLearning.trainOnPreviousPlays(
      networkType,
      myNetwork,
      myTrainer,
      winnerBoardStates,
      winnerPlays,
      learningRate,
      reward,
      discount,
      gamma,
    );
    
    if (winnerPlays[winnerPlaysLength - 1] !== loserPlays[loserPlaysLength - 1]) {
      // backpropagate reward for the final loser play if he could have prevented it
      NeuralNetwork.backPropagate(
        networkType,
        myTrainer,
        loserBoardStates[loserPlaysLength - 1],
        sideReward,
        winnerPlays[winnerPlaysLength - 1],
        learningRate
      )
    } else {
      // backpropagate punishment for the final loser play if he permitted it
      NeuralNetwork.backPropagate(
        networkType,
        myTrainer,
        loserBoardStates[loserPlaysLength - 1],
        - sideReward,
        loserPlays[loserPlaysLength - 1],
        learningRate
      )
    }
  }
  if (i % (learnTimes / 100) === 0) {
    console.log('HVD 410', NeuralNetwork.evaluate(networkType, myNetwork));
  }
}

const networkWeights = myNetwork && myNetwork.toJSON();
const json = JSON.stringify(networkWeights);

fs.writeFile(`networkWeights${networkType}.json`, json, 'utf8', (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
