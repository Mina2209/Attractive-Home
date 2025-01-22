import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faWhatsapp,
  faPinterest,
  faFacebook,
  faTiktok,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path ? "text-gray-300" : "text-white";
  };

  const isContactPage = location.pathname === "/contacts";
  return (
    <footer
      className={`relative text-white py-32 overflow-hidden ${
        isContactPage ? "" : "bg-[#181818]"
      }`}
    >
      {isContactPage && (
        <video
          className="absolute top-0 left-0 w-full h-full object-cover z-[-1]"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="Sand-Video.mp4" type="video/mp4" />
        </video>
      )}
      <div className="container mx-auto px-12 sm:px-0 relative">
        <div className="grid grid-cols-1 space-y-6 gap-8 2xl:gap-64 sm:grid-cols-3 sm:space-y-0">
          {/* Left Section */}
          <div>
            <ul className="font-semibold space-y-12 uppercase">
              <li>
                <Link
                  to="/about"
                  className={`hover:text-gray-300 ${isActive("/about")}`}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contacts"
                  className={`hover:text-gray-300 ${isActive("/contacts")}`}
                >
                  Contacts
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className={`hover:text-gray-300 ${isActive("/services")}`}
                >
                  Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Middle Section */}
          <div>
            <ul className="font-semibold space-y-12 uppercase">
            <li>
                <Link
                  to="/portfolio"
                  className={`hover:text-gray-300 ${isActive('/portfolio')}`}
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  to="/portfolio"
                  className="hover:text-gray-300"
                >
                  Architectural Design
                </Link>
              </li>
              <li>
                <Link
                  to="/portfolio"
                  className="hover:text-gray-300"
                >
                  Interior Design
                </Link>
              </li>
              <li>
                <Link
                  to="/portfolio"
                  className="hover:text-gray-300"
                >
                  Fit-Out Interiors
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Section */}
          <div className="text-left">
            <h1 className="font-bold text-3xl mb-10">Attractive Home</h1>
            <p className="text-sm mb-10">
              © 2009 — 2024 Attractive Home. All Rights Reserved.
              <br />
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/mina-nassef-32203a246/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mina Nassef
              </a>
            </p>
            <div className="flex justify-start space-x-6">
              <a
                href="https://wa.me/971544666066"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className=" w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                  <FontAwesomeIcon
                    icon={faWhatsapp}
                    size="lg"
                    className="text-black"
                  />
                </div>
              </a>
              <a
                href="https://www.instagram.com/attractive_home"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                  <FontAwesomeIcon
                    icon={faInstagram}
                    size="lg"
                    className="text-black"
                  />
                </div>
              </a>
              <a
                href="https://pin.it/4dHNZjnCY"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                  <FontAwesomeIcon
                    icon={faPinterest}
                    size="lg"
                    className="text-black"
                  />
                </div>
              </a>
              <a
                href="https://www.facebook.com/attractive.home.interiors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                  <FontAwesomeIcon
                    icon={faFacebook}
                    size="lg"
                    className="text-black"
                  />
                </div>
              </a>
              <a
                href="https://www.tiktok.com/@attractivehome"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                  <FontAwesomeIcon
                    icon={faTiktok}
                    size="lg"
                    className="text-black"
                  />
                </div>
              </a>
              <a
                href="https://www.linkedin.com/company/attractive-home-interior-studio/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                  <FontAwesomeIcon
                    icon={faLinkedin}
                    size="lg"
                    className="text-black"
                  />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
