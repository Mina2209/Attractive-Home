import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

const Home = ({ setLoading }) => {
  const videoRef = useRef(null);

  // Function to detect if the browser is Safari
  const isSafari = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes("safari") && !userAgent.includes("chrome") // Exclude Chrome on iOS
    );
  };

  useEffect(() => {
    const video = videoRef.current;

    // Ensure the video ref is attached before proceeding
    if (!video) return;

    const videoUrl =
      "https://s3.me-central-1.amazonaws.com/attractivehome.ae/Portfolio-videos/Portfolio.m3u8";

    const handleVideoReady = () => {
      setLoading(false);
    };

    if (!isSafari()) {
      // Use HLS.js for non-Safari browsers
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.addEventListener("canplaythrough", handleVideoReady);
        });
      }
    } else {
      // Safari: Use the direct URL
      video.src = videoUrl;
      video.addEventListener("canplaythrough", handleVideoReady);
    }

    return () => {
      if (video) {
        video.removeEventListener("canplaythrough", handleVideoReady);
      }
    };
  }, []);

  const videoSrc = isSafari()
    ? "https://s3.me-central-1.amazonaws.com/attractivehome.ae/Portfolio-videos/Portfolio.m3u8"
    : undefined;

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        ref={videoRef}
        src={videoSrc} // Safari uses direct src, others rely on HLS.js
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-1 text-center text-white">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ letterSpacing: "0.72px" }}
        >
          Attractive Home
        </h1>
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
