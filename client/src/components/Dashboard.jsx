import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState({
    id: null,
    title: "",
    area: "",
    description: "",
    category: "architectural",
    coverVideo: null,
    coverVideoPreview: null,
    mediaItems: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const categories = [
    { value: "architectural", label: "Architectural Design" },
    { value: "interior", label: "Interior Design" },
    { value: "fit", label: "Fit-Out Interiors" },
  ];

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem("portfolioProjects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("portfolioProjects", JSON.stringify(projects));
    }
  }, [projects]);

  const handleCoverVideoChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setCurrentProject({
        ...currentProject,
        coverVideo: file,
        coverVideoPreview: URL.createObjectURL(file),
      });
    } else {
      alert("Please select a valid video file");
    }
  };

  const handleMediaItemsChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    const newMediaItems = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file: file,
      type: file.type.startsWith("image/") ? "image" : "video",
      preview: URL.createObjectURL(file),
      src: null, // Will be set after upload/conversion
    }));

    setCurrentProject({
      ...currentProject,
      mediaItems: [...currentProject.mediaItems, ...newMediaItems],
    });
  };

  const handleRemoveMediaItem = (itemId) => {
    setCurrentProject({
      ...currentProject,
      mediaItems: currentProject.mediaItems.filter(
        (item) => item.id !== itemId
      ),
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(currentProject.mediaItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCurrentProject({
      ...currentProject,
      mediaItems: items,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentProject.title || !currentProject.category) {
      alert("Please fill in all required fields");
      return;
    }

    if (!currentProject.coverVideo && !isEditing) {
      alert("Please select a cover video");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Processing project...");

    try {
      const projectId = currentProject.id || `project-${Date.now()}`;

      // Use preview URL for cover video
      let coverVideoUrl = currentProject.coverVideoPreview;

      // Use preview URLs for media items
      const convertedMediaItems = [];
      for (let i = 0; i < currentProject.mediaItems.length; i++) {
        const item = currentProject.mediaItems[i];
        convertedMediaItems.push({
          type: item.type,
          src: item.preview || item.src,
        });
      }

      const newProject = {
        id: projectId,
        title: currentProject.title,
        area: currentProject.area,
        description: currentProject.description,
        category: currentProject.category,
        video: coverVideoUrl,
        details: convertedMediaItems,
        createdAt: new Date().toISOString(),
      };

      if (isEditing) {
        setProjects(
          projects.map((p) => (p.id === currentProject.id ? newProject : p))
        );
      } else {
        setProjects([...projects, newProject]);
      }

      // Reset form
      resetForm();
      setUploadProgress("");
      alert(
        isEditing
          ? "Project updated successfully!"
          : "Project created successfully!"
      );
    } catch (error) {
      console.error("Error uploading project:", error);
      alert("Error uploading project: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setCurrentProject({
      id: null,
      title: "",
      area: "",
      description: "",
      category: "architectural",
      coverVideo: null,
      coverVideoPreview: null,
      mediaItems: [],
    });
    setIsEditing(false);
    setShowForm(false);
  };

  const handleEditProject = (project) => {
    setCurrentProject({
      id: project.id,
      title: project.title,
      area: project.area,
      description: project.description,
      category: project.category,
      coverVideo: project.video,
      coverVideoPreview: project.video,
      mediaItems: project.details.map((detail, index) => ({
        id: Date.now() + index,
        type: detail.type,
        preview: detail.src,
        src: detail.src,
      })),
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      setProjects(projects.filter((p) => p.id !== projectId));
    }
  };

  const getProjectsByCategory = (category) => {
    return projects.filter((p) => p.category === category);
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {" "}
            {showForm ? "View Projects" : "Add New Project"}{" "}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">
              {isEditing ? "Edit Project" : "Create New Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Video <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs ml-2">
                    (Recommended ratio: 16:9)
                  </span>
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleCoverVideoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {currentProject.coverVideoPreview && (
                  <div className="mt-4">
                    <video
                      src={currentProject.coverVideoPreview}
                      controls
                      className="w-full max-w-md rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentProject.title}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      title: e.target.value,
                    })
                  }
                  placeholder="Ex. Mr. Ahmed Baghoum's Villa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area
                </label>
                <input
                  type="text"
                  value={currentProject.area}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      area: e.target.value,
                    })
                  }
                  placeholder="Ex. 750 m²"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={currentProject.description}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Project description"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={currentProject.category}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media Items Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Media (Images/Videos)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaItemsChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Sortable Media Items */}
              {currentProject.mediaItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Media Items (Drag to reorder)
                  </h3>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="mediaItems">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3"
                        >
                          {currentProject.mediaItems.map((item, index) => (
                            <Draggable
                              key={item.id}
                              draggableId={String(item.id)}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex-shrink-0">
                                    <svg
                                      className="w-6 h-6 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 8h16M4 16h16"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {item.type === "image" ? (
                                      <img
                                        src={item.preview}
                                        alt="Preview"
                                        className="w-20 h-20 object-cover rounded"
                                      />
                                    ) : (
                                      <video
                                        src={item.preview}
                                        className="w-20 h-20 object-cover rounded"
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.type === "image"
                                        ? "Image"
                                        : "Video"}{" "}
                                      {index + 1}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.file?.name || "Existing media"}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveMediaItem(item.id)
                                    }
                                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? "Update Project" : "Create Project"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Conversion Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Before Upload to S3:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Images will be converted to .webp format</li>
                  <li>• Videos will be converted to HLS format (240p, 480p)</li>
                  <li>• Cover video ratio should be 16:9 for best results</li>
                </ul>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryProjects = getProjectsByCategory(category.value);
              if (categoryProjects.length === 0) return null;

              return (
                <div
                  key={category.value}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <h2 className="text-2xl font-semibold mb-4">
                    {category.label}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryProjects.map((project) => (
                      <div
                        key={project.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-video bg-gray-100">
                          {project.video && (
                            <video
                              src={project.video}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2">
                            {project.title}
                          </h3>
                          {project.area && (
                            <p className="text-sm text-gray-600 mb-2">
                              Area: {project.area}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mb-4">
                            {project.description}
                          </p>
                          <p className="text-xs text-gray-500 mb-4">
                            {project.details.length} media items
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProject(project)}
                              className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No projects yet. Click "Add New Project" to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
