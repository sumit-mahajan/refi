import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import AssetPage from "./pages/AssetPage";
import Navbar from "./components/Navbar";
// import Navbar from "./components/navbar/Navbar";

function App() {
  return (
    <BrowserRouter>
      {/* <Navbar /> */}
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/assets/:id" element={<AssetPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
