import { Chess } from "chess.js";
const game = new Chess();
try {
  const move = game.move({ from: "e2", to: "e4" });
  console.log("Move success:", move);
} catch (e) {
  console.error("Move error:", e);
}
