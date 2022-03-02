import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar/Navbar";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
