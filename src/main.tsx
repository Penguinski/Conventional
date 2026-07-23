import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/source-serif-4/700.css";
import "@fontsource/lisu-bosa/400.css";
import "@fontsource/dm-mono/400.css";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
