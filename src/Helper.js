// @flow
const connect4 = require('./Game');

exports.randomChoice = (choices: Array<number>): number => {
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

exports.getArrayFromIndex = (columnIndex: number, value: number): Array<number> => (
  new Array(7).fill(0).map((_, index) => (index === columnIndex ? value : 0))
)

exports.evaluateLearning = (network: any): Array<number> => {
  const benchMark = [];
  const game1 = new connect4.Game();
  game1.playChip(1, 1);
  game1.playChip(2, 0);
  game1.playChip(1, 2);
  game1.playChip(2, 6);
  game1.playChip(1, 3);
  game1.playChip(2, 1);
  benchMark.push(network.activate(game1.get1DArrayFormatted(1))[4]);

  const game2 = new connect4.Game();
  game2.playChip(2, 0);
  game2.playChip(1, 1);
  game2.playChip(2, 0);
  game2.playChip(1, 1);
  game2.playChip(2, 6);
  game2.playChip(1, 1);
  game2.playChip(2, 2);
  benchMark.push(network.activate(game2.get1DArrayFormatted(1))[1]);

  const game3 = new connect4.Game();
  game3.playChip(1, 0);
  game3.playChip(2, 0);
  game3.playChip(1, 1);
  game3.playChip(2, 6);
  game3.playChip(1, 1);
  game3.playChip(2, 2);
  game3.playChip(1, 3);
  game3.playChip(2, 6);
  game3.playChip(1, 1);
  game3.playChip(2, 3);
  game3.playChip(1, 2);
  game3.playChip(2, 0);
  benchMark.push(network.activate(game3.get1DArrayFormatted(1))[0]);

  return benchMark;
}
