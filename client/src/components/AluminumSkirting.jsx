const AluminumSkirting = () => {
  return (
    <section
      className="relative min-h-screen bg-cover bg-center bg-fixed text-white text-center sm:text-left max-sm:pt-56 2xl:pt-96"
      style={{
        backgroundImage: "url('Aluminum.avif')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      <div className="sm:min-h-screen 2xl:min-h-0 flex flex-col sm:justify-end px-5 2xl:px-32 pb-64 sm:pb-4 max-sm:items-center">
        <div className="relative z-10 max-w-xs sm:max-w-4xl">
          <h1
            className="text-4xl sm:text-6xl font-bold tracking-[1.6px]"
            style={{ lineHeight: "1.5" }}
          >
            Transformative Aluminum Skirting Profiles
          </h1>
        </div>
      </div>

      <div className="px-5 2xl:px-32 pb-24 pt-0.5">
        <div className="relative z-10 max-w-2xl">
          <p
            className="text-md sm:text-lg max-w-2xl tracking-[0.7px]"
            style={{ lineHeight: "1.35" }}
          >
            Elevate your space with sleek, modern aluminum profiles that blend
            functionality and style.
          </p>
          <a
            href="https://assets.zyrosite.com/dJo4N1nLLEtrkyr7/mrg-001_guide-d95g7RoN3ehNez5k.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-block px-14 py-3 text-lg font-medium text-gray-900 bg-white rounded-full hover:bg-gray-200"
          >
            Discover
          </a>
        </div>
      </div>
    </section>
  );
};

export default AluminumSkirting;
