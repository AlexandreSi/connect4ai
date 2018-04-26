// @flow
const NeuralNetwork = require('./NeuralNetwork');

exports.trainOnPreviousPlays = (
  networkType: string,
  myNetwork: any,
  myTrainer: any,
  boards: Array<any>,
  plays: Array<number>,
  learningRate: number,
  reward: number,
  discount: number,
  gamma: number,
) => {
  const playsLength = plays.length;
  let previousQValue = NeuralNetwork.predict(
    networkType,
    myNetwork,
    boards[playsLength - 1],
  );
  
  // backpropagate on the previous winnerPlays
  for (let playIndex = playsLength - 2; playIndex >= 0; playIndex--) {
    NeuralNetwork.backPropagate(
      networkType,
      myTrainer,
      boards[playIndex],
      discount ** (playsLength - playIndex - 1) * reward + gamma * Math.max(...previousQValue),
      plays[playIndex],
      learningRate
    )
    previousQValue = NeuralNetwork.predict(
      networkType,
      myNetwork,
      boards[playIndex],
    );
  }
}