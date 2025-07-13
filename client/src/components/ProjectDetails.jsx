import { useParams } from "react-router-dom";
import portfolioData from "../data/portfolioData";
import VideoPlayer from "./VideoPlayer";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const ProjectDetails = () => {
  const { categoryId, projectId } = useParams();
  const category = portfolioData[categoryId];
  const project = category.projects.find((proj) => proj.id === projectId);

  if (!project)
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
            Project data not found!
          </h1>
        </div>
      </div>
    );

  // Check if details are grouped by folder
  const isGrouped = Array.isArray(project.details) && project.details.length > 0 && project.details[0].folder;

  // State to track collapsed/expanded folders
  const [collapsed, setCollapsed] = useState({});

  // On mount or when project.details changes, set all folders to collapsed
  useEffect(() => {
    if (isGrouped) {
      const initialCollapsed = {};
      project.details.forEach(group => {
        initialCollapsed[group.folder] = true;
      });
      setCollapsed(initialCollapsed);
    }
  }, [project.details, isGrouped]);

  const toggleCollapse = (folder) => {
    setCollapsed((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  return (
    <section className="flex flex-col bg-black text-white">
      <div className="h-40 bg-[#1f1f1f]"></div>
      <h1 className="text-4xl font-bold mb-10 mt-10 text-center px-4">
        {project.title}
      </h1>
      <div className="w-full h-auto overflow-hidden space-y-8">
        {isGrouped ? (
          project.details.map((group, idx) => (
            <div key={`folder-group-${idx}`} className="mb-8">
              <div className="flex items-center cursor-pointer select-none mb-4 ml-4" onClick={() => toggleCollapse(group.folder)}>
                <span className="text-2xl font-bold text-blue-300 uppercase mr-2">{group.folder}</span>
                <button
                  aria-label={collapsed[group.folder] ? `Show ${group.folder}` : `Hide ${group.folder}`}
                  className="focus:outline-none"
                  type="button"
                >
                  {collapsed[group.folder] ? (
                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  ) : (
                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  )}
                </button>
              </div>
              {!collapsed[group.folder] && (
                <div className="grid gap-4 md:grid-cols-2 md:m-4">
                  {group.items.map((item, index) =>
                    item.type === "image" ? (
                      <img
                        key={`detail-${idx}-${index}`}
                        src={item.src}
                        alt={`Project ${project.title} ${group.folder} Image ${index + 1}`}
                        className="w-full h-auto"
                      />
                    ) : (
                      <VideoPlayer
                        key={`detail-${idx}-${index}`}
                        videoUrl={item.src}
                        className="w-full h-auto object-cover"
                      />
                    )
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          // fallback for old structure
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 md:m-4">
              {project.details.map((item, index) =>
                item.type === "image" ? (
                  <img
                    key={`detail-${index}`}
                    src={item.src}
                    alt={`Project ${project.title} Image ${index + 1}`}
                    className="w-full h-auto"
                  />
                ) : (
                  <VideoPlayer
                    key={`detail-${index}`}
                    videoUrl={item.src}
                    className="w-full h-auto object-cover"
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectDetails;
