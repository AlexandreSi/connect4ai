// @flow
const connect4 = require('./Game');
const synaptic = require('synaptic');
const Helper = require('./Helper');

const inputLayer = new synaptic.Layer(7 * 6);
const hiddenLayer1 = new synaptic.Layer(60);
const outputLayer = new synaptic.Layer(7);

hiddenLayer1.set({
  squash: synaptic.Neuron.squash.RELU,
});

outputLayer.set({
  squash: synaptic.Neuron.squash.RELU,
});

inputLayer.set({
  bias: 0
});

inputLayer.project(hiddenLayer1);
hiddenLayer1.project(outputLayer);

const myNetwork = new synaptic.Network({
  input: inputLayer,
  hidden: [hiddenLayer1],
  output: outputLayer,
});

const learningRate = 0.00005;
const gamma = 0.85;
const learnTimes = 100000;

for (let i = 0; i < learnTimes; i++) {
  if (i % (learnTimes / 100) === 0) console.log(i);
  const game = new connect4.Game();

  const boardStatesAsPlayer1 = [];
  const boardStatesAsPlayer2 = [];
  const playsAsPlayer1 = [];
  const playsAsPlayer2 = [];
  const epsilon = 0.1 + (0.5 / learnTimes) * i;

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
    const boardStates = winner === 1 ? boardStatesAsPlayer1 : boardStatesAsPlayer2;
    const plays = winner === 1 ? playsAsPlayer1 : playsAsPlayer2;

    // backpropagate full reward for the final play
    myNetwork.activate(boardStates[plays.length - 1]);
    myNetwork.propagate(
      learningRate,
      Helper.getArrayFromIndex(plays[plays.length -1], 100)
    );

    let output = myNetwork.activate(boardStates[plays.length -1]);
    let PsPrime = output[plays[plays.length - 1]];

    // backpropagate on the previous plays
    for (let playIndex = plays.length - 2; playIndex >= 0; playIndex--) {
      output = myNetwork.activate(boardStates[playIndex]);
      let Ps = output[plays[playIndex]];
      myNetwork.propagate(
        learningRate,
        Helper.getArrayFromIndex(
          plays[playIndex],
          Ps + gamma * (PsPrime - Ps)
        )
      );
      PsPrime = Ps;
    }
  }
  if (i % (learnTimes / 100) === 0) console.log('HVD 410', Helper.evaluateLearning(myNetwork));
}

console.log(myNetwork.toJSON())
