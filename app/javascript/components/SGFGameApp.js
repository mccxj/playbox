import { h, render } from "preact";
import { useState, useMemo } from 'preact/hooks';
import { parse } from "@sabaki/sgf";
import Board from "@sabaki/go-board";
import { Goban } from "@sabaki/shudan";

function sgfCoordToVertex(coord, size) {
  if (coord.length !== 2) return null;
  const x = coord.charCodeAt(0) - 'a'.charCodeAt(0);
  const y = coord.charCodeAt(1) - 'a'.charCodeAt(0);

  if (x >= 0 && x < size && y >= 0 && y < size) {
    return [x, y];
  }
  return null;
}

function calculateSignMapFromTree(gameTree) {
  const size = parseInt(gameTree.data.SZ ? gameTree.data.SZ[0] : 19);
  let currentBoard = Board.fromDimensions(size);

  const processInitialStones = (color, stoneKey) => {
    if (gameTree.data[stoneKey] && gameTree.data[stoneKey].length > 0) {
      for (let coord of gameTree.data[stoneKey]) {
        const [x, y] = sgfCoordToVertex(coord, size);
        if (x !== null) {
          currentBoard = currentBoard.makeMove(color, [x, y], {
            preventOverwrite: false,
            preventSuicide: true,
          });
        }
      }
    }
  };
  processInitialStones(1, 'AB'); // 黑棋
  processInitialStones(-1, 'AW'); // 白棋
  currentBoard.nextPlay = (gameTree.data.PL === 'W' || gameTree.children[0].data.W) ? -1 : 1;
  return { board: currentBoard, boardSize: size };
}

function SGFGameApp(args) {
  const { initialBoard, initialBoardSize, initGameTree } = useMemo(() => {
    try {
      const [gameTree] = parse(args.sgf);
      if (gameTree) {
        const { board, boardSize } = calculateSignMapFromTree(gameTree);
        return { initialBoard: board, initialBoardSize: boardSize, initGameTree: gameTree };
      }
    } catch (error) {
      console.error("SGF 解析或处理失败:", error);
    }
    return { initialBoard: Board.fromDimensions(19), initialBoardSize: 19 };
  }, []);

  const [boardState, setBoardState] = useState(initialBoard);
  const [boardSize] = useState(initialBoardSize);
  const [vertexSize] = useState(30);
  const [showCoordinates] = useState(true);
  const [nextPlayer, setNextPlayer] = useState(boardState.nextPlay);
  const [ghostStoneMap, setGhostStoneMap] = useState(null);
  const [gameTree, setGameTree] = useState(initGameTree);
  const [gameState, setGameState] = useState(0);

  const handleVertexMouseMove = (_, [x, y]) => {
    const markMap = Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => null)
    );
    markMap[y][x] = { sign: nextPlayer }
    setGhostStoneMap(markMap)
  }

  const handleVertexMouseLeave = () => {
    setGhostStoneMap(null)
  }

  const handleVertexClick = (evt, [x, y]) => {
    let sign = nextPlayer;
    const player = sign === 1 ? "B" : "W";
    let newBoard;
    debugger;
    // 找到有沒有匹配的下法
    for (let node of gameTree.children) {
      if (node.data[player] && node.data[player].length > 0) {
        let coord = node.data[player][0];
        let [ex, ey] = sgfCoordToVertex(coord, boardSize);
        // 找到了，可能是正確的，也可能是錯誤的分支
        if (ex !== null && ex === x && ey === y) {
          newBoard = boardState.makeMove(sign, [x, y], { preventOverwrite: true, preventSuicide: true });
          setGameTree(node);
          let tmpGameTree = node;
          let tmpPlayer = sign === 1 ? "W" : "B";
          for (let node of tmpGameTree.children) {
            if (node.data[tmpPlayer] && node.data[tmpPlayer].length > 0) {
              let coord = node.data[tmpPlayer][0];
              let [ex, ey] = sgfCoordToVertex(coord, boardSize);
              if (ex != null) {
                newBoard = newBoard.makeMove(-sign, [ex, ey], { preventOverwrite: true, preventSuicide: true });
                setGameTree(node);
                setBoardState(newBoard);
                setNextPlayer(sign);
                setGameState(1);
              }
            }
          }
        }
      }
    }
    // 沒有找到，只能說明錯誤了
    newBoard = boardState.makeMove(sign, [x, y], { preventOverwrite: true, preventSuicide: true });
    if (newBoard !== boardState) {
      setBoardState(newBoard);
      setNextPlayer(-sign);
      setGameState(-1);
    }
  };

  return (
    h("p", null, gameState,
      h(Goban, {
        signMap: boardState.signMap,
        boardSize: boardSize,
        vertexSize: vertexSize,
        showCoordinates: showCoordinates,
        ghostStoneMap: ghostStoneMap,
        onVertexMouseMove: handleVertexMouseMove,
        onVertexMouseLeave: handleVertexMouseLeave,
        onVertexClick: handleVertexClick,
      })
    )
  );
}

export default SGFGameApp;