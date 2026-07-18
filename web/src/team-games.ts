// Three independent, self-contained mini-games surfaced in the
// "Team game" panel. Each is plain DOM/canvas logic — deliberately
// decoupled from Alpine's reactivity so it keeps running regardless
// of which design theme or persona is active.

function byId(id: string) {
  return document.getElementById(id);
}

function initSnake() {
  const canvas = byId("tg-snake-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = 18;
  const cellsN = 10;
  let snake: Array<{ x: number; y: number }>;
  let dir: { x: number; y: number };
  let food: { x: number; y: number };
  let alive = true;
  let score = 0;
  let timer: ReturnType<typeof setInterval>;

  const rand = () => Math.floor(Math.random() * cellsN);
  const placeFood = () => {
    let p: { x: number; y: number };
    do {
      p = { x: rand(), y: rand() };
    } while (snake.some((s) => s.x === p.x && s.y === p.y));
    food = p;
  };
  const setStatus = (text: string) => {
    const el = byId("tg-snake-status");
    if (el) el.textContent = text;
  };
  const draw = () => {
    ctx.clearRect(0, 0, 180, 180);
    ctx.fillStyle = "#D85A30";
    ctx.fillRect(food.x * size + 1, food.y * size + 1, size - 2, size - 2);
    ctx.fillStyle = "#1D9E75";
    snake.forEach((s) =>
      ctx.fillRect(s.x * size + 1, s.y * size + 1, size - 2, size - 2),
    );
  };
  const tick = () => {
    if (!alive) return;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= cellsN ||
      head.y >= cellsN ||
      snake.some((s) => s.x === head.x && s.y === head.y)
    ) {
      alive = false;
      clearInterval(timer);
      setStatus("crash · score: " + score);
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      setStatus("score: " + score);
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  };
  const init = () => {
    snake = [
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 },
    ];
    dir = { x: 1, y: 0 };
    alive = true;
    score = 0;
    placeFood();
    setStatus("score: 0");
    clearInterval(timer);
    timer = setInterval(tick, 400);
    draw();
  };

  byId("tg-snake-up")?.addEventListener("click", () => {
    if (dir.y === 0) dir = { x: 0, y: -1 };
  });
  byId("tg-snake-down")?.addEventListener("click", () => {
    if (dir.y === 0) dir = { x: 0, y: 1 };
  });
  byId("tg-snake-left")?.addEventListener("click", () => {
    if (dir.x === 0) dir = { x: -1, y: 0 };
  });
  byId("tg-snake-right")?.addEventListener("click", () => {
    if (dir.x === 0) dir = { x: 1, y: 0 };
  });

  (window as any).__tgSnakeInit = init;
  init();
}

function initMaze() {
  const board = byId("tg-maze-board");
  if (!board) return;
  const grid = [
    [0, 1, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 1, 0],
    [1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];
  let px = 0;
  let py = 0;
  let steps = 0;
  let done = false;

  const setStatus = (text: string) => {
    const el = byId("tg-maze-status");
    if (el) el.textContent = text;
  };
  const render = () => {
    board.innerHTML = "";
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const cell = document.createElement("div");
        cell.style.width = "20px";
        cell.style.height = "20px";
        cell.style.borderRadius = "3px";
        if (grid[y][x] === 1) cell.style.background = "rgba(0,0,0,0.35)";
        else if (x === px && y === py) cell.style.background = "#1D9E75";
        else if (x === 6 && y === 6) cell.style.background = "#D85A30";
        else cell.style.background = "rgba(0,0,0,0.06)";
        board.appendChild(cell);
      }
    }
  };
  const move = (dx: number, dy: number) => {
    if (done) return;
    const nx = px + dx;
    const ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= 7 || ny >= 7 || grid[ny][nx] === 1) return;
    px = nx;
    py = ny;
    steps++;
    if (px === 6 && py === 6) {
      done = true;
      setStatus("done! steps: " + steps);
    } else {
      setStatus("steps: " + steps);
    }
    render();
  };
  const init = () => {
    px = 0;
    py = 0;
    steps = 0;
    done = false;
    setStatus("steps: 0");
    render();
  };

  byId("tg-maze-up")?.addEventListener("click", () => move(0, -1));
  byId("tg-maze-down")?.addEventListener("click", () => move(0, 1));
  byId("tg-maze-left")?.addEventListener("click", () => move(-1, 0));
  byId("tg-maze-right")?.addEventListener("click", () => move(1, 0));

  (window as any).__tgMazeInit = init;
  init();
}

function initTetris() {
  const board = byId("tg-tetris-board");
  if (!board) return;
  const cols = 6;
  const rows = 8;
  let heights: number[];
  let col = 0;
  let placed = 0;

  const setStatus = (text: string) => {
    const el = byId("tg-tetris-status");
    if (el) el.textContent = text;
  };
  const render = () => {
    board.innerHTML = "";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = document.createElement("div");
        cell.style.width = "22px";
        cell.style.height = "22px";
        cell.style.borderRadius = "3px";
        const filledFromBottom = rows - 1 - y;
        const isFilled = filledFromBottom < heights[x];
        const isCursor = y === 0 && x === col;
        if (isFilled) cell.style.background = "#D85A30";
        else if (isCursor) cell.style.background = "#1D9E75";
        else cell.style.background = "rgba(0,0,0,0.06)";
        board.appendChild(cell);
      }
    }
  };
  const drop = () => {
    if (heights[col] >= rows) {
      setStatus("no room · blocks: " + placed);
      return;
    }
    heights[col]++;
    placed++;
    setStatus("blocks: " + placed);
    render();
  };
  const init = () => {
    heights = new Array(cols).fill(0);
    col = 0;
    placed = 0;
    setStatus("blocks: 0");
    render();
  };

  byId("tg-tetris-left")?.addEventListener("click", () => {
    col = Math.max(0, col - 1);
    render();
  });
  byId("tg-tetris-right")?.addEventListener("click", () => {
    col = Math.min(cols - 1, col + 1);
    render();
  });
  byId("tg-tetris-drop")?.addEventListener("click", drop);

  (window as any).__tgTetrisInit = init;
  init();
}

export function initTeamGames() {
  initSnake();
  initMaze();
  initTetris();
}
