import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://192.168.2.51:5000"); // Adjust this to your backend URL

export default function Pong() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    ball: { x: 300, y: 200, radius: 10 },
    paddles: { left: 50, right: 50 },
  });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ball
      ctx.beginPath();
      ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.closePath();

      // Draw paddles
      ctx.fillRect(20, gameState.paddles.left, 10, 80);
      ctx.fillRect(570, gameState.paddles.right, 10, 80);
    }

    draw();
  }, [gameState]);

  useEffect(() => {
    socket.on("gameState", (data) => {
      setGameState(data);
    });

    return () => socket.off("gameState");
  }, []);

  const movePaddle = (side, direction) => {
    socket.emit("movePaddle", { side, direction });
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <canvas ref={canvasRef} width={600} height={400} className="border border-white" />
      <div className="flex gap-4 mt-4">
        <button onClick={() => movePaddle("left", "up")} className="bg-blue-500 text-white p-2">Left Up</button>
        <button onClick={() => movePaddle("left", "down")} className="bg-blue-500 text-white p-2">Left Down</button>
        <button onClick={() => movePaddle("right", "up")} className="bg-red-500 text-white p-2">Right Up</button>
        <button onClick={() => movePaddle("right", "down")} className="bg-red-500 text-white p-2">Right Down</button>
      </div>
    </div>
  );
}
