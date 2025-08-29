import { useState, type ChangeEventHandler } from 'react'
import './App.css'

function App() {
  const [inputText, setInputText] = useState("https://frontroyallug.wordpress.com");

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setInputText(event.currentTarget.value);
  }

  return (
    <>
      URL: <input type="text" value={inputText} onChange={onChange}></input>
    </>
  )
}

export default App
