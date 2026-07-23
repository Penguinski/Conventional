import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/source-serif-4/latin-700.css";
import "@fontsource/lisu-bosa/latin-400.css";
import "@fontsource/dm-mono/latin-400.css";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
