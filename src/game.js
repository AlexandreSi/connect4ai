// @flow

class Game {
  board: Array<Array<number>>;
  height: number;
  width: number;

  constructor() {
    this.height = 6;
    this.width = 7;
    this.board = [];
    for (let i = 0; i < this.height; i++) {
      this.board.push(Array(this.width).fill(0));
    }
  }

  display(): void {
    const mapPlayerToCharacter = {};
    mapPlayerToCharacter[0] = '-';
    mapPlayerToCharacter[1] = 'X';
    mapPlayerToCharacter[2] = 'O';

    console.log(
      this.board.reduce((boardString, line, index) => {
        const lineString = line.reduce((lineString, cell) => {
          lineString += ` ${mapPlayerToCharacter[cell]} `;
          return lineString;
        }, '');
        boardString += lineString;
        if (index !== boardString.length - 1) boardString += '\n';
        return boardString;
      }, '')
    );
  }

  getColumn(columnIndex: number): Array<number> {
    if (columnIndex >= this.width || columnIndex < 0) throw Error('Column out of boundary');
    return this.board.reduce((column, line) => {
      column.push(line[columnIndex]);
      return column;
    }, []);
  }

  getFirstLineEmpty(column: Array<number>): ?number {
    if (column[0] !== 0) return null;
    let lineIndexToReplace;
    for (let lineIndex = 0; lineIndex < this.height; lineIndex++) {
      if (lineIndex === this.height - 1 ||
        column[lineIndex + 1] !== 0
      ) {
        lineIndexToReplace = lineIndex;
        break;
      }
    }
    return lineIndexToReplace;
  }

  playChip(playerId: number, columnIndex: number): void {
    const column = this.getColumn(columnIndex);
    const lineIndexToReplace = this.getFirstLineEmpty(column);
    if (!!lineIndexToReplace) this.board[lineIndexToReplace][columnIndex] = playerId;
  }
}

module.exports.Game = Game;
