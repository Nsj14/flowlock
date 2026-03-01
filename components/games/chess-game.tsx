"use client"

import { useState, useEffect, useCallback } from "react"
import { Chess, Move, Square } from "chess.js"
import { Chessboard } from "react-chessboard"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Difficulty = "easy" | "medium" | "hard"

const pieceValues: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 }

const evaluateBoard = (chessObj: Chess) => {
    let score = 0
    const board = chessObj.board()
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j]
            if (piece) {
                const val = pieceValues[piece.type] || 0
                score += piece.color === "w" ? val : -val
            }
        }
    }
    return score
}

const getBestMove = (
    chessObj: Chess,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number
): [Move | null, number] => {
    if (depth === 0) return [null, evaluateBoard(chessObj)]

    const moves = chessObj.moves({ verbose: true })

    if (moves.length === 0) {
        if (chessObj.isCheckmate()) return [null, isMaximizing ? -9999 + depth : 9999 - depth]
        return [null, 0] // draw or stalemate
    }

    let bestMove = moves[0]

    if (isMaximizing) {
        let maxEval = -Infinity
        for (const move of moves) {
            chessObj.move(move)
            const [_, evalScore] = getBestMove(chessObj, depth - 1, false, alpha, beta)
            chessObj.undo()

            if (evalScore > maxEval) {
                maxEval = evalScore
                bestMove = move
            }
            alpha = Math.max(alpha, evalScore)
            if (beta <= alpha) break
        }
        return [bestMove, maxEval]
    } else {
        let minEval = Infinity
        for (const move of moves) {
            chessObj.move(move)
            const [_, evalScore] = getBestMove(chessObj, depth - 1, true, alpha, beta)
            chessObj.undo()

            if (evalScore < minEval) {
                minEval = evalScore
                bestMove = move
            }
            beta = Math.min(beta, evalScore)
            if (beta <= alpha) break
        }
        return [bestMove, minEval]
    }
}

export function ChessGame({ onClose }: { onClose: () => void }) {
    const [game, setGame] = useState(new Chess())
    const [difficulty, setDifficulty] = useState<Difficulty>("medium")
    const [gameStatus, setGameStatus] = useState<string>("")
    const [moveFrom, setMoveFrom] = useState<Square | null>(null)
    const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})

    useEffect(() => {
        if (game.isCheckmate()) {
            setGameStatus(game.turn() === "w" ? "Computer wins by checkmate!" : "You win by checkmate!")
        } else if (game.isDraw()) setGameStatus("Draw!")
        else if (game.isCheck()) setGameStatus("Check!")
        else setGameStatus("")
    }, [game])

    const makeComputerMove = useCallback(() => {
        const possibleMoves = game.moves({ verbose: true })
        if (game.isGameOver() || possibleMoves.length === 0) return

        // Small delay to prevent blocking immediately and simulate thinking
        setTimeout(() => {
            let move: Move | null = null
            if (difficulty === "easy") {
                move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
            } else {
                // Depth 2 for Medium, 3 for Hard
                const depth = difficulty === "medium" ? 2 : 3
                const gameCopy = new Chess(game.fen())

                // We evaluate from Black's perspective (minimizing white's score)
                const [bestMove] = getBestMove(gameCopy, depth, false, -Infinity, Infinity)
                move = bestMove || possibleMoves[0]
            }

            if (move) {
                const gameCopy = new Chess(game.fen())
                gameCopy.move(move)
                setGame(gameCopy)
            }
        }, 300)
    }, [game, difficulty])

    const getMoveOptions = (square: Square) => {
        const moves = game.moves({
            square,
            verbose: true,
        }) as Move[]

        if (moves.length === 0) {
            setOptionSquares({})
            return false
        }

        const newSquares: Record<string, React.CSSProperties> = {}
        moves.forEach((move) => {
            newSquares[move.to] = {
                background:
                    game.get(move.to as Square) && game.get(move.to as Square)?.color !== game.get(square)?.color
                        ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
                        : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
                borderRadius: "50%",
            }
        })
        newSquares[square] = {
            background: "rgba(255, 255, 0, 0.4)",
        }
        setOptionSquares(newSquares)
        return true
    }

    const onSquareClick = (args: any) => {
        // Handle both older string signature and newer object signature
        const square: Square = typeof args === "string" ? args : (args.square || args)

        // Prevent player from moving while computer is thinking or if game is over
        if (game.turn() === "b" || game.isGameOver()) return

        // From square
        if (!moveFrom) {
            const piece = game.get(square)
            // Only allow selecting white pieces
            if (piece && piece.color === "w") {
                const hasMoveOptions = getMoveOptions(square)
                if (hasMoveOptions) setMoveFrom(square)
            }
            return
        }

        // To square
        if (!optionSquares[square] && moveFrom !== square) {
            const piece = game.get(square)
            // If clicking another white piece, switch selection
            if (piece && piece.color === "w") {
                const hasMoveOptions = getMoveOptions(square)
                if (hasMoveOptions) setMoveFrom(square)
            } else {
                // Clicking invalid empty square or black piece
                setMoveFrom(null)
                setOptionSquares({})
            }
            return
        }

        // Execute move
        try {
            const gameCopy = new Chess(game.fen())
            const move = gameCopy.move({
                from: moveFrom,
                to: square,
                promotion: "q", // always promote to queen for simplicity
            })

            if (move) {
                setGame(gameCopy)
                setMoveFrom(null)
                setOptionSquares({})
            }
        } catch (e) {
            // Invalid move, clear selection
            setMoveFrom(null)
            setOptionSquares({})
        }
    }

    // Accept any args and destructure properly to handle both API versions
    const onDrop = (...args: any[]) => {
        let sourceSquare: string, targetSquare: string

        if (typeof args[0] === 'object' && args[0] !== null) {
            sourceSquare = args[0].sourceSquare
            targetSquare = args[0].targetSquare
        } else {
            sourceSquare = args[0]
            targetSquare = args[1]
        }

        // Prevent drag and drop if it's black's turn or game over
        if (game.turn() === "b" || game.isGameOver()) return false

        try {
            const gameCopy = new Chess(game.fen())
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q", // always promote to queen for simplicity
            })

            if (move === null) return false

            setGame(gameCopy)
            setMoveFrom(null)
            setOptionSquares({})
            return true
        } catch (e) {
            return false
        }
    }

    useEffect(() => {
        if (game.turn() === "b" && !game.isGameOver()) {
            makeComputerMove()
        }
    }, [game.fen(), makeComputerMove])

    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6 w-full max-w-2xl mx-auto p-4">
            <div className="text-center space-y-3 w-full">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold">Chess vs Computer</h2>
                    <div className="flex items-center gap-2">
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
                </div>

                <div className="h-8">
                    {gameStatus ? (
                        <p className="text-lg font-semibold text-primary animate-in fade-in zoom-in">{gameStatus}</p>
                    ) : (
                        <p className="text-lg">
                            {game.turn() === "w" ? "Your turn (White)" : "Computer is thinking..."}
                        </p>
                    )}
                </div>
            </div>

            <div className="chess-board-wrapper w-full max-w-[500px] mx-auto bg-[#1a1a2e] p-2 sm:p-4 rounded-xl shadow-lg border border-border">
                <Chessboard
                    options={{
                        id: "playBoard",
                        position: game.fen(),
                        onPieceDrop: onDrop,
                        onSquareClick: onSquareClick,
                        boardOrientation: "white",
                        darkSquareStyle: { backgroundColor: '#779556' },
                        lightSquareStyle: { backgroundColor: '#ebecd0' },
                        squareStyles: optionSquares,
                        allowDragOffBoard: false
                    }}
                />
            </div>

            <div className="flex gap-4">
                <Button onClick={() => setGame(new Chess())} className="bg-primary hover:bg-primary/90">
                    New Game
                </Button>
                <Button onClick={onClose} variant="outline">
                    Back to Games
                </Button>
            </div>
        </div>
    )
}
