import { useEffect, useRef, useState, type ChangeEventHandler } from 'react'
import './App.css'
import { correction, generate, mode, type Correction, type Mask } from 'lean-qr';

type PartsList = { [key: string]: number };

const PARTS = [
  // height, width, tile, plate, brick
  [4, 4],//, '1751'],
  [2, 6],//, '69729'],
  [6, 2],
  [2, 4],//, '87079'],
  [4, 2],
  [2, 3],//, '26603'],
  [3, 2],
  [2, 2],//, '3068'],
  [1, 8],//, '4162'],
  [8, 1],
  [1, 6],//, '6636'],
  [6, 1],
  [1, 4],//, '2431'],
  [4, 1],
  [1, 3],//, '63864'],
  [3, 1],
  // corner 2x2,
  [1, 2],//, '3069'],
  [2, 1],
  [1, 1],//, '3070']
]
function App() {
  const [text, setText] = useState("https://frontroyallug.wordpress.com");
  const [ecc, setEcc] = useState<Correction>(correction.L);
  const [mask, setMask] = useState<Mask | null>(null);
  const ref = useRef<HTMLCanvasElement>(null);
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
    for (let i = 0; i < PARTS.length; i++) {
      const [width, height] = PARTS[i];
      const dimensions = width < height ? `${width}x${height}` : `${height}x${width}`;
      for (let x = 0; x < paddedSize - (width - 1); x++) {
        for (let y = 0; y < paddedSize - (height - 1); y++) {
          const cell = partsArea[x][y];
          if (cell >= 0) continue;
          let valid = true;
          for (let w = x; w < (width + x); w++) {
            for (let h = y; h < (height + y); h++) {
              if (partsArea[w][h] !== cell) {
                valid = false;
                break;
              }
            }
            if (!valid) break;
          }
          if (!valid) continue;
          partCount++;
          let fullName = `${cell === -1 ? 'White' : 'Black'} ${dimensions}`;
          if (fullName in parts) {
            parts[fullName]++;
          } else {
            parts[fullName] = 1;
          }
          for (let w = x; w < (width + x); w++) {
            for (let h = y; h < (height + y); h++) {
              partsArea[w][h] = i;
            }
          }
          if (partRef.current) {
            const c = partRef.current?.getContext('2d');
            const scale = 16;
            if (c) {
              const cellWidth = partRef.current.width / paddedSize;
              const cellHeight = partRef.current.height / paddedSize;
              if (cell === -1) {
                c.strokeStyle = 'silver';
                c.lineWidth = 1;
                c.strokeRect(x * cellWidth, y * cellHeight, (width * cellWidth) - 1, (height * cellHeight) - 1);
              } else {
                c.fillStyle = 'black';
                c.fillRect((x * cellWidth) + 1, (y * cellHeight) + 1, (width * cellWidth) - 2, (height * cellHeight) - 2);

              }
            }
          }
        }
      }
    }

    setPartArea(partArea);
    setPartsList(parts);
    setPartCount(partCount);

    if (ref.current !== null) {
      qr.toCanvas(ref.current, {
        on: [0x00, 0x00, 0x00, 0xFF], // black
        off: [0x00, 0x00, 0x00, 0x00], // transparent
        padX: includePadding ? 1 : 0,
        padY: includePadding ? 1 : 0
      });
    }

  }, [text, ecc, mask, ref.current, includePadding])

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
      <div style={{ height: "auto", margin: "0 auto", maxWidth: 512, width: "100%", padding: "16px" }}>
        <canvas ref={ref} width={512} height={512} style={{ height: 'auto', maxWidth: '100%', width: '100%', imageRendering: 'pixelated', backgroundColor: 'white' }} />
      </div>
      <div style={{ height: "auto", margin: "0 auto", maxWidth: 512, width: "100%", padding: "16px" }}>
        <canvas ref={partRef} width={512} height={512} style={{ height: 'auto', maxWidth: '100%', width: '100%', imageRendering: 'pixelated', backgroundColor: 'white' }} />
      </div>
    </>
  )
}

export default App
