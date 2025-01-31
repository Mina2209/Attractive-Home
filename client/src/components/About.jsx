import { useEffect, useRef } from "react";
import Hls from "hls.js";

const About = ({ setLoading }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const videoUrl =
      "https://s3.me-central-1.amazonaws.com/attractivehome.ae/About-Videos/About.m3u8";
    // const videoUrl = "Portfolio-Video/output.m3u8";

    const handleVideoReady = () => {
      setLoading(false);
    };

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.addEventListener("canplaythrough", handleVideoReady);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.addEventListener("canplaythrough", handleVideoReady);
    }

    return () => {
      video.removeEventListener("canplaythrough", handleVideoReady);
    };
  }, []);
  return (
    <section className="text-white relative">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        ref={videoRef}
        autoPlay
        loop
        playsInline
      />
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="max-w-7xl mx-auto px-8 md:px-16 2xl:px-0">
        <div className="flex flex-col min-h-screen">
          <div className="relative z-1 mb-16 grid grid-cols-1 mt-auto">
            <div className="space-y-6  2xl:space-y-10">
              <h2
                className="text-4xl sm:text-5xl font-bold"
                style={{ letterSpacing: "0.02em" }}
              >
                About Us
              </h2>
              <p
                className="text-xl sm:text-2xl leading-relaxed sm:leading-10 2xl:leading-loose"
                style={{ letterSpacing: "0.03em" }}
              >
                As a high-quality company with a keen eye for detail and a
                passion for design,{" "}
                <span style={{ color: "#EDDBB3", fontStyle: "italic" }}>
                  <strong>Attractive Home</strong>
                </span>
                , brings creative interior solutions that combine elegance,
                functionality, and artistry. We transform spaces into
                personalized expressions of style and comfort, guided by a deep
                understanding of spatial harmony.
              </p>
              <p
                className="text-lg sm:text-xl leading-relaxed sm:leading-10 2xl:leading-loose"
                style={{ letterSpacing: "0.03em" }}
              >
                Our team collaborates closely with clients to ensure every
                design reflects their unique vision and needs. Whether it's a
                sleek, modern apartment or a charming, classic home, we are
                dedicated to delivering stunning spaces that elevate everyday
                life.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
