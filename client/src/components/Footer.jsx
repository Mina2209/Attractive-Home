import { useState, useEffect } from "react";
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
import VideoPlayer from "./VideoPlayer";

const Footer = () => {
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path ? "text-gray-300" : "text-white";
  };

  const isContactPage = location.pathname === "/contacts";

  const videoUrl = "/Main/Contacts/master.m3u8";

  // 1. Define your icon data array.
  // Each object contains the URL (href) and the FontAwesome icon.
  const icons = [
    { href: "https://wa.me/971544666066", icon: faWhatsapp },
    { href: "https://www.instagram.com/attractive_home", icon: faInstagram },
    { href: "https://pin.it/4dHNZjnCY", icon: faPinterest },
    {
      href: "https://www.facebook.com/attractive.home.interiors",
      icon: faFacebook,
    },
    { href: "https://www.tiktok.com/@attractivehome", icon: faTiktok },
    {
      href: "https://www.linkedin.com/company/attractive-home-interior-studio/",
      icon: faLinkedin,
    },
  ];

  // 2. Detect the window width and update it on resize.
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. Conditionally render icons based on window width:
  //    - For window widths between 350px and 408px OR between 1024px and 1280px:
  //         Render icons in two rows: the first row shows 4 icons and the second row shows 2 icons.
  //    - For all other window widths:
  //         Render icons using the default flexible (wrap) layout (Mina's orignal code for displaying icons).
  let iconContent;
  if (
    (windowWidth >= 350 && windowWidth < 408) ||
    (windowWidth >= 1024 && windowWidth <= 1280)
  ) {
    iconContent = (
      <div>
        {/* First row: 4 icons */}
        <div className="flex justify-start gap-6 mb-4">
          {icons.slice(0, 4).map((item, index) => (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                <FontAwesomeIcon
                  icon={item.icon}
                  size="lg"
                  className="text-black"
                />
              </div>
            </a>
          ))}
        </div>
        {/* Second row: 2 icons */}
        <div className="flex justify-start gap-6">
          {icons.slice(4).map((item, index) => (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
                <FontAwesomeIcon
                  icon={item.icon}
                  size="lg"
                  className="text-black"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  } else {
    // For all other window widths (e.g., very small screens below 350px,
    // between 408px and 1024px, or above 1280px), use a flexible (wrap) layout.
    iconContent = (
      <div className="flex justify-start gap-6 flex-wrap">
        {icons.map((item, index) => (
          <a
            key={index}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-8 h-8 rounded-full bg-white flex justify-center items-center shadow-md transition-transform duration-200 transform hover:scale-110">
              <FontAwesomeIcon
                icon={item.icon}
                size="lg"
                className="text-black"
              />
            </div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <footer className="relative text-white py-32 overflow-hidden bg-[#181818]">
      {isContactPage && (
        <VideoPlayer
          videoUrl={videoUrl}
          className="absolute top-0 left-0 w-full h-full object-cover"
          showMuteButton={false}
        ></VideoPlayer>
      )}
      <div className="container mx-auto px-12 relative z-[0]">
        <div className="grid grid-cols-1 space-y-6 gap-8 2xl:gap-32 sm:grid-cols-3 sm:space-y-0">
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
                  className={`hover:text-gray-300 ${isActive("/portfolio")}`}
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  to="/portfolio/architectural"
                  className={`hover:text-gray-300 ${isActive(
                    "/portfolio/architectural"
                  )}`}
                >
                  Architectural Design
                </Link>
              </li>
              <li>
                <Link
                  to="/portfolio/interior"
                  className={`hover:text-gray-300 ${isActive(
                    "/portfolio/interior"
                  )}`}
                >
                  Interior Design
                </Link>
              </li>
              <li>
                <Link
                  to="/portfolio/fit"
                  className={`hover:text-gray-300 ${isActive(
                    "/portfolio/fit"
                  )}`}
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
                href="https://wa.me/201202640992"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-yellow-100 hover:text-yellow-50 transition-colors duration-200"
              >
                Mina&nbsp;Nassef
              </a>
            </p>
            {iconContent}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
