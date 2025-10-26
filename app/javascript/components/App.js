
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