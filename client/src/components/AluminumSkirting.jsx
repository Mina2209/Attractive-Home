const AluminumSkirting = () => {
  return (
    <section
      className="relative flex flex-col lg:justify-end min-h-screen bg-cover bg-fixed bg-center text-white lg:px-32 max-lg:text-center max-lg:items-center"
      style={{
        backgroundImage: "url('Aluminum.avif')",
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
          className="mt-3 text-md sm:text-xl tracking-[0.7px] md:max-w-2xl lg:max-w-2xl max-sm:px-1 mx-auto lg:mx-0"
          style={{ lineHeight: "1.4" }}
        >
          Elevate your space with sleek, modern aluminum profiles that blend
          functionality and style.
        </p>
        <a
          href="https://assets.zyrosite.com/dJo4N1nLLEtrkyr7/mrg-001_guide-d95g7RoN3ehNez5k.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 mb-20 inline-block px-14 py-4 text-lg font-medium text-gray-900 bg-white rounded-full hover:bg-gray-200"
        >
          Discover
        </a>
      </div>
    </section>
  );
};

export default AluminumSkirting;
