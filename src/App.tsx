import { useEffect, useRef, useState, type ChangeEventHandler } from 'react'
import './App.css'
import { correction, generate, mode, type Correction, type Mask } from 'lean-qr';

type PartsList = { [key: string]: number };
type ANGLES = 0 | 90 | 180 | 270;
type Studs = boolean[][];
type Part = {
  name: string,
  angles: ANGLES[],
  studs: Studs
}

const standardPart = (width: number, height: number): Part => ({
  name: `${width}x${height}`,
  angles: width === height ? [0] : [0, 90],
  studs: Array.from({ length: width }, () => Array.from({ length: height }, () => true))
});

const PARTS: Part[] = [
  // 36
  standardPart(6, 6),//, '6881'],
  // 16
  standardPart(4, 4),//, '1751'],
  // 12
  standardPart(2, 6),//, '69729'],
  // 8
  standardPart(1, 8),//, '4162'],
  standardPart(2, 4),//, '87079'],
  // 6
  standardPart(1, 6),//, '6636'],
  standardPart(2, 3),//, '26603'],
  // 4
  standardPart(1, 4),//, '2431'],
  standardPart(2, 2),//, '3068'],
  // 3
  standardPart(1, 3),//, '63864'],
  {
    name: '2x2 Corner',
    angles: [0, 90, 180, 270],
    studs: [
      [true, false],
      [true, true]
    ]
  },
  // 2
  standardPart(1, 2),//, '3069'],
  // 1
  standardPart(1, 1),//, '3070']
]
function App() {
  const [text, setText] = useState("https://frontroyallug.wordpress.com");
  const [ecc, setEcc] = useState<Correction>(correction.L);
  const [mask, setMask] = useState<Mask | null>(null);
  const partRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(0);
  const [totalOn, setTotalOn] = useState(0);
  const [totalOff, setTotalOff] = useState(0);
  const [includePadding, setIncludPadding] = useState(true);
  const [partsList, setPartsList] = useState<PartsList>({});
  const [partArea, setPartArea] = useState([,])
  const [partCount, setPartCount] = useState(0);

  useEffect(() => {
    const qr = generate(text, {
      minCorrectionLevel: ecc,
      maxCorrectionLevel: ecc,
      mask,
      modes: [mode.ascii]
    });
    let size = qr.size;
    let offset = includePadding ? 1 : 0;
    let paddedSize = size + (includePadding ? 2 : 0);
    const partsArea = Array.from({ length: paddedSize }, () => Array.from({ length: paddedSize }, () => -1));
    let on = 0;
    let off = includePadding ? (size * 4) + 4 : 0;
    setSize(size);
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (qr.get(x, y)) {
          on++;
          partsArea[x + offset][y + offset] = -2
        } else { off++; }
      }
    }
    setTotalOn(on);
    setTotalOff(off);

    let parts: PartsList = {};
    let partCount = 0;
    let ctx: CanvasRenderingContext2D | null = null;
    let cellWidth = 1;
    let cellHeight = 1;

    if (partRef.current) {
      ctx = partRef.current.getContext('2d');
      if (ctx) {
        const { width, height } = partRef.current;
        ctx.reset();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = 2;
        cellWidth = width / paddedSize;
        cellHeight = height / paddedSize;
      }
    }
    //v1 Part Count: 378
    //v2 Part Count: 334
    for (let i = 0; i < PARTS.length; i++) {
      const part = PARTS[i];
      const { name } = part;
      for (let x = 0; x < paddedSize; x++) {
        for (let y = 0; y < paddedSize; y++) {
          // const cell = partsArea[x][y];
          // if (cell >= 0) continue;
          let fit = canFit(x, y, part, partsArea);
          if (fit === false) continue;

          const studs = rotateStuds(part.studs, fit);
          let cell;
          for (let w = 0; w < studs.length; w++) {
            for (let h = 0; h < studs[0].length; h++) {
              if (studs[w][h]) {
                if (cell === undefined) {
                  cell = partsArea[x + w][y + h];
                }
                partsArea[x + w][y + h] = i;
              }
            }
          }

          partCount++;
          let fullName = `${cell === -1 ? 'White' : 'Black'} ${name}`;
          if (fullName in parts) {
            parts[fullName]++;
          } else {
            parts[fullName] = 1;
          }

          if (ctx) {
            if (cell === -1) {
              ctx.fillStyle = 'white';
              ctx.strokeStyle = 'gray';
            } else {
              ctx.fillStyle = 'black';
              ctx.strokeStyle = 'gray';
            }
            for (let w = 0; w < studs.length; w++) {
              for (let h = 0; h < studs[0].length; h++) {
                if (studs[w][h]) {
                  drawCell(ctx, x, y, w, h, studs, cellWidth, cellHeight);
                }
              }
            }
          }
        }
      }
    }

    setPartArea(partArea);
    setPartsList(parts);
    setPartCount(partCount);

  }, [text, ecc, mask, partRef.current, includePadding]);

  const rotateStuds = (studs: boolean[][], angle: 0 | 90 | 180 | 270): boolean[][] => {
    switch (angle) {
      case 0:
        return studs;
      case 90:
        return rot90(studs);
      case 180:
        return rot90(rot90(studs));
      case 270:
        return rot90(rot90(rot90(studs)));
    }
  }
  const rot90 = (studs: boolean[][]): boolean[][] => {
    const rows = studs.length;
    const cols = studs[0].length;
    const rot: boolean[][] = Array.from({ length: cols }, () => Array(rows));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rot[c][rows - 1 - r] = studs[r][c];
      }
    }
    return rot;
  }

  const canFit = (x: number, y: number, part: Part, partsArea: number[][]): false | ANGLES => {
    let size = partsArea.length;
    for (let a = 0; a < part.angles.length; a++) {
      const angle = part.angles[a];
      const studs = rotateStuds(part.studs, angle);
      const width = studs.length;
      const height = studs[0].length;
      if (x + width > size || y + height > size) continue;
      let fits = true;
      let color: number | undefined = undefined;
      for (let sw = 0; sw < studs.length; sw++) {
        for (let sh = 0; sh < studs[0].length; sh++) {
          if (!studs[sw][sh]) continue;
          if (partsArea.length <= x + sw || partsArea[x + sw].length <= y + sh) {
            fits = false;
            break;
          };
          const area = partsArea[x + sw][y + sh];
          if (color === undefined) {
            color = area;
            if (color >= 0) fits = false;
          } else if (area !== color) {
            fits = false;
          }
          if (!fits) break;
        }
        if (!fits) break;
      }
      if (fits) return angle;
    }
    return false;
  }

  const onChangeText: ChangeEventHandler<HTMLInputElement> = (event) => {
    setText(event.currentTarget.value);
  }
  const onEccChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { currentTarget: { value } } = event;
    switch (value) {
      case "L":
        setEcc(correction.L);
        return;
      case "M":
        setEcc(correction.M);
        return;
      case "Q":
        setEcc(correction.Q);
        return;
      case "H":
        setEcc(correction.H);
        return;
    }
  }

  const onChangePadding: ChangeEventHandler<HTMLInputElement> = () => {
    setIncludPadding(!includePadding);
  }

  const onChangeMask: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.currentTarget.value === "-1") {
      setMask(null);
      return;
    }
    setMask(parseInt(event.currentTarget.value, 10) as Mask);
  }
  const showParts = () => Object.entries(partsList)
    .sort((a, b) => a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0)
    .map(([name, count], i) =>
      <div key={i} className="part-cell"><div className="part-name">{name}</div><div className="part-count">{count}</div></div>)


  return (
    <>
      URL: <input type="text" value={text} onChange={onChangeText}></input>
      <p>
        <label>
          <input type="checkbox" checked={includePadding} onChange={onChangePadding} />Include Padding
        </label>
      </p>
      <p>
        Error Correction:
        <label><input type="radio" value="L" radioGroup="ecc" checked={ecc === correction.L} onChange={onEccChange} />Low (7%)</label>
        <label><input type="radio" value="M" radioGroup="ecc" checked={ecc === correction.M} onChange={onEccChange} />Medium (15%)</label>
        <label><input type="radio" value="Q" radioGroup="ecc" checked={ecc === correction.Q} onChange={onEccChange} />Quartile (25%)</label>
        <label><input type="radio" value="H" radioGroup="ecc" checked={ecc === correction.H} onChange={onEccChange} />High (30%)</label>
      </p>
      <p>
        Mask: <input type="number" value={mask === null ? -1 : mask} min={-1} max={7} onChange={onChangeMask} />
      </p>
      <p>
        Size: {includePadding ? size + 2 : size}x{includePadding ? size + 2 : size} studs
      </p>
      <p>
        Area: {includePadding ? ((size + 2) * (size + 2)) : size * size} studs
      </p>
      <p>
        White: {totalOff}
      </p>
      <p>
        Black: {totalOn}
      </p>
      <p>
        Part Count: {partCount}
      </p>
      <div className="parts">{showParts()}</div>
      {/* <div style={{ height: "auto", margin: "0 auto", maxWidth: 512, width: "100%", padding: "16px" }}>
        <canvas ref={ref} width={512} height={512} style={{ height: 'auto', maxWidth: '100%', width: '100%', imageRendering: 'pixelated', backgroundColor: 'white' }} />
      </div> */}
      <div style={{ height: "auto", margin: "0 auto", maxWidth: 512, width: "100%", padding: "16px" }}>
        <canvas ref={partRef} width={512} height={512} style={{ height: 'auto', maxWidth: '100%', width: '100%', imageRendering: 'pixelated', backgroundColor: 'white' }} />
      </div>
    </>
  )
}

export default App

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, studs: boolean[][], cellWidth: number, cellHeight: number) {
  ctx.fillRect((x + w) * cellWidth, (y + h) * cellHeight, cellWidth, cellHeight);
  // top line
  if (h === 0 || studs[w][h - 1] === false) {
    ctx.moveTo((x + w) * cellWidth, (y + h) * cellHeight);
    ctx.lineTo((x + w + 1) * cellWidth, (y + h) * cellHeight);
    ctx.stroke();
  }
  // left line
  if (w === 0 || studs[w - 1][h] === false) {
    ctx.moveTo((x + w) * cellWidth, (y + h) * cellHeight);
    ctx.lineTo((x + w) * cellWidth, (y + h + 1) * cellHeight);
    ctx.stroke();
  }
  // bottom line
  if (h === studs[0].length - 1 || studs[w][h + 1] === false) {
    ctx.moveTo((x + w) * cellWidth, (y + h + 1) * cellHeight);
    ctx.lineTo((x + w + 1) * cellWidth, (y + h + 1) * cellHeight);
    ctx.stroke();
  }
  // right line
  if (w === studs.length - 1 || studs[w + 1][h] === false) {
    ctx.moveTo((x + w + 1) * cellWidth, (y + h) * cellHeight);
    ctx.lineTo((x + w + 1) * cellWidth, (y + h + 1) * cellHeight);
    ctx.stroke();
  }
  //   let contour = getContour(studs);
  // ctx.beginPath();
  // ctx.moveTo((x + contour[0].x) * cellWidth, (y + contour[0].y) * cellHeight);
  // for (let i = 1; i < contour.length; i++) {
  //   ctx.lineTo((x + contour[i].x) * cellWidth, (y + contour[i].y) * cellHeight);
  // }
  // ctx.lineTo((x + contour[0].x) * cellWidth, (y + contour[0].y) * cellHeight);
  // ctx.closePath();
  // ctx.fill();
  // ctx.stroke();

}

