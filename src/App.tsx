import { useEffect, useState } from "react";
import { ComponentsPage } from "./pages/ComponentsPage";
import { GraphPage } from "./pages/GraphPage";

function App() {
  const [showComponents, setShowComponents] = useState(() => window.location.hash === "#components");

  useEffect(() => {
    const updateRoute = () => setShowComponents(window.location.hash === "#components");
    window.addEventListener("hashchange", updateRoute);
    window.addEventListener("popstate", updateRoute);
    return () => {
      window.removeEventListener("hashchange", updateRoute);
      window.removeEventListener("popstate", updateRoute);
    };
  }, []);

  return showComponents ? <ComponentsPage /> : <GraphPage />;
}

export default App;
