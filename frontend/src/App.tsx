import { useState } from "react";

import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Welcome to farmly, click to join our clickers</h1>
      <button onClick={() => setCount((count) => count + 1)}>
        Number of clicks are {count}
      </button>
    </div>
  );
}

export default App;
