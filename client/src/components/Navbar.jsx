import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "text-[#E6C9A8]" : "text-[#F5E6D3]";
  };

  return (
    <nav
      className="fixed top-0 w-full flex justify-between items-center px-4 sm:px-6 lg:px-10 py-5 z-20 text-[#F5E6D3]
      transition-all duration-300 bg-transparent border-0 shadow-none"
      style={{ backdropFilter: "blur(6px)", boxShadow: "none" }}
    >
      <Link to="/" className="flex items-center">
        <img src="/Logo.webp" alt="Logo" className="h-20 w-auto" />
      </Link>

      {/* Desktop Link */}
      <div className="hidden md:flex space-x-14 text-[#F5E6D3]">
        <Link
          to="/about"
          className={`hover:text-gray-300 ${isActive("/about")}`}
        >
          ABOUT
        </Link>
        <Link
          to="/portfolio"
          className={`hover:text-gray-300 ${isActive("/portfolio")}`}
        >
          PORTFOLIO
        </Link>
        <Link
          to="/contacts"
          className={`hover:text-gray-300 ${isActive("/contacts")}`}
        >
          CONTACTS
        </Link>
        <Link
          to="/services"
          className={`hover:text-gray-300 ${isActive("/services")}`}
        >
          SERVICES
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-[#F5E6D3] focus:outline-none"
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
        <div className="absolute top-full left-0 w-full bg-[#0d2637] bg-opacity-90 flex flex-col items-center space-y-5 py-5 md:hidden">
          <Link
            to="/about"
            className={`hover:text-gray-300 ${isActive("/about")}`}
            onClick={() => setMenuOpen(false)}
          >
            ABOUT
          </Link>
          <Link
            to="/portfolio"
            className={`hover:text-gray-300 ${isActive("/portfolio")}`}
            onClick={() => setMenuOpen(false)}
          >
            PORTFOLIO
          </Link>
          <Link
            to="/contacts"
            className={`hover:text-gray-300 ${isActive("/contacts")}`}
            onClick={() => setMenuOpen(false)}
          >
            CONTACTS
          </Link>
          <Link
            to="/services"
            className={`hover:text-gray-300 ${isActive("/services")}`}
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
