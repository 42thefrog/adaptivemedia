import React, { useEffect, useRef, useState } from "react";
import { Gamepad2 } from "lucide-react";

type Cell = { x: number; y: number };
type PersonaId = "alex" | "camille" | "maya";

const CELL_PX = 20;

function cellStyle(bg: string): React.CSSProperties {
  return {
    width: CELL_PX,
    height: CELL_PX,
    borderRadius: 3,
    background: bg,
  };
}

// ---------- Snake (Maya) ----------
function SnakeGame() {
  const cellsN = 10;
  const makeInitial = () => ({
    snake: [
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 },
    ] as Cell[],
    dir: { x: 1, y: 0 },
    food: { x: 7, y: 2 } as Cell,
    alive: true,
    score: 0,
  });
  const [state, setState] = useState(makeInitial);
  const dirRef = useRef(state.dir);

  useEffect(() => {
    dirRef.current = state.dir;
  }, [state.dir]);

  useEffect(() => {
    if (!state.alive) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev.alive) return prev;
        const dir = dirRef.current;
        const head = { x: prev.snake[0].x + dir.x, y: prev.snake[0].y + dir.y };
        const hit =
          head.x < 0 ||
          head.y < 0 ||
          head.x >= cellsN ||
          head.y >= cellsN ||
          prev.snake.some((s) => s.x === head.x && s.y === head.y);
        if (hit) return { ...prev, alive: false };
        const ateFood = head.x === prev.food.x && head.y === prev.food.y;
        const snake = [head, ...prev.snake];
        if (!ateFood) snake.pop();
        let food = prev.food;
        if (ateFood) {
          do {
            food = {
              x: Math.floor(Math.random() * cellsN),
              y: Math.floor(Math.random() * cellsN),
            };
          } while (snake.some((s) => s.x === food.x && s.y === food.y));
        }
        return {
          ...prev,
          snake,
          food,
          score: ateFood ? prev.score + 1 : prev.score,
        };
      });
    }, 400);
    return () => clearInterval(id);
  }, [state.alive]);

  const setDir = (x: number, y: number) => {
    setState((prev) => {
      if (prev.dir.x === x && prev.dir.y === y) return prev;
      if (prev.dir.x !== 0 && x !== 0) return prev;
      if (prev.dir.y !== 0 && y !== 0) return prev;
      return { ...prev, dir: { x, y } };
    });
  };

  const grid: React.ReactNode[] = [];
  for (let y = 0; y < cellsN; y++) {
    for (let x = 0; x < cellsN; x++) {
      const isSnake = state.snake.some((s) => s.x === x && s.y === y);
      const isFood = state.food.x === x && state.food.y === y;
      grid.push(
        <div
          key={`${x}-${y}`}
          style={cellStyle(
            isSnake ? "#1D9E75" : isFood ? "#D85A30" : "rgba(0,0,0,0.06)",
          )}
        />,
      );
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cellsN}, ${CELL_PX}px)`,
          gap: 2,
          justifyContent: "center",
          margin: "0 auto 10px",
        }}
      >
        {grid}
      </div>
      <Pad
        onUp={() => setDir(0, -1)}
        onDown={() => setDir(0, 1)}
        onLeft={() => setDir(-1, 0)}
        onRight={() => setDir(1, 0)}
      />
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>
        {state.alive ? `score: ${state.score}` : `crash · score: ${state.score}`}
      </p>
      {!state.alive && (
        <button
          className="secondary"
          style={{ marginTop: 8 }}
          onClick={() => setState(makeInitial())}
        >
          Restart
        </button>
      )}
    </div>
  );
}

// ---------- Maze (Camille) ----------
const MAZE: number[][] = [
  [0, 1, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1],
  [0, 0, 0, 0, 0, 1, 0],
  [1, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

function MazeGame() {
  const makeInitial = () => ({ x: 0, y: 0, steps: 0, done: false });
  const [state, setState] = useState(makeInitial);

  const move = (dx: number, dy: number) => {
    setState((prev) => {
      if (prev.done) return prev;
      const nx = prev.x + dx;
      const ny = prev.y + dy;
      if (nx < 0 || ny < 0 || nx >= 7 || ny >= 7 || MAZE[ny][nx] === 1)
        return prev;
      const done = nx === 6 && ny === 6;
      return { x: nx, y: ny, steps: prev.steps + 1, done };
    });
  };

  const grid: React.ReactNode[] = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      let bg = "rgba(0,0,0,0.06)";
      if (MAZE[y][x] === 1) bg = "rgba(0,0,0,0.35)";
      else if (x === state.x && y === state.y) bg = "#1D9E75";
      else if (x === 6 && y === 6) bg = "#D85A30";
      grid.push(<div key={`${x}-${y}`} style={cellStyle(bg)} />);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(7, ${CELL_PX}px)`,
          gap: 2,
          justifyContent: "center",
          margin: "0 auto 10px",
        }}
      >
        {grid}
      </div>
      <Pad
        onUp={() => move(0, -1)}
        onDown={() => move(0, 1)}
        onLeft={() => move(-1, 0)}
        onRight={() => move(1, 0)}
      />
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>
        {state.done ? `done! steps: ${state.steps}` : `steps: ${state.steps}`}
      </p>
      {state.done && (
        <button
          className="secondary"
          style={{ marginTop: 8 }}
          onClick={() => setState(makeInitial())}
        >
          Restart
        </button>
      )}
    </div>
  );
}

// ---------- Tetris (Alex) ----------
function TetrisGame() {
  const cols = 6;
  const rows = 8;
  const makeInitial = () => ({
    heights: new Array(cols).fill(0),
    col: 0,
    placed: 0,
  });
  const [state, setState] = useState(makeInitial);

  const drop = () => {
    setState((prev) => {
      if (prev.heights[prev.col] >= rows) return prev;
      const heights = [...prev.heights];
      heights[prev.col]++;
      return { ...prev, heights, placed: prev.placed + 1 };
    });
  };
  const full = state.heights[state.col] >= rows;

  const grid: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const filledFromBottom = rows - 1 - y;
      const isFilled = filledFromBottom < state.heights[x];
      const isCursor = y === 0 && x === state.col;
      let bg = "rgba(0,0,0,0.06)";
      if (isFilled) bg = "#D85A30";
      else if (isCursor) bg = "#1D9E75";
      grid.push(<div key={`${x}-${y}`} style={cellStyle(bg)} />);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 22px)`,
          gap: 2,
          justifyContent: "center",
          margin: "0 auto 10px",
        }}
      >
        {grid}
      </div>
      <div
        style={{ display: "flex", gap: 6, justifyContent: "center" }}
      >
        <button
          className="secondary"
          style={{ width: 32, height: 32, padding: 0 }}
          onClick={() =>
            setState((prev) => ({ ...prev, col: Math.max(0, prev.col - 1) }))
          }
        >
          ◀
        </button>
        <button className="secondary" style={{ padding: "0 12px" }} onClick={drop}>
          drop
        </button>
        <button
          className="secondary"
          style={{ width: 32, height: 32, padding: 0 }}
          onClick={() =>
            setState((prev) => ({
              ...prev,
              col: Math.min(cols - 1, prev.col + 1),
            }))
          }
        >
          ▶
        </button>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>
        {full ? `no room · blocks: ${state.placed}` : `blocks: ${state.placed}`}
      </p>
    </div>
  );
}

function Pad({
  onUp,
  onDown,
  onLeft,
  onRight,
}: {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
}) {
  const btn: React.CSSProperties = { width: 32, height: 32, padding: 0 };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 32px)",
        gap: 4,
        justifyContent: "center",
      }}
    >
      <div />
      <button className="secondary" style={btn} onClick={onUp}>
        ▲
      </button>
      <div />
      <button className="secondary" style={btn} onClick={onLeft}>
        ◀
      </button>
      <div />
      <button className="secondary" style={btn} onClick={onRight}>
        ▶
      </button>
      <div />
      <button className="secondary" style={btn} onClick={onDown}>
        ▼
      </button>
      <div />
    </div>
  );
}

export function TeamGame({ personaId }: { personaId: PersonaId }) {
  const labels: Record<PersonaId, string> = {
    maya: "Snake · Maya's game",
    camille: "Maze · Camille's game",
    alex: "Tetris · Alex's game",
  };
  return (
    <section className="music-section team-game-section">
      <div className="music-heading">
        <div>
          <span className="section-label">Team game</span>
          <h2>{labels[personaId]}</h2>
          <p>Each persona plays their own game, independently.</p>
        </div>
        <Gamepad2 size={22} aria-hidden="true" />
      </div>
      {personaId === "maya" && <SnakeGame key="maya" />}
      {personaId === "camille" && <MazeGame key="camille" />}
      {personaId === "alex" && <TetrisGame key="alex" />}
    </section>
  );
}
