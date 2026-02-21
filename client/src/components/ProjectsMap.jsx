import ProjectsMapSection from "./ProjectsMapSection";

const ProjectsMap = () => (
  <section className="bg-[#0d2637] text-[#F5E6D3] min-h-screen">
    <div className="pt-28 pb-2 px-4 sm:px-6 lg:px-10" />
    <ProjectsMapSection
      title="PROJECTS MAP"
      subtitle="Our completed projects across Dubai. Click a marker to open the project page."
      mapHeight="h-[calc(100vh-16rem)] min-h-[400px]"
    />
  </section>
);

export default ProjectsMap;
