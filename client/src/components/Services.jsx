import servicesData from "../data/servicesData";
import VideoPlayer from "./VideoPlayer";

const Services = ({ setLoading }) => {
  const videoUrl =
    "https://s3.me-central-1.amazonaws.com/attractivehome.ae/Service-Videos/Services.m3u8";

  return (
    <section className="bg-[#1f1f1f]">
      <VideoPlayer
        videoUrl={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        setLoading={setLoading}
      />

      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      <div className="max-w-7xl mx-auto sm:px-8 lg:px-10 2xl:px-0">
        <div className="flex flex-col min-h-screen">
          <div className="relative z-1 [@media(max-width:400px)]:mb-14 mb-32 sm:mb-16 grid grid-cols-1 mt-auto">
            <h2
              className="[@media(max-width:400px)]:text-[2.5rem] text-[2.8rem] 2xl:text-[3.2rem] sm:text-5xl font-bold text-white px-8 sm:px-6 lg:px-12 2xl:px-0 tracking-[3px] uppercase"
              style={{ lineHeight: "1.5" }}
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
                <VideoPlayer
                  className="w-full h-48 object-cover"
                  videoUrl={service.video}
                  autoPlay={false}
                  showMuteButton={false}
                  enableHoverPlay={true}
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
