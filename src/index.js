// @flow
const connect4 = require('./Game');
const Helper = require('./Helper');
var fs = require('fs');



const learningRateInit = 0.00008;
const gamma = 0.95;
const learnTimes = 500000;

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
    const boardArray = game.get1DArrayFormatted(playerIdToPlay);
    // Play
    const explore = !(Math.random() < epsilon);
    let columnIndex;
    if (!explore) {
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
    const winnerBoardStates = winner === 1 ? boardStatesAsPlayer1 : boardStatesAsPlayer2;
    const winnerPlays = winner === 1 ? playsAsPlayer1 : playsAsPlayer2;
    const loserBoardStates = winner === 1 ? boardStatesAsPlayer2 : boardStatesAsPlayer1;
    const loserPlays = winner === 1 ? playsAsPlayer2 : playsAsPlayer1;

    // backpropagate full reward for the final winner play
    myNetwork.activate(winnerBoardStates[winnerPlays.length - 1]);
    myNetwork.propagate(
      learningRate,
      Helper.getArrayFromIndex(winnerPlays[winnerPlays.length -1], 100)
    );

    let output = myNetwork.activate(winnerBoardStates[winnerPlays.length -1]);
    let PsPrime = output[winnerPlays[winnerPlays.length - 1]];

    // backpropagate on the previous winnerPlays
    for (let playIndex = winnerPlays.length - 2; playIndex >= 0; playIndex--) {
      output = myNetwork.activate(winnerBoardStates[playIndex]);
      let Ps = output[winnerPlays[playIndex]];
      myNetwork.propagate(
        learningRate,
        Helper.getArrayFromIndex(
          winnerPlays[playIndex],
          Ps + gamma * (PsPrime - Ps)
        )
      );
      PsPrime = myNetwork.activate(winnerBoardStates[playIndex])[winnerPlays[playIndex]];
    }

    // backpropagate reward for the final loser play if he could have prevented it
    if (winnerPlays[winnerPlays.length - 1] !== loserPlays[loserPlays.length - 1]) {
      myNetwork.activate(loserBoardStates[loserPlays.length - 1]);
      myNetwork.propagate(
        learningRate,
        Helper.getArrayFromIndex(winnerPlays[winnerPlays.length - 1], 75)
      );
    } else {
      myNetwork.activate(loserBoardStates[loserPlays.length - 1]);
      myNetwork.propagate(
        learningRate,
        Helper.getArrayFromIndex(loserPlays[loserPlays.length - 1], -75)
      );
    }
  }
  if (i % (learnTimes / 100) === 0) console.log('HVD 410', Helper.evaluateLearning(myNetwork));
}

const networkWeights = myNetwork.toJSON();
const json = JSON.stringify(networkWeights);

fs.writeFile('networkWeights.json', json, 'utf8', (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});

const testGame = new connect4.Game();
console.log(myNetwork.activate(testGame.get1DArrayFormatted(1)))