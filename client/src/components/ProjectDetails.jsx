import { useParams } from "react-router-dom";
import portfolioData from "../data/portfolioData";

const ProjectDetails = () => {
  const { categoryId, projectId } = useParams();
  const category = portfolioData[categoryId];
  const project = category.projects.find((proj) => proj.id === projectId);

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
    <section className="flex flex-col bg-[#1f1f1f] text-white">
      {/* <div className="h-40"></div>
      <h1 className="text-4xl font-bold mb-8 text-center px-4">
        {project.title}
      </h1> */}
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
            <video
              key={`detail-${index}`}
              src={item.src}
              className="w-full h-auto object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )
        )}
      </div>
    </section>
  );
};

export default ProjectDetails;
