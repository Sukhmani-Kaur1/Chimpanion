import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import ExampleAndTrust from "@/components/ExampleAndTrust";
import Team from "@/components/Team";
import Faq from "@/components/Faq";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Services />
        <ExampleAndTrust />
        <Team />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
