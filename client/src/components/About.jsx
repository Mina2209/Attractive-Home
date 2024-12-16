import React from "react";

const About = () => {
  return (
    <section
      className="py-16 px-6 md:px-12 bg-[#1f1f1f] text-white h-screen flex items-end"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-12">
        <div className="flex-shrink-0">
          <img
            src="room2.png"
            alt="About Us"
            className="rounded-lg shadow-lg w-full h-64 object-cover md:h-full md:w-80"
          />
        </div>

        <div className="text-center md:text-left space-y-4">
          <h2
            className="text-3xl font-bold text-white"
            style={{ letterSpacing: "0.02em" }}
          >
            About Us
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ letterSpacing: "0.03em" }}
          >
            As a high-quality company with a keen eye for detail and a passion
            for design,{" "}
            <span style={{ color: "#EDDBB3", fontStyle: "italic" }}>
              <strong>Attractive Home</strong>
            </span>
            , brings creative interior solutions that combine elegance,
            functionality, and artistry. We transform spaces into personalized
            expressions of style and comfort, guided by a deep understanding of
            spatial harmony.
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ letterSpacing: "0.03em" }}
          >
            Our team collaborates closely with clients to ensure every design
            reflects their unique vision and needs. Whether it's a sleek, modern
            apartment or a charming, classic home, we are dedicated to
            delivering stunning spaces that elevate everyday life.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
