// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "controllers"
import "@hotwired/turbo-rails"


// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import { h, render } from "preact";
import { useState, useMemo } from 'preact/hooks';
import { parse } from "@sabaki/sgf";
import Board from "@sabaki/go-board";
import {Goban} from "@sabaki/shudan";

const chineseCoord = [
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
];

const signMap = [
  [0, 0, 0, -1, -1, -1, 1, 0, 1, 1, -1, -1, 0, -1, 0, -1, -1, 1, 0],
  [0, 0, -1, 0, -1, 1, 1, 1, 0, 1, -1, 0, -1, -1, -1, -1, 1, 1, 0],
  [0, 0, -1, -1, -1, 1, 1, 0, 0, 1, 1, -1, -1, 1, -1, 1, 0, 1, 0],
  [0, 0, 0, 0, -1, -1, 1, 0, 1, -1, 1, 1, 1, 1, 1, 0, 1, 0, 0],
  [0, 0, 0, 0, -1, 0, -1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0],
  [0, 0, -1, 0, 0, -1, -1, 1, 0, -1, -1, 1, -1, -1, 0, 1, 0, 0, 1],
  [0, 0, 0, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
  [0, 0, -1, 1, 1, 0, 1, -1, -1, 1, 0, 1, -1, 0, 1, -1, -1, -1, 1],
  [0, 0, -1, -1, 1, 1, 1, 0, -1, 1, -1, -1, 0, -1, -1, 1, 1, 1, 1],
  [0, 0, -1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1],
  [-1, -1, -1, -1, 1, 1, 1, -1, 0, -1, 1, -1, -1, 0, -1, 1, 1, -1, 0],
  [-1, 1, -1, 0, -1, -1, -1, -1, -1, -1, 1, -1, 0, -1, -1, 1, -1, 0, -1],
  [1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 0, 1, -1, 0, -1, 1, -1, -1, 0],
  [0, 1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, -1, 1, 1, -1, 1],
  [0, 0, -1, 1, 0, 0, 1, 1, -1, -1, 0, 1, -1, 1, -1, 1, -1, 0, -1],
  [0, 0, 1, 0, 1, 0, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, 0],
  [0, 0, 0, 0, 1, 1, 0, 1, -1, 0, -1, -1, 1, 1, 1, 1, -1, -1, -1],
  [0, 0, 1, 1, -1, 1, 1, -1, 0, -1, -1, 1, 1, 1, 1, 0, 1, -1, 1],
  [0, 0, 0, 1, -1, -1, -1, -1, -1, 0, -1, -1, 1, 1, 0, 1, 1, 1, 0],
];

const paintMap = [
  [-1, -1, -1, -1, -1, -1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, -1, 1, 1],
  [-1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, 1, 1],
  [-1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, 0, 1, 1, 1, 1],
  [-1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, 1, 1, 1],
  [-1, -1, -1, 1, 1, 1, 1, -1, -1, 1, 0, 1, -1, -1, -1, -1, -1, -1, 1],
  [-1, -1, -1, -1, 1, 1, 1, 0, -1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1],
  [-1, -1, -1, 1, 1, -1, -1, -1, -1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1],
  [-1, -1, -1, -1, 1, 1, 1, -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, -1],
  [-1, 1, -1, 0, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, -1],
  [1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, -1, -1, 1, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, -1, -1, -1, 1, 1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 0, 1, -1, -1, -1, 1, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, 1, 1, 1, 1, -1, -1, -1],
  [1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, -1, 1],
  [1, 1, 1, 1, -1, -1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, 1],
].map((row) => row.map((sign) => ((Math.random() * 2 + 1) / 3) * sign));

const heatMap = (() => {
  let _ = null;
  let O = (strength, text) => ({ strength, text });
  let O1 = O(1, "20%\n111");
  let O5 = O(5, "67%\n2315");
  let O9 = O(9, "80%\n13.5k");

  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, O(7), O9, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, O(3), _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, O(2), _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, O1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, O5, O(4), _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ];
})();

const markerMap = (() => {
  let _ = null;
  let O = { type: "circle" };
  let X = { type: "cross" };
  let T = { type: "triangle" };
  let Q = { type: "square" };
  let $ = { type: "point" };
  let S = { type: "loader" };
  let L = (label) => ({ type: "label", label });
  let A = L("a");
  let B = L("b");
  let C = L("c");
  let longLabel = L("Long\nlabel with linebreak");

  return [
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, O, O, O, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, T, T, T, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, $, $, $, _, _, _, _, _, _, _, _, _, _, _, S, S, S, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, Q, _, _, _, _, _, _, _, _, _, longLabel],
    [_, _, _, _, _, _, _, _, Q, _, _, _, _, _, _, _, _, _, C],
    [_, _, _, _, _, _, _, _, Q, _, _, _, _, _, _, _, _, _, B],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, A],
  ];
})();

const ghostStoneMap = (() => {
  let _ = null;
  let O = (t) => ({ sign: -1, type: t });
  let X = (t) => ({ sign: 1, type: t });
  let o = (t) => ({ sign: -1, type: t, faint: true });
  let x = (t) => ({ sign: 1, type: t, faint: true });
  let [Xg, xg] = [X, x].map((f) => f("good"));
  let [Xb, xb] = [X, x].map((f) => f("bad"));
  let [Xi, xi] = [X, x].map((f) => f("interesting"));
  let [Xd, xd] = [X, x].map((f) => f("doubtful"));

  return [
    [X(), x(), _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [O(), o(), _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xg, xg, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xi, xi, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xd, xd, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [Xb, xb, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  ];
})();

const createTwoWayCheckBox = ({ checked, onClick, text }) =>
    h(
      "label",
      {
        style: {
          display: "flex",
          alignItems: "center",
        },
      },

      h("input", {
        style: { marginRight: ".5em" },
        type: "checkbox",
        checked: checked,

        onClick: onClick,
      }),

      h("span", { style: { userSelect: "none" } }, text)
    );

const SGF_TEXT = `(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.50.1]KM[6.5]SZ[19]DT[2023-10-17]PB[Player1]PW[Player2]AB[ab][bc]AW[ef][cd];B[pd];W[cp];B[qp];W[oc])`;

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
  const SIZE = parseInt(gameTree.children[0].data.SZ ? gameTree.children[0].data.SZ[0] : 19);
  let currentBoard = Board.fromDimensions(SIZE);
 
  if(gameTree.data.AB && gameTree.data.AB.length > 0) {
    for(let coord of gameTree.data.AB) {
      const [x, y] = sgfCoordToVertex(coord, SIZE);
      if (x !== null) {
        currentBoard = currentBoard.makeMove(1, [x, y], { preventOverwrite: true, preventSuicide: true });
      }
    }
  }
  if(gameTree.data.AW && gameTree.data.AW.length > 0) {
    for(let coord of gameTree.data.AW) {
      const [x, y] = sgfCoordToVertex(coord, SIZE);
      if (x !== null) {
        currentBoard = currentBoard.makeMove(-1, [x, y], { preventOverwrite: true, preventSuicide: true });
      }
    }
  }
  for (const node of gameTree.children) {
    if (node.data.B && node.data.B.length > 0) {
      const coord = node.data.B[0];
      const [x, y] = sgfCoordToVertex(coord, SIZE);
      if (x !== null) {
        currentBoard = currentBoard.makeMove(1, [x, y], { preventOverwrite: true, preventSuicide: true });
      }
    }
    if (node.data.W && node.data.W.length > 0) {
      const coord = node.data.W[0];
      const [x, y] = sgfCoordToVertex(coord, SIZE);
      if (x !== null) {
        currentBoard = currentBoard.makeMove(-1, [x, y], { preventOverwrite: true, preventSuicide: true });
      }
    }
  }
  return { board: currentBoard, boardSize: SIZE };
}

function App() {
  const [board, setBoard] = useState(new Board(signMap));
  const [vertexSize, setVertexSize] = useState(24);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [alternateCoordinates, setAlternateCoordinates] = useState(false);
  const [showCorner, setShowCorner] = useState(false);
  const [showDimmedStones, setShowDimmedStones] = useState(false);
  const [fuzzyStonePlacement, setFuzzyStonePlacement] = useState(false);
  const [animateStonePlacement, setAnimateStonePlacement] = useState(false);
  const [showPaintMap, setShowPaintMap] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showMarkerMap, setShowMarkerMap] = useState(false);
  const [showGhostStones, setShowGhostStones] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

    return h(
      "section",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "15em auto",
          gridColumnGap: "1em",
        },
      },

      h(
        "form",
        {
          style: {
            display: "flex",
            flexDirection: "column",
          },
        },

        h(
          "p",
          { style: { margin: "0 0 .5em 0" } },
          "Size: ",

          h(
            "button",
            {
              type: "button",
              onClick: (evt) => {
                setVertexSize(Math.max(vertexSize - 4, 4));
              },
            },
            "-"
          ),
          " ",

          h(
            "button",
            {
              type: "button",
              title: "Reset",
              onClick: (evt) => {
                setVertexSize(24);
              },
            },
            "•"
          ),
          " ",

          h(
            "button",
            {
              type: "button",
              onClick: (evt) => {
                setVertexSize(vertexSize + 4);
              },
            },
            "+"
          )
        ),
        h(
          "p",
          { style: { margin: "0 0 .5em 0" } },
          "Stones: ",

          h(
            "button",
            {
              type: "button",
              title: "Reset",
              onClick: (evt) => {
                setBoard(new Board(signMap));
              },
            },
            "•"
          )
        ),
        h(createTwoWayCheckBox, {
          checked: showCoordinates,
          onClick: () => {setShowCoordinates(!showCoordinates)},
          text: "Show coordinates",
        }),
        h(createTwoWayCheckBox, {
          checked: alternateCoordinates,
          onClick: () => {setAlternateCoordinates(!alternateCoordinates)},
          text: "Alternate coordinates",
        }),
        h(createTwoWayCheckBox, {
          checked: showCorner,
          onClick: () => {setShowCorner(!showCorner)},
          text: "Show lower right corner only",
        }),
        h(createTwoWayCheckBox, {
          checked: showDimmedStones,
          onClick: () => {setShowDimmedStones(!showDimmedStones)},
          text: "Dim dead stones",
        }),
        h(createTwoWayCheckBox, {
          checked: fuzzyStonePlacement,
          onClick: () => {setFuzzyStonePlacement(!fuzzyStonePlacement)},
          text: "Fuzzy stone placement",
        }),
        h(createTwoWayCheckBox, {
          checked: animateStonePlacement,
          onClick: () => {setAnimateStonePlacement(!animateStonePlacement)},
          text: "Animate stone placement",
        }),
        h(createTwoWayCheckBox, {
          checked: showMarkerMap,
          onClick: () => {setShowMarkerMap(!showMarkerMap)},
          text: "Show markers"
        }),
        h(createTwoWayCheckBox, {
          checked: showGhostStones,
          onClick: () => {setShowGhostStones(!showGhostStones)},
          text: "Show ghost stones",
        }),
        h(createTwoWayCheckBox, {
          checked: showPaintMap,
          onClick: () => {setShowPaintMap(!showPaintMap)},
          text: "Show paint map"
        }),
        h(createTwoWayCheckBox, {
          checked: showHeatMap,
          onClick: () => {setShowHeatMap(!showHeatMap)},
          text: "Show heat map"
        }),
        h(createTwoWayCheckBox, {
          checked: showLines,
          onClick: () => {setShowLines(!showLines)},
          text: "Show lines"
        }),
        h(createTwoWayCheckBox, {
          checked: showSelection,
          onClick: () => {setShowSelection(!showSelection)},
          text: "Show selection"
        }),
        h(createTwoWayCheckBox, {
          checked: isBusy,
          onClick: () => {setIsBusy(!isBusy)},
          text: "Busy"
        })
      ),

      h(
        "div",
        {},
        h(Goban, {
          innerProps: {
            onContextMenu: (evt) => evt.preventDefault(),
          },

          vertexSize,
          animate: true,
          busy: isBusy,
          rangeX: showCorner ? [8, 18] : undefined,
          rangeY: showCorner ? [12, 18] : undefined,
          coordX: alternateCoordinates ? (i) => chineseCoord[i] : undefined,
          coordY: alternateCoordinates ? (i) => i + 1 : undefined,

          signMap: board.signMap,
          showCoordinates,
          fuzzyStonePlacement,
          animateStonePlacement,
          paintMap: showPaintMap && paintMap,
          heatMap: showHeatMap && heatMap,
          markerMap: showMarkerMap && markerMap,
          ghostStoneMap: showGhostStones && ghostStoneMap,

          lines: showLines
            ? [
                { type: "line", v1: [15, 6], v2: [12, 15] },
                { type: "arrow", v1: [10, 4], v2: [5, 7] },
              ]
            : [],

          dimmedVertices: showDimmedStones
            ? [
                [2, 14],
                [2, 13],
                [5, 13],
                [6, 13],
                [9, 3],
                [9, 5],
                [10, 5],
                [14, 7],
                [13, 13],
                [13, 14],
                [18, 13],
              ]
            : [],

          selectedVertices: showSelection
            ? [
                [8, 7],
                [9, 7],
                [9, 8],
                [10, 7],
                [10, 8],
              ]
            : [],

          onVertexMouseUp: (evt, [x, y]) => {
            let sign = evt.button === 0 ? 1 : -1;
            let newBoard = board.makeMove(sign, [x, y], { preventOverwrite: true, preventSuicide: true });
            setBoard(newBoard);
          },
        }),

        alternateCoordinates &&
          h(
            "style",
            {},
            `.shudan-coordx span {
                font-size: .45em;
            }`
          )
      )
    );
}

function SGFViewerApp() {
  const { initialBoard, initialBoardSize } = useMemo(() => {
    try {
      const [gameTree] = parse(SGF_TEXT);
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
    h(
      "div",
      { style: { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' } },

      h("h1", null, "SGF Viewer with @sabaki/shudan (Functional Component)"),

      h("p", null,
        "当前落子: ",
        h("span", { style: { color: nextPlayer === 1 ? 'black' : 'white', fontWeight: 'bold', background: nextPlayer === 1 ? 'white' : 'black', padding: '2px 4px', border: '1px solid black' } },
            nextPlayer === 1 ? '黑' : '白'
        )
      ),

      h(Goban, {
        signMap: boardState.signMap,
        boardSize: boardSize,
        vertexSize: vertexSize,
        showCoordinates: showCoordinates,
        onVertexClick: handleVertexClick,
      }),
     
      h("pre", { style: { marginTop: '20px', fontSize: '0.8em', maxWidth: '100%', overflowX: 'auto' } }, `SGF Loaded: ${SGF_TEXT}`)
    )
  );
}

render(h(App), document.getElementById("root"));
