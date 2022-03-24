import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { client } from "./utils/apollo_client.js";

import { useConnection } from "./utils/connection_provider/connection_provider";

import Navbar from "./components/navbar/Navbar";
import HomePage from "./pages/HomePage";
import AssetPage from "./pages/AssetPage";
import Liquidation from "./pages/Liquidation";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const { error } = useConnection();

  if (error !== "") {
    return (<div className="backdrop">
      <p className="content-size">{error}</p>
    </div>);
  }

  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        {/* <Navbar /> */}
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/assets/:id" element={<AssetPage />} />
          <Route path="/liquidation" element={<Liquidation />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
