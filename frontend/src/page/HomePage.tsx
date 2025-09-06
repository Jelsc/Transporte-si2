
// src/pages/home/HomePage.tsx
import  Navbar  from "@/components/common/Navbar";
import { Hero } from "./Hero";
import { Servicios } from "./Servicios";
import { Choferes } from "./Choferes";
import { Footer } from "../components/common/Footer";

const HomePage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Servicios />
      <Choferes />
      <Footer />
    </div>
  );
};

export default HomePage;
