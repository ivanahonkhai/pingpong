
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const PADDLE_WIDTH = 12;
export const BALL_RADIUS = 8;
export const INITIAL_BALL_SPEED = 6;
export const SPEED_INCREMENT = 1.03;
export const MAX_BALL_SPEED = 22;
export const MATCH_DURATION = 90;

// Physics constants
export const AIR_DRAG = 0.9995;
export const SPIN_INFLUENCE = 0.08;
export const SPIN_DECAY = 0.98;
export const PADDLE_FRICTION = 0.35; // How much paddle movement transfers to ball spin

export const DIFFICULTIES = {
  easy: { speed: 3.5, errorMargin: 45 },
  medium: { speed: 6.0, errorMargin: 20 },
  hard: { speed: 10.5, errorMargin: 2 },
};

export const THEME_COLORS = {
  cyan: '#22d3ee',
  pink: '#f472b6',
  yellow: '#fbbf24',
  green: '#4ade80'
};
