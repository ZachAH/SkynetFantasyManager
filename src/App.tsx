import { useState } from "react";
import { LayoutDashboard, Radio, Terminal as TerminalIcon } from "lucide-react";
import { HudHeader } from "./components/Layout/HudHeader";
import { TabNav, type TabDef } from "./components/Layout/TabNav";
import { WarRoomDashboard } from "./components/Dashboard/WarRoomDashboard";
import { IntelDashboard } from "./components/Intel/IntelDashboard";
import { SkynetConsole } from "./components/Console/SkynetConsole";

const TABS: TabDef[] = [
  { id: "war-room", label: "War Room", icon: LayoutDashboard },
  { id: "intel", label: "Market Intel", icon: Radio },
  { id: "console", label: "Skynet Console", icon: TerminalIcon },
];

function App() {
  const [activeTab, setActiveTab] = useState("war-room");

  return (
    <div className="min-h-screen bg-void">
      <HudHeader />
      <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === "war-room" && <WarRoomDashboard />}
        {activeTab === "intel" && <IntelDashboard />}
        {activeTab === "console" && <SkynetConsole />}
      </main>
      <footer className="mx-auto max-w-7xl px-4 py-6 font-mono text-[10px] tracking-widest text-text-faint sm:px-6">
        SKYNET FANTASY GM // DATA SOURCE: SLEEPER API (READ-ONLY) // NO FATE BUT WHAT WE DRAFT
      </footer>
    </div>
  );
}

export default App;
