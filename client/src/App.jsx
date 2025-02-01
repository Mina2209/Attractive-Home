import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
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

const RouteHandler = ({ setLoading }) => {
  const location = useLocation();
  useEffect(() => {
    setLoading(true);
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Home setLoading={setLoading} />} />
      <Route path="/about" element={<About setLoading={setLoading} />} />
      <Route path="/portfolio" element={<Portfolio setLoading={setLoading}/>} />
      <Route
        path="/portfolio/:categoryId/:projectId"
        element={<ProjectDetails setLoading={setLoading} />}
      />
      <Route path="/contacts" element={<Contacts/>} />
      <Route path="/services" element={<Services setLoading={setLoading} />} />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      {loading && <Loader />}
      <div style={{ display: loading ? "none" : "block" }}>
        <Navbar />
        <RouteHandler setLoading={setLoading} />
        <WhatsAppButton />
        <Footer setLoading={setLoading} />
      </div>
    </Router>
  );
}

export default App;
