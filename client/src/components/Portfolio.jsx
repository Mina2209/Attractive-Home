import React, { useState, useRef } from "react";
import portfolioData from "../data/portfolioData";
import { Link } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";

const PortfolioCategory = ({
  category,
  activeTab,
  setActiveTab,
  portfolioData,
}) => (
  <button
    onClick={() => setActiveTab(category)}
    className={`pb-2 text-xl font-semibold ${
      activeTab === category
        ? "border-b-2 border-gray-50"
        : "border-b text-white"
    } transition-colors duration-200 uppercase`}
    aria-label={`View projects for ${portfolioData[category].title}`}
  >
    {portfolioData[category].title}
  </button>
);

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
        {project.description} — {project.area}
      </p>
      <h3 className="text-lg font-bold">{project.title}</h3>
    </div>
  </div>
);

const Portfolio = ({ setLoading }) => {
  const [activeTab, setActiveTab] = useState(null);
  const videoRefs = useRef({});
  const activeCategory = portfolioData[activeTab];

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
        className="absolute inset-0 w-full h-full object-cover"
        setLoading={setLoading}
      />

      <div className="absolute inset-0 bg-black opacity-50"></div>
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
              setActiveTab={setActiveTab}
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
      </div>
    </section>
  );
};

export default Portfolio;
