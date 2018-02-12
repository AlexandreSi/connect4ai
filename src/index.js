// @flow
var connect4 = require('./Game');

var game = new connect4.Game();
game.playChip(2,0);
game.playChip(2,0);
game.playChip(2,0);
game.playChip(2,0);
game.display();
console.log(game.checkForWin());
