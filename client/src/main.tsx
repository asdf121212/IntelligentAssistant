import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>DoMyJob - Your AI Work Assistant</title>
      <meta name="description" content="DoMyJob is an AI assistant that learns about your tasks and responsibilities to help automate your work." />
      <meta property="og:title" content="DoMyJob - Your AI Work Assistant" />
      <meta property="og:description" content="DoMyJob is an AI assistant that learns about your tasks and responsibilities to help automate your work." />
      <meta property="og:type" content="website" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" />
    </Helmet>
    <App />
  </HelmetProvider>
);
