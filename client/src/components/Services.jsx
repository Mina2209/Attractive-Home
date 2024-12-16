import React, { useState } from "react";
import servicesData from "../data/servicesData";

const Services = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <section className="bg-[#1f1f1f]">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="services.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="max-w-7xl mx-auto sm:px-8 lg:px-10">
        <div className="flex flex-col min-h-screen">
          <div className="relative z-1 mb-16 grid grid-cols-1 mt-auto">
            <h2
              className="text-[2.8rem] sm:text-5xl font-bold text-white px-8 sm:px-6 lg:px-14 uppercase"
              style={{ lineHeight: "1.2", letterSpacing: "3px" }}
            >
              We provide a wide range of professional services tailored to your
              needs
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 py-16">
          {servicesData.map((service, index) => (
            <div
              key={index}
              className="bg-[#2b2b2b] rounded-lg shadow-lg overflow-hidden transition-transform duration-1000 hover:scale-105"
            >
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-48 object-cover"
                />
              ) : service.video ? (
                <video
                  className="w-full h-48 object-cover"
                  src={service.video}
                  loop
                  muted
                  playsInline
                  onMouseEnter={(e) => {
                    setIsPlaying(true);
                    e.target.play();
                  }}
                  onMouseLeave={(e) => {
                    setIsPlaying(false);
                    e.target.pause();
                    e.target.currentTime = 0;
                  }}
                />
              ) : null}
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-white">
                  {service.title}
                </h2>
                <p className="text-gray-400">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
