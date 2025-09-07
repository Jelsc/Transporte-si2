import  Navbar  from "@/components/Navbar";
import { Hero } from "./components/Hero";
import { Servicios } from "./components/Servicios";
import { Choferes } from "./components/Choferes";
import { Footer } from "../../components/Footer";

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
