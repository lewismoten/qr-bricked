import { useEffect, useRef, useState, type ChangeEventHandler } from 'react'
import './App.css'
import { correction, generate, mode, type Correction, type Mask } from 'lean-qr';

function App() {
  const [text, setText] = useState("https://frontroyallug.wordpress.com");
  const [ecc, setEcc] = useState<Correction>(correction.L);
  const [mask, setMask] = useState<Mask | null>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(0);
  const [totalOn, setTotalOn] = useState(0);
  const [totalOff, setTotalOff] = useState(0);
  const [includePadding, setIncludPadding] = useState(true);

  useEffect(() => {
    const qr = generate(text, {
      minCorrectionLevel: ecc,
      maxCorrectionLevel: ecc,
      mask,
      modes: [mode.ascii]
    });
    let size = qr.size;
    let on = 0;
    let off = includePadding ? (size * 4) + 4 : 0;
    setSize(size);
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (qr.get(x, y)) {
          on++;
        } else { off++; }
      }
    }
    setTotalOn(on);
    setTotalOff(off);

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
      <div style={{ height: "auto", margin: "0 auto", maxWidth: 512, width: "100%", padding: "16px" }}>
        <canvas ref={ref} width={512} height={512} style={{ height: 'auto', maxWidth: '100%', width: '100%', imageRendering: 'pixelated', backgroundColor: 'white' }} />
      </div>
    </>
  )
}

export default App
