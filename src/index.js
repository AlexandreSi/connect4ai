// @flow
const QLearning = require('./QLearning');
const Play = require('./Play')
const NeuralNetwork = require('./NeuralNetwork');
const fs = require('fs');

// -------------- PARAMETERS ---------------- //
// type of neural network to train
const NETWORK_TYPE = 'CNN';
// number of games to play
const LEARN_TIMES = 10000;
// learningRate is progressively decreased with the number of games until
// the final value LR_INIT/LR_FINAL_FRACTION
const LR_INIT = 0.0001;
const LR_FINAL_FRACTION = 10;
// epsilon is the ratio between exploration and exploitation
// it can evolve along the games played
const EPSILON_INIT = 0.1;
const EPSILON_FINAL = 0.4;
// gamma is the fraction attributed to the maximum Q Value of the next state
const GAMMA = 0.3;
// reward awarded to the final play that led to victory
const REWARD = 100;
// discount applied to the reward awarded to the previous plays that led to victory
const DISCOUNT = 0.8;
// reward (or - reward) awarded to prevent the bot to lose
const SIDE_REWARD = 75;
// network configuration
const NETWORK_CONFIG = {
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
// ------------------------------------------ //

const myNetwork = NeuralNetwork.initialize(NETWORK_TYPE, NETWORK_CONFIG);
const myTrainer = NeuralNetwork.getTrainer(NETWORK_TYPE, myNetwork);

for (let i = 0; i < LEARN_TIMES; i++) {
  // display info once every 1/100
  if (i % (LEARN_TIMES / 100) === 0) console.log(i);
  const display = (i % (LEARN_TIMES / 100) === 0) ? true : false;

  // change ratio between exploration and exploitation
  const epsilon = EPSILON_INIT + (EPSILON_FINAL - EPSILON_INIT) * i / LEARN_TIMES;

  // play a game of connect4
  const gameInfo = Play.playGame(NETWORK_TYPE, epsilon, myNetwork, display);

  // get game info back
  const winnerBoardStates = gameInfo.winnerBoardStates;
  const winnerPlays = gameInfo.winnerPlays;
  const loserBoardStates = gameInfo.loserBoardStates;
  const loserPlays = gameInfo.loserPlays;
  const winnerPlaysLength = winnerPlays.length;
  const loserPlaysLength = loserPlays.length;

  // adapt learning rate
  const learningRate = LR_INIT / (1 + (LR_FINAL_FRACTION - 1) * i / LEARN_TIMES);

  if (winnerBoardStates.length !== 0) {
    // backpropagate full reward for the final winner play
    NeuralNetwork.backPropagate(
      NETWORK_TYPE,
      myTrainer,
      winnerBoardStates[winnerPlaysLength - 1],
      REWARD,
      winnerPlays[winnerPlaysLength - 1],
      learningRate
    )

    // train on all the plays that led to victory
    QLearning.trainOnPreviousPlays(
      NETWORK_TYPE,
      myNetwork,
      myTrainer,
      winnerBoardStates,
      winnerPlays,
      learningRate,
      REWARD,
      DISCOUNT,
      GAMMA,
    );
    
    if (winnerPlays[winnerPlaysLength - 1] !== loserPlays[loserPlaysLength - 1]) {
      // backpropagate reward for the final loser play if he could have prevented it
      NeuralNetwork.backPropagate(
        NETWORK_TYPE,
        myTrainer,
        loserBoardStates[loserPlaysLength - 1],
        SIDE_REWARD,
        winnerPlays[winnerPlaysLength - 1],
        learningRate
      )
    } else {
      // backpropagate punishment for the final loser play if he permitted it
      NeuralNetwork.backPropagate(
        NETWORK_TYPE,
        myTrainer,
        loserBoardStates[loserPlaysLength - 1],
        - SIDE_REWARD,
        loserPlays[loserPlaysLength - 1],
        learningRate
      )
    }
  }
  if (i % (LEARN_TIMES / 100) === 0) {
    console.log('HVD 410', NeuralNetwork.evaluate(NETWORK_TYPE, myNetwork));
  }
}

// write final weights
const networkWeights = myNetwork && myNetwork.toJSON();
const json = JSON.stringify(networkWeights);

fs.writeFile(`networkWeights${NETWORK_TYPE}.json`, json, 'utf8', (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
