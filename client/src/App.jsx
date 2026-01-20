import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import Footer from "./components/Footer";
import ScrollToTop from "./utils/ScrollToTop";

import Home from "./components/Home";
import About from "./components/About";
import Portfolio from "./components/Portfolio";
import ProjectDetails from "./components/ProjectDetails";
import Contacts from "./components/Contacts";
import Services from "./components/Services";
import NotFound from "./components/NotFound";
import AluminumSkirting from "./components/AluminumSkirting";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:categoryId" element={<Portfolio />} />
        <Route
          path="/portfolio/:categoryId/:projectId"
          element={<ProjectDetails />}
        />
        <Route path="/portfolio/aluminum-skirting" element={<AluminumSkirting />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/services" element={<Services />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <WhatsAppButton />
      <Footer />
    </Router>
  );
}

export default App;
