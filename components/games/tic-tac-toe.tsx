"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Difficulty = "easy" | "medium" | "hard"

const calculateWinner = (squares: (string | null)[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diagonals
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

const minimax = (board: (string | null)[], depth: number, isMaximizing: boolean, computerSide: string): number => {
  const winner = calculateWinner(board)
  const playerSide = computerSide === "X" ? "O" : "X"

  if (winner === computerSide) return 10 - depth
  if (winner === playerSide) return depth - 10
  if (board.every((cell) => cell !== null)) return 0

  if (isMaximizing) {
    let bestScore = -Infinity
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = computerSide
        const score = minimax(board, depth + 1, false, computerSide)
        board[i] = null
        bestScore = Math.max(score, bestScore)
      }
    }
    return bestScore
  } else {
    let bestScore = Infinity
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = playerSide
        const score = minimax(board, depth + 1, true, computerSide)
        board[i] = null
        bestScore = Math.min(score, bestScore)
      }
    }
    return bestScore
  }
}

export function TicTacToe({ onClose }: { onClose: () => void }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [playerSide, setPlayerSide] = useState<"X" | "O">(() => Math.random() > 0.5 ? "X" : "O")

  const winner = calculateWinner(board)
  const isBoardFull = board.every((square) => square !== null)
  const computerSide = playerSide === "X" ? "O" : "X"
  const isComputerTurn = isXNext === (computerSide === "X")

  useEffect(() => {
    if (isComputerTurn && !winner && !isBoardFull) {
      const timer = setTimeout(() => {
        const emptyIndices = board
          .map((val, idx) => (val === null ? idx : null))
          .filter((val) => val !== null) as number[]

        if (emptyIndices.length > 0) {
          let moveIndex = -1

          if (difficulty === "easy") {
            moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
          } else if (difficulty === "medium") {
            // 1. Can Computer Win?
            for (const i of emptyIndices) {
              const boardCopy = [...board]
              boardCopy[i] = computerSide
              if (calculateWinner(boardCopy) === computerSide) {
                moveIndex = i
                break
              }
            }
            // 2. Block Player Win
            if (moveIndex === -1) {
              for (const i of emptyIndices) {
                const boardCopy = [...board]
                boardCopy[i] = playerSide
                if (calculateWinner(boardCopy) === playerSide) {
                  moveIndex = i
                  break
                }
              }
            }
            // 3. Take Center
            if (moveIndex === -1 && board[4] === null) {
              moveIndex = 4
            }
            // 4. Random Move
            if (moveIndex === -1) {
              moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
            }
          } else {
            // Hard - Minimax Algorithm
            let bestScore = -Infinity
            for (let i = 0; i < board.length; i++) {
              if (board[i] === null) {
                board[i] = computerSide
                const score = minimax(board, 0, false, computerSide)
                board[i] = null
                if (score > bestScore) {
                  bestScore = score
                  moveIndex = i
                }
              }
            }
          }

          if (moveIndex !== -1) {
            const newBoard = [...board]
            newBoard[moveIndex] = computerSide
            setBoard(newBoard)
            setIsXNext(!isXNext)
          }
        }
      }, 500) // Simulate thinking

      return () => clearTimeout(timer)
    }
  }, [isXNext, board, winner, isBoardFull, difficulty, playerSide, computerSide])

  const handleClick = (index: number) => {
    if (board[index] || winner || isComputerTurn) return
    const newBoard = [...board]
    newBoard[index] = playerSide
    setBoard(newBoard)
    setIsXNext(!isXNext)
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setPlayerSide(Math.random() > 0.5 ? "X" : "O")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
      <div className="text-center space-y-3 w-full max-w-[300px]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold">Tic Tac Toe</h2>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm font-medium">Difficulty:</span>
          <Select value={difficulty} onValueChange={(val: Difficulty) => setDifficulty(val)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-16 flex flex-col justify-center">
          {winner ? (
            <p className="text-xl font-bold text-primary animate-in fade-in zoom-in">
              🎉 {winner === playerSide ? "You win!" : "Computer wins!"}
            </p>
          ) : isBoardFull ? (
            <p className="text-xl font-bold text-accent animate-in fade-in zoom-in">It's a draw!</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                You are playing as <span className="text-foreground font-bold">{playerSide}</span>
              </p>
              <p className="text-lg">
                {isComputerTurn ? "Computer is thinking..." : "Your turn"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-card p-4 rounded-lg border border-border">
        {board.map((value, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            disabled={value !== null || isComputerTurn || winner !== null}
            className={`w-24 h-24 bg-background border-2 border-border rounded-lg text-4xl font-bold transition-colors ${value === null && !isComputerTurn && !winner
                ? "hover:bg-muted cursor-pointer"
                : "cursor-default opacity-80"
              } ${value === playerSide ? "text-primary" : "text-destructive"}`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <Button onClick={resetGame} className="bg-primary hover:bg-primary/90">
          New Game
        </Button>
        <Button onClick={onClose} variant="outline">
          Back to Games
        </Button>
      </div>
    </div>
  )
}
