import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import WhatsAppButton from "./components/WhatsAppButton";
import About from "./components/About";
import Portfolio from "./components/Portfolio";
import Loader from "./components/Loader";
import Contacts from "./components/Contacts";
import Footer from "./components/Footer";
import Services from "./components/Services";
import ProjectDetails from "./components/ProjectDetails";

function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setLoading(false);
    }, 200);

    return () => clearTimeout(loadTimeout);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/About" element={<About />} />
        <Route path="/Portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:categoryId/:projectId" element={<ProjectDetails />} />
        <Route path="/Contacts" element={<Contacts />} />
        <Route path="/Services" element={<Services />} />
      </Routes>
      <WhatsAppButton />
      <Footer />
    </Router>
  );
}

export default App;
