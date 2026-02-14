import VideoPlayer from "./VideoPlayer";

const Home = () => {
  const videoUrl = "/Main/Home/master.m3u8";

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0d2637]">
      <VideoPlayer
        videoUrl={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        showMuteButton={false}
      />

      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="relative z-1 text-center text-[#F5E6D3]">
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
