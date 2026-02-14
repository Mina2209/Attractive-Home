import VideoPlayer from "./VideoPlayer";

const About = () => {
  const videoUrl = "/Main/About/master.m3u8";

  return (
    <section className="text-[#F5E6D3] relative bg-[#0d2637] min-h-screen">
      <VideoPlayer
        videoUrl={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="max-w-7xl mx-auto px-8 md:px-16 2xl:px-0">
        <div className="flex flex-col min-h-screen">
          <div className="relative z-1 mb-16 grid grid-cols-1 mt-auto">
            <div className="space-y-6  2xl:space-y-10">
              <h2
                className="text-4xl sm:text-5xl font-bold text-[#F5E6D3]"
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
                className="[@media(max-width:400px)]:hidden text-lg sm:text-xl leading-relaxed sm:leading-10 2xl:leading-loose"
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
