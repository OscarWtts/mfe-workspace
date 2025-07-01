import React, { useEffect, useState, Suspense } from "react";

const SafeRemoteConsoleApp = () => {
  const [RemoteApp, setRemoteApp] = useState<React.ComponentType | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadRemote = async () => {
      try {
        const module = await import("mfe_console/ConsoleApp");
        setRemoteApp(() => module.default);
      } catch (err) {
        console.error("Error loading mfe_console:", err);
        setHasError(true);
      }
    };

    loadRemote();
  }, []);

  if (hasError) {
    return <div style={{ color: "red" }}>⚠️ Unable to load Console MFE</div>;
  }

  if (!RemoteApp) {
    return <div>Loading Console MFE...</div>;
  }

  return <RemoteApp />;
};

function App() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>MFE Host</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SafeRemoteConsoleApp />
      </Suspense>
    </div>
  );
}

export default App;
