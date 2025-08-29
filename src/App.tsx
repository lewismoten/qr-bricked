import { useState, type ChangeEventHandler } from 'react'
import './App.css'
import QRCode from "react-qr-code";

function App() {
  const [inputText, setInputText] = useState("https://frontroyallug.wordpress.com");

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setInputText(event.currentTarget.value);
  }

  return (
    <>
      URL: <input type="text" value={inputText} onChange={onChange}></input>
      <div style={{ height: "auto", margin: "0 auto", maxWidth: 512, width: "100%" }}>
        <QRCode
          size={512}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          value={inputText}
          viewBox={`0 0 256 256`}
        />
      </div>
    </>
  )
}

export default App
