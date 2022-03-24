import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import AssetPage from "./pages/AssetPage";
import Navbar from "./components/navbar/Navbar";
import Liquidation from "./pages/Liquidation";
import { ApolloProvider } from "@apollo/client";
import { client } from "./utils/apollo_client.js";

function App() {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        {/* <Navbar /> */}
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/assets/:id" element={<AssetPage />} />
          <Route path="/liquidation" element={<Liquidation />} />
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
