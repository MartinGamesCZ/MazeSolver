import gen from "generate-maze";
import { writeFileSync } from "fs";

const WIDTH = 10;
const HEIGHT = 10;

const tiles = [];

const maze = gen(WIDTH, HEIGHT, true, Math.random() * 10e6);

for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const cell = maze[y][x];

    tiles.push(
      [cell.top, cell.right, cell.bottom, cell.left].map((v) => (v ? 1 : 0)),
    );
  }
}

const mazeData = {
  width: WIDTH,
  height: HEIGHT,
  start: [0, 0],
  end: [WIDTH - 1, HEIGHT - 1],
  tiles,
};

writeFileSync("src/maze.json", JSON.stringify(mazeData, null, 2));
