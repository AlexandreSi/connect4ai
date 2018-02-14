// @flow
const connect4 = require('./Game');

const game = new connect4.Game();
game.playChip(2, 0);
game.playChip(1, 0);
game.playChip(2, 0);
game.playChip(1, 0);
game.playChip(2, 2);
game.playChip(1, 1);
game.playChip(2, 4);
game.playChip(1, 3);
game.playChip(2, 1);
game.playChip(1, 1);
game.playChip(2, 5);
game.playChip(1, 2);
game.playChip(2, 2);
