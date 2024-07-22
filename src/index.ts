import { createCanvas, loadImage } from "canvas";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";

let maze: {
  width: number;
  height: number;
  start: number[];
  end: number[];
  tiles: number[][];
} = {
  width: 0,
  height: 0,
  start: [],
  end: [],
  tiles: [],
};

let playerCoords: number[] = [];
let playerPath: number[][] = [];
let visited = new Set<string>();

const canvas = createCanvas(1080, 1080);
const ctx = canvas.getContext("2d");

if (!existsSync("output")) mkdirSync("output");

readdirSync("output").forEach((f) => {
  rmSync(`output/${f}`);
});

function renderFrame(n: number) {
  clearCanvas();

  drawBackground();

  loadMaze();
  drawCheckpoints();
  drawMaze();

  drawOutline();
}

renderFrame(0);
saveFrame(0);

solveMaze();

function solveMaze() {
  let solved = false;
  let frame = 2;
  let previousStep = -1;
  let lastCross: number[][] = [];
  let stepBeforeLastCross = -1;
  let stepAfterLastCross = -1;
  let isOnLastCross = false;
  let previouslyFoundCross = false;
  let moved = true;

  movePlayer(maze.start[0], maze.start[1]);

  renderFrame(1);
  drawPlayer();
  saveFrame(1);

  while (!solved) {
    console.log("--- NEXT FRAME ---");

    console.log("Tile", playerCoords[0] + playerCoords[1] * maze.width);

    const canGoDown = checkCanGoDown();
    const canGoRight = checkCanGoRight();
    const canGoUp = checkCanGoUp();
    const canGoLeft = checkCanGoLeft();

    moved = true;

    console.log(isOnLastCross, stepBeforeLastCross, stepAfterLastCross);

    if (canGoRight) {
      goRight();
      previousStep = 1;
    } else if (canGoDown) {
      goDown();
      previousStep = 2;
    } else if (canGoUp) {
      goUp();
      previousStep = 0;
    } else if (canGoLeft) {
      goLeft();
      previousStep = 3;
    } else {
      moved = false;
    }

    isOnLastCross = false;

    if (previouslyFoundCross) {
      previouslyFoundCross = false;
      stepAfterLastCross = previousStep;
    }

    if (!moved) {
      if (lastCross.length <= 0) continue;

      if (!isOnLastCross) {
        movePlayer(
          lastCross[lastCross.length - 1][0],
          lastCross[lastCross.length - 1][1],
        );
        isOnLastCross = true;
        console.log("Teleport at last cross", lastCross[lastCross.length - 1]);
      }

      const currPos = playerCoords;

      movePlayer(
        lastCross[lastCross.length - 1][0],
        lastCross[lastCross.length - 1][1],
      );

      const canMove = [
        checkCanGoUp(),
        checkCanGoRight(),
        checkCanGoDown(),
        checkCanGoLeft(),
      ];

      if (!canMove.includes(true)) {
        lastCross.pop();
        console.log("Popped cross", lastCross);
      }

      movePlayer(
        lastCross[lastCross.length - 1][0],
        lastCross[lastCross.length - 1][1],
      );
    }

    if (playerCoords[0] == maze.end[0] && playerCoords[1] == maze.end[1]) {
      console.log("SOLVED");
      solved = true;
      renderFrame(frame);
      drawPlayer();
      saveFrame(frame);
      continue;
    }

    let canMove = getTile(playerCoords[0], playerCoords[1]).map((v) => !v);

    if (canMove.filter((v) => v).length > 2) {
      if (
        lastCross.find(
          (c) => c[0] == playerCoords[0] && c[1] == playerCoords[1],
        )
      )
        continue;
      lastCross.push(playerCoords);
      stepBeforeLastCross = previousStep;
      previouslyFoundCross = true;
      console.log("Found cross at", lastCross);
    }

    // Mark the current tile as visited
    visited.add(`${playerCoords[0]},${playerCoords[1]}`);

    renderFrame(frame);

    drawPlayer();

    saveFrame(frame);

    frame++;
  }

  console.log("Solved!");
}

function goDown() {
  const x = playerCoords[0];
  const y = playerCoords[1] + 1;

  movePlayer(x, y);
}

function goRight() {
  const x = playerCoords[0] + 1;
  const y = playerCoords[1];

  movePlayer(x, y);
}

function goUp() {
  const x = playerCoords[0];
  const y = playerCoords[1] - 1;

  movePlayer(x, y);
}

function goLeft() {
  const x = playerCoords[0] - 1;
  const y = playerCoords[1];

  movePlayer(x, y);
}

function checkCanGoDown() {
  const tile = getTile(playerCoords[0], playerCoords[1]);

  if (!tile) return false;

  const coordsBelow = [playerCoords[0], playerCoords[1] + 1];

  if (visited.has(`${coordsBelow[0]},${coordsBelow[1]}`)) return false;

  if (coordsBelow[1] > maze.height) return false;

  return tile[2] === 0;
}

function checkCanGoRight() {
  const tile = getTile(playerCoords[0], playerCoords[1]);

  if (!tile) return false;

  const coordsRight = [playerCoords[0] + 1, playerCoords[1]];

  if (visited.has(`${coordsRight[0]},${coordsRight[1]}`)) return false;

  if (coordsRight[0] > maze.width) return false;

  return tile[1] === 0;
}

function checkCanGoUp() {
  const tile = getTile(playerCoords[0], playerCoords[1]);

  if (!tile) return false;

  const coordsAbove = [playerCoords[0], playerCoords[1] - 1];

  if (visited.has(`${coordsAbove[0]},${coordsAbove[1]}`)) return false;

  if (coordsAbove[1] < 0) return false;

  return tile[0] === 0;
}

function checkCanGoLeft() {
  const tile = getTile(playerCoords[0], playerCoords[1]);

  if (!tile) return false;

  const coordsLeft = [playerCoords[0] - 1, playerCoords[1]];

  if (visited.has(`${coordsLeft[0]},${coordsLeft[1]}`)) return false;

  if (coordsLeft[0] < 0) return false;

  return tile[3] === 0;
}

function getTile(x: number, y: number) {
  return maze.tiles[x + y * maze.width];
}

function movePlayer(x: number, y: number) {
  playerCoords = [x, y];
  playerPath.push([x, y]);
}

function drawPlayer() {
  const cellSize = 1080 / maze.width;

  drawPlayerPath();

  ctx.fillStyle = "white";

  const playerSize = cellSize / 2;

  ctx.fillRect(
    playerCoords[0] * cellSize + cellSize / 4,
    playerCoords[1] * cellSize + cellSize / 4,
    playerSize,
    playerSize,
  );
}

function drawPlayerPath() {
  const cellSize = 1080 / maze.width;

  ctx.fillStyle = "#00FF0011";

  playerPath.forEach((coords) => {
    ctx.fillRect(
      coords[0] * cellSize + cellSize / 4,
      coords[1] * cellSize + cellSize / 4,
      cellSize / 2,
      cellSize / 2,
    );
  });
}

function saveFrame(n: number) {
  if (n > Math.pow(maze.width, 2)) {
    console.log("HALTED");
    return process.exit();
  }
  writeFileSync(
    `output/${n.toString().padStart(5, "0")}.png`,
    canvas.toBuffer(),
  );
}

function clearCanvas() {
  ctx.clearRect(0, 0, 1080, 1080);
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 1080, 1080);
}

function drawOutline() {
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 1080, 1080);
}

function loadMaze() {
  maze = JSON.parse(readFileSync("src/maze.json", "utf-8"));
}

function drawMaze() {
  const cellSize = 1080 / maze.width;

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = maze.tiles[y * maze.width + x];

      cell.forEach((wall, i) => {
        if (wall == 0) return;

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        switch (i) {
          case 0:
            startX = x;
            startY = y;
            endX = x + 1;
            endY = y;
            break;

          case 1:
            startX = x + 1;
            startY = y;
            endX = x + 1;
            endY = y + 1;
            break;

          case 2:
            startX = x + 1;
            startY = y + 1;
            endX = x;
            endY = y + 1;
            break;

          case 3:
            startX = x;
            startY = y + 1;
            endX = x;
            endY = y;
            break;
        }

        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.moveTo(startX * cellSize, startY * cellSize);
        ctx.beginPath();
        ctx.moveTo(startX * cellSize, startY * cellSize);
        ctx.lineTo(endX * cellSize, endY * cellSize);
        ctx.stroke();
      });
    }
  }
}

function drawCheckpoints() {
  const checkpoints = [maze.start, maze.end];

  checkpoints.forEach((checkpoint, i) => {
    const [x, y] = checkpoint;

    ctx.fillStyle = i == 0 ? "green" : "red";

    ctx.fillRect(
      (x * 1080) / maze.width,
      (y * 1080) / maze.height,
      1080 / maze.width,
      1080 / maze.height,
    );
  });
}
