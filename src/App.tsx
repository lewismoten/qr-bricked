import { useState, type ChangeEventHandler } from 'react'
import './App.css'
import QRCode from "react-qr-code";

function App() {
  const [inputText, setInputText] = useState("https://frontroyallug.wordpress.com");
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("L");
  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setInputText(event.currentTarget.value);
  }
  const onEccChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { currentTarget: { value } } = event;
    switch (value) {
      case "L":
      case "M":
      case "Q":
      case "H":
        setEcc(value);
    }

  }

  return (
    <>
      URL: <input type="text" value={inputText} onChange={onChange}></input>
      <p>
        Error Correction:
        <label><input type="radio" value="L" radioGroup="ecc" checked={ecc === "L"} onChange={onEccChange} />Low (7%)</label>
        <label><input type="radio" value="M" radioGroup="ecc" checked={ecc === "M"} onChange={onEccChange} />Medium (15%)</label>
        <label><input type="radio" value="Q" radioGroup="ecc" checked={ecc === "Q"} onChange={onEccChange} />Quartile (25%)</label>
        <label><input type="radio" value="H" radioGroup="ecc" checked={ecc === "H"} onChange={onEccChange} />High (30%)</label>
      </p>
      <div style={{ height: "auto", margin: "0 auto", maxWidth: 512, width: "100%", backgroundColor: "white", padding: "16px" }}>
        <QRCode
          size={512}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          value={inputText}
          viewBox={`0 0 256 256`}
          level={ecc}
        />
      </div>
    </>
  )
}

export default App
