import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { Benefits } from "./sections/Benefits";
import { EditorSection } from "./sections/EditorSection";
import { Download } from "./sections/Download";
import { Docs } from "./sections/Docs";

export function App() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <HowItWorks />
        <Benefits />
        <EditorSection />
        <Download />
        <Docs />
      </main>
      <Footer />
    </>
  );
}
