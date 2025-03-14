import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import WhatsAppButton from "./components/WhatsAppButton";
import About from "./components/About";
import Portfolio from "./components/Portfolio";
import Contacts from "./components/Contacts";
import Footer from "./components/Footer";
import Services from "./components/Services";
import ProjectDetails from "./components/ProjectDetails";

const RouteHandler = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route
        path="/portfolio/:categoryId/:projectId"
        element={<ProjectDetails />}
      />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/services" element={<Services />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <RouteHandler />
        <WhatsAppButton />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
