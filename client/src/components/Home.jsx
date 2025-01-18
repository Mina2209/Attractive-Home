import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

const Home = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const videoUrl =
      "https://s3.me-central-1.amazonaws.com/attractivehome.ae/Portfolio-videos/Portfolio.m3u8";

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Fallback for Safari
      video.src = videoUrl;
    }
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="relative z-1 text-center text-white">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ letterSpacing: "0.72px" }}
        >
          Attractive Home
        </h1>
        {/* <p className="text-lg">DESIGN | ART | ARCHITECTURE</p> */}
        <p
          className="text-lg"
          style={{ transform: "scale(1.2)", letterSpacing: "0.4px" }}
        >
          Interior Design and Fit-Out
        </p>
      </div>
    </section>
  );
};

export default Home;
