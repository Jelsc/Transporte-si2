import { Hero } from "./components/Hero";
import { Servicios } from "./components/Servicios";
import { Choferes } from "./components/Choferes";
import { EncomiendasSection } from "./components/EncomiendasSection";

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <Servicios />
      <Choferes />
       <EncomiendasSection />
    </div>
  );
};

export default HomePage;
