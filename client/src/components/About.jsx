import VideoPlayer from "./VideoPlayer";
import ProjectsMapSection from "./ProjectsMapSection";

const About = () => {
  const videoUrl = "/Main/About/master.m3u8";

  const pillars = [
    { label: "Elegance", key: "elegance" },
    { label: "Functionality", key: "functionality" },
    { label: "Artistry", key: "artistry" },
  ];

  return (
    <>
      <section className="text-[#F5E6D3] relative bg-[#0d2637] min-h-screen overflow-hidden">
        <VideoPlayer
          videoUrl={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 md:px-16 pt-24 sm:pt-32 pb-20 min-h-screen flex flex-col justify-end">
          <div className="space-y-8 sm:space-y-10">
            <div>
              <span
                className="inline-block text-[#EDDBB3] text-sm font-medium tracking-[0.2em] uppercase mb-4"
                style={{ letterSpacing: "0.2em" }}
              >
                Who We Are
              </span>
              <h2
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#F5E6D3] tracking-tight"
                style={{ letterSpacing: "0.02em" }}
              >
                About Us
              </h2>
              <div
                className="mt-4 w-16 h-0.5 rounded-full bg-[#EDDBB3]/80"
                aria-hidden="true"
              />
            </div>

            <p
              className="text-lg sm:text-xl md:text-2xl leading-relaxed text-[#F5E6D3]/95 max-w-2xl"
              style={{ letterSpacing: "0.03em" }}
            >
              <span className="text-[#EDDBB3] font-semibold italic">Attractive Home</span>{" "}
              brings creative interior solutions that combine elegance, functionality, and artistry. We transform spaces into personalized expressions of style and comfort.
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-2 pt-2 border-t border-[#F5E6D3]/20">
              {pillars.map(({ label, key }) => (
                <span
                  key={key}
                  className="text-[#EDDBB3]/90 text-sm sm:text-base font-medium tracking-wide"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProjectsMapSection
        title="Over 50 Projects Across Dubai"
        subtitle="Explore our portfolio on the map from architectural and interior design to fit-out. Click a marker to view the project."
      />
    </>
  );
};

export default About;
