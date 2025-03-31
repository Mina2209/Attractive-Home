const AluminumSkirting = () => {
  return (
    <section>
      <div
        className="relative flex flex-col lg:justify-end min-h-screen bg-cover bg-fixed bg-center text-white lg:px-32 max-lg:text-center max-lg:items-center"
        style={{
          backgroundImage: "url('Aluminum-Skirting/Background.avif')",
        }}
      >
        <div className="lg:hidden" style={{ paddingTop: "21vh" }}></div>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        <div className="relative z-10 max-w-4xl">
          <h1
            className="text-6xl max-sm:text-4xl font-bold tracking-[1.6px] max-sm:max-w-xs mx-auto lg:mx-0"
            style={{ lineHeight: "1.5" }}
          >
            Transformative Aluminum Skirting Profiles
          </h1>
          <div className="lg:hidden" style={{ paddingBottom: "24vh" }}></div>
          <p
            className="mt-3 text-md sm:text-xl tracking-[0.7px] md:max-w-2xl lg:max-w-2xl max-sm:px-8 mx-auto lg:mx-0"
            style={{ lineHeight: "1.4" }}
          >
            Elevate your space with sleek, modern aluminum profiles that blend
            functionality and style.
          </p>
          <a
            href="https://s3.me-central-1.amazonaws.com/attractivehome.ae/Aluminum-Skirting/ATT-001-Guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 mb-20 inline-block px-14 py-4 text-lg font-medium text-gray-900 bg-white rounded-full hover:bg-gray-200"
          >
            Discover
          </a>
        </div>
      </div>

      <div className="container mx-auto px-10 py-24 bg-[#fafafa]">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-6">
          Premium Aluminum Skirting Profiles
        </h2>
        <p className="text-center text-gray-600 mb-24">
          Experience sleek and modern profiles that enhance the aesthetic of any
          space.
        </p>
        <div className="flex flex-wrap items-center">
          <img
            src="Aluminum-Skirting/Image1-Desk.jpg"
            alt="Aluminum Skirting"
            className="w-full lg:w-1/2 rounded-2xl shadow-lg hidden lg:block"
          />
          <div className="w-full lg:w-1/2 lg:px-24">
            <div className="mb-6">
              <h3
                className="text-xl font-semibold text-gray-900 mb-2"
                style={{ lineHeight: "1.3" }}
              >
                Modern Touch Neat Finish Sleek Design
              </h3>
              <p className="text-gray-600" style={{ lineHeight: "1.3" }}>
                Discover the transformative power of our premium aluminum
                skirting profiles for any space.
              </p>
            </div>
            <div className="mb-6">
              <h3
                className="text-xl font-semibold text-gray-900 mb-2"
                style={{ lineHeight: "1.3" }}
              >
                Flawless Look Functionality Style Clean
              </h3>
              <p className="text-gray-600" style={{ lineHeight: "1.3" }}>
                Enhance every corner with impeccable clean and sophisticated
                aluminum skirting profiles.
              </p>
            </div>
            <div>
              <h3
                className="text-xl font-semibold text-gray-900 mb-2"
                style={{ lineHeight: "1.3" }}
              >
                Residential Commercial Setting Attention Detail Precision Design
              </h3>
              <p className="text-gray-600" style={{ lineHeight: "1.3" }}>
                Transform your space with attention to detail and precision in
                our sleek profiles.
              </p>
            </div>
            <img
              src="Aluminum-Skirting/Image1-Mob.avif"
              alt="Aluminum Skirting"
              className="w-full lg:w-1/2 rounded-2xl shadow-lg mt-16 block lg:hidden"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AluminumSkirting;
