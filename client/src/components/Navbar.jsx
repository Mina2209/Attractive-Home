import React, { useState} from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "text-gray-300" : "text-white";
  };

  return (
    <nav
      className="fixed top-0 w-full flex justify-between items-center px-10 py-5 z-10 text-white
      transition-all duration-300 bg-transparent"
      style={{ backdropFilter: "blur(6px)" }}
    >
      <Link to="/" className="flex items-center">
        <img src="logov2.png" alt="Logo" className="h-24 w-auto" />
      </Link>

      {/* Desktop Link */}
      <div className="hidden md:flex space-x-14 text-white">
        <Link
          to="/About"
          className={`hover:text-gray-300 ${isActive("/About")}`}
        >
          ABOUT
        </Link>
        <Link
          to="/Portfolio"
          className={`hover:text-gray-300 ${isActive("/Portfolio")}`}
        >
          PORTFOLIO
        </Link>
        <Link
          to="/Contacts"
          className={`hover:text-gray-300 ${isActive("/Contacts")}`}
        >
          CONTACTS
        </Link>
        <Link
          to="/Services"
          className={`hover:text-gray-300 ${isActive("/Services")}`}
        >
          SERVICES
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white focus:outline-none"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          ></path>
        </svg>
      </button>

      {/* Mobile Links */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-gray-900 bg-opacity-90 flex flex-col items-center space-y-5 py-5 md:hidden">
          <Link
            to="/About"
            className={`hover:text-gray-300 ${isActive("/About")}`}
            onClick={() => setMenuOpen(false)}
          >
            ABOUT
          </Link>
          <Link
            to="/Portfolio"
            className={`hover:text-gray-300 ${isActive("/Portfolio")}`}
            onClick={() => setMenuOpen(false)}
          >
            PORTFOLIO
          </Link>
          <Link
            to="/Contacts"
            className={`hover:text-gray-300 ${isActive("/Contacts")}`}
            onClick={() => setMenuOpen(false)}
          >
            CONTACTS
          </Link>
          <Link
            to="/Services"
            className={`hover:text-gray-300 ${isActive("/Services")}`}
            onClick={() => setMenuOpen(false)}
          >
            SERVICES
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
