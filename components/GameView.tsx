
import React, { useRef, useEffect, useCallback } from 'react';
import { Vector2, Ball, Paddle, GameStatus, GameSettings } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_WIDTH, 
  BALL_RADIUS, 
  INITIAL_BALL_SPEED, 
  SPEED_INCREMENT, 
  MAX_BALL_SPEED,
  DIFFICULTIES,
  AIR_DRAG,
  SPIN_INFLUENCE,
  SPIN_DECAY,
  PADDLE_FRICTION
} from '../constants';

interface GameViewProps {
  status: GameStatus;
  settings: GameSettings;
  onScore: (winner: 'player' | 'ai') => void;
  onRally: (count: number) => void;
}

const GameView: React.FC<GameViewProps> = ({ status, settings, onScore, onRally }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerPaddleRef = useRef<Paddle>({ y: CANVAS_HEIGHT / 2 - 40, prevY: CANVAS_HEIGHT / 2 - 40, height: 80, width: PADDLE_WIDTH, score: 0, isAI: false });
  const aiPaddleRef = useRef<Paddle>({ y: CANVAS_HEIGHT / 2 - 40, prevY: CANVAS_HEIGHT / 2 - 40, height: 80, width: PADDLE_WIDTH, score: 0, isAI: settings.mode === '1P' });
  const ballRef = useRef<Ball>({ 
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }, 
    vel: { x: INITIAL_BALL_SPEED, y: 0 }, 
    radius: BALL_RADIUS,
    spin: 0
  });
  const rallyCountRef = useRef(0);
  
  // Controls
  const p1TargetY = useRef(CANVAS_HEIGHT / 2);
  const p2TargetY = useRef(CANVAS_HEIGHT / 2);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    aiPaddleRef.current.isAI = settings.mode === '1P';
  }, [settings.mode]);

  const resetBall = (direction: number) => {
    ballRef.current.pos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    ballRef.current.vel = { 
      x: direction * INITIAL_BALL_SPEED, 
      y: (Math.random() - 0.5) * 4 
    };
    ballRef.current.spin = 0;
    rallyCountRef.current = 0;
  };

  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    const ball = ballRef.current;
    const p1 = playerPaddleRef.current;
    const p2 = aiPaddleRef.current;
    const diff = DIFFICULTIES[settings.difficulty];

    // Store previous positions for velocity calculation
    p1.prevY = p1.y;
    p2.prevY = p2.y;

    // Keyboard controls for P2 in 2P mode
    if (settings.mode === '2P') {
      if (keysPressed.current.has('ArrowUp')) p2TargetY.current -= 12;
      if (keysPressed.current.has('ArrowDown')) p2TargetY.current += 12;
      p2TargetY.current = Math.max(0, Math.min(CANVAS_HEIGHT, p2TargetY.current));
    }

    // P1 Movement
    p1.y += (p1TargetY.current - (p1.y + p1.height / 2)) * 0.25;
    p1.y = Math.max(0, Math.min(CANVAS_HEIGHT - p1.height, p1.y));

    // P2 Movement (AI or Target)
    if (p2.isAI) {
      // Advanced AI prediction
      const paddleCenter = p2.y + p2.height / 2;
      const targetY = ball.vel.x > 0 ? ball.pos.y : CANVAS_HEIGHT / 2;
      const error = (Math.random() - 0.5) * diff.errorMargin;
      p2.y += (targetY + error - paddleCenter) * 0.12 * (diff.speed / 6);
    } else {
      p2.y += (p2TargetY.current - (p2.y + p2.height / 2)) * 0.25;
    }
    p2.y = Math.max(0, Math.min(CANVAS_HEIGHT - p2.height, p2.y));

    // Calculate paddle velocities
    const vP1 = p1.y - p1.prevY;
    const vP2 = p2.y - p2.prevY;

    // Ball Physics - Magnus Effect Simulation
    // Spin curves the ball's Y velocity
    ball.vel.y += ball.spin * SPIN_INFLUENCE;
    
    // Air Drag
    ball.vel.x *= AIR_DRAG;
    ball.vel.y *= AIR_DRAG;
    ball.spin *= SPIN_DECAY;

    // Apply Velocity
    ball.pos.x += ball.vel.x;
    ball.pos.y += ball.vel.y;

    // Wall Bounces (Loss of energy and spin)
    if (ball.pos.y - ball.radius < 0) {
      ball.vel.y = Math.abs(ball.vel.y) * 0.9;
      ball.pos.y = ball.radius;
      ball.spin *= 0.8;
    } else if (ball.pos.y + ball.radius > CANVAS_HEIGHT) {
      ball.vel.y = -Math.abs(ball.vel.y) * 0.9;
      ball.pos.y = CANVAS_HEIGHT - ball.radius;
      ball.spin *= 0.8;
    }

    // Paddle Collisions
    const checkCollision = (paddle: Paddle, isLeft: boolean, paddleVel: number) => {
      const paddleX = isLeft ? 10 : CANVAS_WIDTH - 10 - PADDLE_WIDTH;
      const collisionX = isLeft ? paddleX + PADDLE_WIDTH : paddleX;
      
      // Broad check
      const isWithinX = isLeft 
        ? (ball.pos.x - ball.radius <= collisionX && ball.pos.x + ball.radius >= paddleX)
        : (ball.pos.x + ball.radius >= collisionX && ball.pos.x - ball.radius <= paddleX + PADDLE_WIDTH);

      if (isWithinX && ball.pos.y > paddle.y && ball.pos.y < paddle.y + paddle.height) {
        // Reverse X velocity
        ball.vel.x *= -1;
        
        // Prevent sticking
        ball.pos.x = isLeft ? collisionX + ball.radius : collisionX - ball.radius;
        
        // Transfer vertical momentum and spin
        // 1. Angular momentum from paddle friction
        ball.spin += paddleVel * PADDLE_FRICTION;
        
        // 2. Bounce angle based on where it hits the paddle
        const relativeHit = (ball.pos.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        ball.vel.y += relativeHit * 4 + paddleVel * 0.2;
        
        // Speed up the ball
        const currentSpeed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
        if (currentSpeed < MAX_BALL_SPEED) {
          ball.vel.x *= SPEED_INCREMENT;
          ball.vel.y *= SPEED_INCREMENT;
        }

        rallyCountRef.current += 1;
        onRally(rallyCountRef.current);
      }
    };

    checkCollision(p1, true, vP1);
    checkCollision(p2, false, vP2);

    // Scoring
    if (ball.pos.x < 0) {
      onScore('ai');
      resetBall(1);
    } else if (ball.pos.x > CANVAS_WIDTH) {
      onScore('player');
      resetBall(-1);
    }
  }, [status, settings, onScore, onRally]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid Background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

    // Center Line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH / 2, 0); ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT); ctx.stroke();
    ctx.setLineDash([]);

    // Ball with Spin Visualization
    const ball = ballRef.current;
    ctx.shadowBlur = 15;
    ctx.shadowColor = settings.color;
    ctx.fillStyle = settings.color;
    
    // Draw the main ball
    ctx.beginPath();
    ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw a small "shine" or dot to show rotation
    const rotationAngle = (Date.now() / 100) * (ball.spin / 5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    const dotX = ball.pos.x + Math.cos(rotationAngle) * (ball.radius * 0.5);
    const dotY = ball.pos.y + Math.sin(rotationAngle) * (ball.radius * 0.5);
    ctx.arc(dotX, dotY, ball.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Paddles
    const drawPaddle = (p: Paddle, x: number) => {
      ctx.shadowBlur = 20;
      ctx.shadowColor = settings.color;
      ctx.fillStyle = settings.color;
      ctx.beginPath();
      ctx.roundRect(x, p.y, p.width, p.height, 4);
      ctx.fill();
    };

    drawPaddle(playerPaddleRef.current, 10);
    drawPaddle(aiPaddleRef.current, CANVAS_WIDTH - 10 - PADDLE_WIDTH);
    ctx.shadowBlur = 0;
  }, [settings.color]);

  useEffect(() => {
    let frame: number;
    const loop = () => { update(); draw(); frame = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [update, draw]);

  // Input Handling
  const handleMove = (y: number, x: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const scaleX = CANVAS_WIDTH / rect.width;
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    if (settings.mode === '1P') {
      p1TargetY.current = canvasY;
    } else {
      if (canvasX < CANVAS_WIDTH / 2) {
        p1TargetY.current = canvasY;
      } else {
        p2TargetY.current = canvasY;
      }
    }
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      handleMove(touch.clientY, touch.clientX);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="relative group overflow-hidden rounded-xl border-4 border-slate-800 shadow-2xl bg-slate-950 touch-none">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseMove={(e) => handleMove(e.clientY, e.clientX)}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        className="w-full h-auto cursor-none max-w-4xl block"
      />
      {status !== GameStatus.PLAYING && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col text-center p-6">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-2 tracking-widest text-white">
            {status === GameStatus.START ? 'READY PLAYER ONE' : status === GameStatus.GAMEOVER ? 'MATCH OVER' : 'PAUSED'}
          </h2>
          <p className="text-slate-300 mb-6 text-sm italic">
            {settings.mode === '1P' ? 'Move to control paddle' : 'L-Half for P1, R-Half for P2'}
          </p>
        </div>
      )}
    </div>
  );
};

export default GameView;
