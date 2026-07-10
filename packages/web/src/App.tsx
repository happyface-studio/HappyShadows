import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Hero } from "./sections/Hero";

export function App() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
      </main>
      <Footer />
    </>
  );
}
