// @flow
const connect4 = require('./Game');
const synaptic = require('synaptic');
const Helper = require('./Helper');

const inputLayer = new synaptic.Layer(7 * 6);
const hiddenLayer = new synaptic.Layer(50);
const outputLayer = new synaptic.Layer(7);

hiddenLayer.set({
  squash: synaptic.Neuron.squash.RELU,
  bias: 0
});

outputLayer.set({
  bias: 0
});

inputLayer.set({
  bias: 0
});

inputLayer.project(hiddenLayer);
hiddenLayer.project(outputLayer);

const myNetwork = new synaptic.Network({
  input: inputLayer,
  hidden: [hiddenLayer],
  output: outputLayer,
});

const learningRate = 0.003;
const gamma = 0.8;
const learnTimes = 100000;

for (let i = 0; i < learnTimes; i++) {
  if (i % (learnTimes / 100) === 0) console.log(i);
  const game = new connect4.Game();

  const boardStatesAsPlayer1 = [];
  const boardStatesAsPlayer2 = [];
  const playsAsPlayer1 = [];
  const playsAsPlayer2 = [];
  const epsilon = 0.2 + (0.8 / learnTimes) * i;

  let playerIdToPlay = 1;
  let pat = false;
  let winner = 0;
  while (!pat && !winner) {
    const boardArray = game.get1DArrayFormatted(playerIdToPlay);
    // Play
    const e = Math.random();
    let columnIndex;
    if (e < epsilon) {
      const output = myNetwork.activate(boardArray);
      columnIndex = output.indexOf(Math.max(...output));
    } else {
      columnIndex = Helper.randomChoice([0, 1, 2, 3, 4, 5, 6]);
    }
    const playAgain = game.playChip(playerIdToPlay, columnIndex);

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
    const boardStates = winner === 1 ? boardStatesAsPlayer1 : boardStatesAsPlayer2;
    const plays = winner === 1 ? playsAsPlayer1 : playsAsPlayer2;

    for (let playIndex = 0; playIndex < plays.length; playIndex++) {
      myNetwork.activate(boardStates[playIndex]);
      myNetwork.propagate(
        learningRate,
        Helper.getArrayFromIndex(
          plays[playIndex],
          gamma ** (plays.length - playIndex - 1)
        )
      );
    }
  }
  if (i % (learnTimes / 100) === 0) console.log('evaluateLearning', Helper.evaluateLearning(myNetwork));
}

console.log(myNetwork.toJSON())
