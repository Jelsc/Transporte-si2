import reactLogo from "@/assets/react.svg";
import viteLogo from "/vite.svg";
import "./index.css";

export default function App() {
  return (
    <div className="min-h-screen grid place-items-center gap-6">
      <div className="flex items-center gap-6">
        <img src={viteLogo} alt="Vite" className="h-12" />
        <img src={reactLogo} alt="React" className="h-12" />
      </div>
      <h1 className="text-3xl font-bold text-blue-600">transporte-si2 — Frontend OK 🚀</h1>
    </div>
  );
}