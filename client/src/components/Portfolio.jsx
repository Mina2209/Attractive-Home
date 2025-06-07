import { useRef } from "react";
import portfolioData from "../data/portfolioData";
import { Link, useParams } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";

const PortfolioCategory = ({ category, activeTab, portfolioData }) => {
  const isActive = activeTab === category;

  return (
    <Link
      to={`/portfolio/${category}`}
      className={`pb-2 text-xl font-semibold text-center ${
        isActive ? "border-b-2 border-gray-50" : "border-b text-white"
      } transition-colors duration-200 uppercase`}
      aria-label={`View projects for ${portfolioData[category].title}`}
    >
      {portfolioData[category].title}
    </Link>
  );
};

const ProjectCard = ({ category, project }) => (
  <div className="relative group overflow-hidden sm:rounded-lg sm:shadow-lg">
    <Link to={`/portfolio/${category}/${project.id}`} className="block">
      <div className="relative overflow-hidden sm:rounded-lg sm:shadow-lg">
        <VideoPlayer
          videoUrl={project.video}
          className="w-full h-64 object-cover"
          enableHoverPlay={true}
          autoPlay={false}
          defaultMuted={true}
          showMuteButton={false}
        />
      </div>
    </Link>
    <div className="mt-4 text-left px-2 sm:px-0">
      <p className="text-sm uppercase">
        {project.description} {/*— {project.area} */}
      </p>
      <h3 className="text-xl font-bold">{project.title}</h3>
    </div>
  </div>
);

const Portfolio = () => {
  const { categoryId } = useParams();
  const videoRefs = useRef({});

  // Use categoryId from URL params or null if not specified
  const activeTab = categoryId || null;
  const activeCategory = categoryId ? portfolioData[categoryId] : null;

  if (categoryId && !portfolioData[categoryId]) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center bg-[#1f1f1f] px-6">
        <div className="flex flex-col">
          <Link
            to="/portfolio"
            className="text-lg flex items-center text-blue-300 hover:text-blue-400 mt-4 self-start"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Portfolio
          </Link>
          <h1 className="text-3xl sm:text-5xl font-bold mt-4 text-white">
            Category not found!
          </h1>
        </div>
      </div>
    );
  }

  const handleMouseEnter = (category, projectIndex) => {
    const videoKey = `${category}-${projectIndex}`;
    const videoElement = videoRefs.current[videoKey];
    if (videoElement) videoElement.play();
  };

  const handleMouseLeave = (category, projectIndex) => {
    const videoKey = `${category}-${projectIndex}`;
    const videoElement = videoRefs.current[videoKey];
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  };

  const videoUrl = "/Main/Portfolio/master.m3u8";

  return (
    <section className="py-20 md:px-12 lg:px-24 bg-[#1f1f1f] text-white">
      <VideoPlayer
        videoUrl={videoUrl}
        showMuteButton={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        className="absolute right-0 opacity-70 bottom-3/4 transform -translate-y-3/4 px-3 [@media(max-height:750px)]:bottom-2/3 [@media(max-height:750px)]:-translate-y-2/3
          [@media(max-height:750px)]:bottom-[60%] 
          [@media(max-height:750px)]:-translate-y-[60%]"
      >
        <span className="absolute top-[-20px] left-0 bg-gray-800 text-white text-xs font-semibold py-1 px-3 rounded-full">
          Pioneer
        </span>
        <Link
          to="/portfolio/aluminum-skirting"
          className="bg-white text-gray-900 text-xl font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-200 transition-all duration-300"
        >
          Explore Aluminum Skirting
        </Link>
      </div>
      <div className="flex flex-col min-h-screen">
        <div className="relative z-1 mb-12 grid grid-cols-1 mt-auto">
          {activeTab === null ? (
            <h2
              className="text-5xl font-bold mb-2 px-6"
              style={{ letterSpacing: "2.4px" }}
            >
              PORTFOLIO
            </h2>
          ) : (
            <>
              <h2
                className="text-4xl font-bold mb-5 px-6"
                style={{ letterSpacing: "2.4px" }}
              >
                {activeCategory.title}
              </h2>
              <p
                className="text-lg leading-8 px-6"
                style={{ letterSpacing: "0.6px" }}
              >
                {activeCategory.description}
              </p>
              <p
                className="text-lg mt-4 mb-6 font-semibold px-6"
                style={{ letterSpacing: "0.72px" }}
              >
                More than 140 objects ranging from 120 to 8000 m²
              </p>
            </>
          )}
        </div>

        <div className="relative z-1 max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-x-36 md:border-b border-gray-300 gap-y-8 mb-32 md:mx-auto">
          {Object.keys(portfolioData).map((category) => (
            <PortfolioCategory
              key={category}
              category={category}
              activeTab={activeTab}
              portfolioData={portfolioData}
            />
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid gap-24 md:grid-cols-2">
        {(activeTab === null ? Object.keys(portfolioData) : [activeTab]).map(
          (category) =>
            portfolioData[category].projects.map((project, projectIndex) => (
              <ProjectCard
                key={`${category}-${projectIndex}`}
                category={category}
                project={project}
                projectIndex={projectIndex}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
                videoRefs={videoRefs}
              />
            ))
        )}
        <div className="relative group overflow-hidden sm:rounded-lg sm:shadow-lg bg-gray-800 p-6 flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold text-white mb-4">
            Aluminum Skirting Profiles
          </h3>
          <Link
            to="/portfolio/aluminum-skirting"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            Explore More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
