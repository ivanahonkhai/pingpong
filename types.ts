
export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  spin: number; // Rotation speed affecting trajectory
}

export interface Paddle {
  y: number;
  height: number;
  width: number;
  score: number;
  isAI: boolean;
  prevY: number; // To calculate paddle velocity
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER'
}

export type GameMode = '1P' | '2P';
export type Personality = 'enthusiastic' | 'sarcastic' | 'neutral';

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  color: string;
  mode: GameMode;
  personality: Personality;
}

export interface Commentary {
  text: string;
  timestamp: number;
}
