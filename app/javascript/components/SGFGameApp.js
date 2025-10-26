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
  const SIZE = parseInt(gameTree.data.SZ ? gameTree.data.SZ[0] : 19);
  let currentBoard = Board.fromDimensions(SIZE);

  const processInitialStones = (color, stoneKey) => {
    if (gameTree.data[stoneKey] && gameTree.data[stoneKey].length > 0) {
      for (let coord of gameTree.data[stoneKey]) {
        const [x, y] = sgfCoordToVertex(coord, SIZE);
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
  // for (const node of gameTree.children) {
  //   if (node.data.B && node.data.B.length > 0) {
  //     const coord = node.data.B[0];
  //     const [x, y] = sgfCoordToVertex(coord, SIZE);
  //     if (x !== null) {
  //       currentBoard = currentBoard.makeMove(1, [x, y], { preventOverwrite: false, preventSuicide: true });
  //     }
  //   }
  //   if (node.data.W && node.data.W.length > 0) {
  //     const coord = node.data.W[0];
  //     const [x, y] = sgfCoordToVertex(coord, SIZE);
  //     if (x !== null) {
  //       currentBoard = currentBoard.makeMove(-1, [x, y], { preventOverwrite: false, preventSuicide: true });
  //     }
  //   }
  // }
  return { board: currentBoard, boardSize: SIZE };
}

function SGFGameApp(args) {
  const { initialBoard, initialBoardSize } = useMemo(() => {
    try {
      console.log(args.sgf);
      const [gameTree] = parse(args.sgf);
      if (gameTree) {
        const { board, boardSize } = calculateSignMapFromTree(gameTree);
        return { initialBoard: board, initialBoardSize: boardSize };
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

  const handleVertexMouseMove = (_, [x, y]) => {
    const markMap = Array.from({ length: boardSize }, () =>
      Array.from({ length: boardSize }, () => null)
    );
    markMap[y][x] = { sign: 1 }
    setGhostStoneMap(markMap)
  }

  const handleVertexMouseLeave = () => {
    setGhostStoneMap(null)
  }

  const handleVertexClick = (evt, [x, y]) => {
    let sign = nextPlayer;

    let newBoard = boardState.makeMove(sign, [x, y], {
      preventOverwrite: true,
      preventSuicide: true
    });

    if (newBoard !== boardState) {
      setBoardState(newBoard);
      setNextPlayer(-sign);
    }
  };

  return (
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
  );
}

export default SGFGameApp;