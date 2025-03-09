import { useParams } from "react-router-dom";
import portfolioData from "../data/portfolioData";
import VideoPlayer from "./VideoPlayer";
import { useEffect } from "react";

const ProjectDetails = ({ setLoading }) => {
  const { categoryId, projectId } = useParams();
  const category = portfolioData[categoryId];
  const project = category.projects.find((proj) => proj.id === projectId);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  if (!project)
    return (
      <div className="flex flex-col bg-[#1f1f1f] text-white">
        <div className="h-40"></div>
        <div className="text-4xl font-bold mb-12 text-center px-4">
          Project data not found
        </div>
      </div>
    );

  return (
    <section className="flex flex-col bg-black text-white">
      <div className="h-40 bg-[#1f1f1f]"></div>
      <h1 className="text-4xl font-bold mb-10 mt-10 text-center px-4">
        {project.title}
      </h1>
      <div className="w-full h-auto overflow-hidden space-y-4">
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
              setLoading={setLoading}
            />
            // <video
            //   key={`detail-${index}`}
            //   src={item.src}
            //   className="w-full h-auto object-cover"
            //   autoPlay
            //   loop
            //   playsInline
            //   muted
            // />
          )
        )}
      </div>
    </section>
  );
};

export default ProjectDetails;
