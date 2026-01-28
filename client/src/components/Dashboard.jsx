import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import VideoPlayer from "./VideoPlayer";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./Toast";
import {
  fetchProjectsManifest,
  fetchProjectMetadata,
  createProject,
  updateProject,
  deleteProject,
  getUploadUrls,
  uploadFile,
} from "../services/portfolioService";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [error, setError] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, project: null });

  const toast = useToast();

  const getAdminPassword = () => {
    return import.meta.env.VITE_DASHBOARD_PASSWORD || "admin123";
  };

  const categories = [
    { value: "architectural", label: "Architectural Design", icon: "🏛️" },
    { value: "interior", label: "Interior Design", icon: "🏠" },
    { value: "fit", label: "Fit-Out Interiors", icon: "🔧" },
  ];

  // Helper to construct proper media URLs
  const getMediaUrl = (path) => {
    if (!path) return null;
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise prepend S3 base URL
    const baseUrl = import.meta.env.VITE_S3_BASE_URL || '';
    const separator = path.startsWith('/') ? '' : '/';
    return `${baseUrl}${separator}${path}`;
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const manifest = await fetchProjectsManifest();

      // Fetch full metadata for each project in batches
      const BATCH_SIZE = 3;
      const allProjects = [];

      for (let i = 0; i < manifest.projects.length; i += BATCH_SIZE) {
        const batch = manifest.projects.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (p) => {
            try {
              const metadata = await fetchProjectMetadata(p.category, p.id);
              return { ...metadata, category: p.category };
            } catch (err) {
              console.error(`Failed to load project ${p.id}:`, err);
              return { ...p, title: p.title || p.id };
            }
          })
        );
        allProjects.push(...batchResults);
      }

      setProjects(allProjects);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("Failed to load projects");
      toast.error("Failed to load projects. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentProject({
        ...currentProject,
        coverVideo: file,
        coverVideoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleMediaItemsChange = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      type: file.type.startsWith("image/") ? "image" : "video",
      preview: URL.createObjectURL(file),
    }));

    setCurrentProject({
      ...currentProject,
      mediaItems: [...currentProject.mediaItems, ...newItems],
    });
  };

  const handleRemoveMediaItem = (itemId) => {
    setCurrentProject({
      ...currentProject,
      mediaItems: currentProject.mediaItems.filter((item) => item.id !== itemId),
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(currentProject.mediaItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCurrentProject({ ...currentProject, mediaItems: items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentProject.title.trim()) {
      toast.warning("Please enter a project title");
      return;
    }

    if (!isEditing && !currentProject.coverVideo) {
      toast.warning("Please select a cover video");
      return;
    }

    try {
      setIsUploading(true);
      setUploadPercentage(0);

      const filesToUpload = [];

      if (currentProject.coverVideo) {
        filesToUpload.push({
          filename: `cover.${currentProject.coverVideo.name.split('.').pop()}`,
          contentType: currentProject.coverVideo.type,
          type: 'cover',
          file: currentProject.coverVideo,
        });
      }

      currentProject.mediaItems.forEach((item, index) => {
        if (item.file) {
          filesToUpload.push({
            filename: `media_${index + 1}.${item.file.name.split('.').pop()}`,
            contentType: item.file.type,
            type: 'media',
            file: item.file,
          });
        }
      });

      const projectId = currentProject.id || `project-${Date.now()}`;

      // Only get upload URLs if there are files to upload
      let uploadUrls = [];
      if (filesToUpload.length > 0) {
        setUploadProgress("Getting upload URLs...");
        const uploadResponse = await getUploadUrls(
          currentProject.category,
          projectId,
          filesToUpload.map(f => ({ filename: f.filename, type: f.type, contentType: f.contentType })),
          getAdminPassword()
        );
        uploadUrls = uploadResponse.uploadUrls || uploadResponse || [];
      }

      const totalFiles = filesToUpload.length;
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(`Uploading ${file.filename}...`);
        const url = uploadUrls[i]?.uploadUrl;
        if (url) {
          // Calculate base progress for this file
          const baseProgress = Math.round((i / totalFiles) * 80);
          const fileProgressWeight = 80 / totalFiles;

          await uploadFile(url, file.file, (filePercent) => {
            // Update progress based on current file's upload progress
            const totalProgress = baseProgress + Math.round((filePercent / 100) * fileProgressWeight);
            setUploadPercentage(totalProgress);
          });
        }
        setUploadPercentage(Math.round(((i + 1) / totalFiles) * 80));
      }

      setUploadProgress("Saving project...");

      const projectData = {
        id: projectId,
        category: currentProject.category,
        title: currentProject.title,
        area: currentProject.area,
        description: currentProject.description,
        mediaCount: currentProject.mediaItems.filter(m => m.file).length,
        hasCover: !!currentProject.coverVideo,
      };

      if (isEditing) {
        await updateProject(currentProject.category, projectId, projectData, getAdminPassword());
        toast.success("Project updated successfully!");
      } else {
        await createProject(projectData, getAdminPassword());
        toast.success("Project created successfully!");
      }

      setUploadPercentage(100);
      await loadProjects();
      resetForm();
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Error saving project: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      setUploadPercentage(0);
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
      title: project.title || "",
      area: project.area || "",
      description: project.description || "",
      category: project.category,
      coverVideo: null,
      coverVideoPreview: project.cover || null,
      mediaItems: (project.media || []).map((m, i) => ({
        id: `existing-${i}`,
        type: m.type,
        preview: m.src,
        file: null,
      })),
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteProject = (project) => {
    setConfirmModal({ isOpen: true, project });
  };

  const confirmDelete = async () => {
    const project = confirmModal.project;
    setConfirmModal({ isOpen: false, project: null });

    try {
      setDeletingProjectId(project.id);
      await deleteProject(project.category, project.id, getAdminPassword());
      await loadProjects();
      toast.success(`"${project.title || project.id}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error deleting project: " + error.message);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const getProjectsByCategory = (category) => {
    return projects.filter((p) => p.category === category);
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    if (activeFilter !== "all") {
      filtered = filtered.filter((p) => p.category === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.title || p.id).toLowerCase().includes(query) ||
          (p.description || "").toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getCategoryCounts = () => {
    const counts = { all: projects.length };
    categories.forEach((cat) => {
      counts[cat.value] = projects.filter((p) => p.category === cat.value).length;
    });
    return counts;
  };

  const counts = getCategoryCounts();
  const filteredProjects = getFilteredProjects();

  // Loading state
  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] py-36 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">
              PORTFOLIO DASHBOARD
            </h1>
            <p className="text-gray-400 mt-1">Manage your projects and media</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${showForm
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30"
              }`}
          >
            {showForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                View Projects
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        {!showForm && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div
              onClick={() => setActiveFilter("all")}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${activeFilter === "all"
                ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                : "bg-gray-800/80 hover:bg-gray-700/80"
                }`}
            >
              <p className="text-3xl font-bold text-white">{counts.all}</p>
              <p className="text-sm text-gray-300 mt-1">All Projects</p>
            </div>
            {categories.map((cat) => (
              <div
                key={cat.value}
                onClick={() => setActiveFilter(cat.value)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${activeFilter === cat.value
                  ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                  : "bg-gray-800/80 hover:bg-gray-700/80"
                  }`}
              >
                <p className="text-3xl font-bold text-white">
                  <span className="mr-2">{cat.icon}</span>
                  {counts[cat.value]}
                </p>
                <p className="text-sm text-gray-300 mt-1 truncate">{cat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search Bar */}
        {!showForm && (
          <div className="mb-6">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/80 text-white placeholder-gray-400 rounded-xl border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-8 bg-gray-800/90 backdrop-blur rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between text-white mb-3">
              <span className="font-medium">{uploadProgress}</span>
              <span className="text-blue-400 font-bold">{uploadPercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Form */}
        {showForm ? (
          <div className="bg-gray-800/90 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              {isEditing ? "Edit Project" : "Create New Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Video <span className="text-red-400">*</span>
                  <span className="text-gray-500 text-xs ml-2">(16:9 ratio)</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleCoverVideoChange}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer bg-gray-700/50 rounded-lg border border-gray-600 focus:border-blue-500"
                  />
                </div>
                {currentProject.coverVideoPreview && (
                  <div className="mt-4 rounded-xl overflow-hidden bg-gray-900 max-w-lg">
                    {currentProject.coverVideoPreview.includes('.m3u8') ? (
                      <VideoPlayer
                        videoUrl={getMediaUrl(currentProject.coverVideoPreview)}
                        className="w-full rounded-xl"
                        autoPlay={false}
                        showMuteButton={false}
                      />
                    ) : (
                      <video
                        src={currentProject.coverVideoPreview}
                        controls
                        className="w-full rounded-xl"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Title & Area Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentProject.title}
                    onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                    placeholder="e.g. Mr. Ahmed's Villa"
                    className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-500 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Area
                  </label>
                  <input
                    type="text"
                    value={currentProject.area}
                    onChange={(e) => setCurrentProject({ ...currentProject, area: e.target.value })}
                    placeholder="e.g. 750 m²"
                    className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-500 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={currentProject.description}
                  onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                  placeholder="Brief project description..."
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-700/50 text-white placeholder-gray-500 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCurrentProject({ ...currentProject, category: cat.value })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${currentProject.category === cat.value
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-gray-600 bg-gray-700/30 text-gray-400 hover:border-gray-500"
                        }`}
                    >
                      <span className="text-2xl block mb-1">{cat.icon}</span>
                      <span className="text-xs font-medium">{cat.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Media (Images/Videos)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaItemsChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500 file:cursor-pointer cursor-pointer bg-gray-700/50 rounded-lg border border-gray-600"
                />
              </div>

              {/* Sortable Media Items */}
              {currentProject.mediaItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Media Items ({currentProject.mediaItems.length}) — Drag to reorder
                  </h3>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="mediaItems">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2 max-h-64 overflow-y-auto pr-2"
                        >
                          {currentProject.mediaItems.map((item, index) => (
                            <Draggable
                              key={item.id}
                              draggableId={String(item.id)}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${snapshot.isDragging
                                    ? "bg-gray-600 border-blue-500 shadow-lg"
                                    : "bg-gray-700/50 border-gray-600"
                                    }`}
                                >
                                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                  <div className="flex-shrink-0">
                                    {item.type === "image" ? (
                                      <img src={item.preview} alt="" className="w-16 h-12 object-cover rounded" />
                                    ) : (
                                      <video src={item.preview} className="w-16 h-12 object-cover rounded" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                      {item.type === "image" ? "📷" : "🎬"} {item.file?.name || `${item.type} ${index + 1}`}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMediaItem(item.id)}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 shadow-lg shadow-blue-600/30"
                    }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isEditing ? "Update Project" : "Create Project"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isUploading}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm text-blue-300 font-medium mb-2">📋 Automatic Processing:</p>
                <ul className="text-sm text-blue-200/80 space-y-1">
                  <li>• Images → WebP format</li>
                  <li>• Videos → HLS (240p, 480p)</li>
                  <li>• Processing takes a few minutes</li>
                </ul>
              </div>
            </form>
          </div>
        ) : (
          /* Projects Grid */
          <div>
            {filteredProjects.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-12 text-center border border-gray-700">
                {searchQuery || activeFilter !== "all" ? (
                  <>
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-400 text-lg mb-2">No projects found</p>
                    <p className="text-gray-500 text-sm">Try adjusting your search or filter</p>
                    <button
                      onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                      className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-400 text-lg mb-2">No projects yet</p>
                    <p className="text-gray-500 text-sm">Click "Add Project" to get started</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={`${project.category}-${project.id}`}
                    className={`bg-gray-800/80 backdrop-blur rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200 group ${deletingProjectId === project.id ? "opacity-50" : ""
                      }`}
                  >
                    {/* Cover */}
                    <div className="aspect-video bg-gray-900 relative overflow-hidden">
                      {deletingProjectId === project.id ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : project.cover ? (
                        project.cover.includes('.m3u8') ? (
                          <VideoPlayer
                            videoUrl={getMediaUrl(project.cover)}
                            className="w-full h-full object-cover"
                            autoPlay={false}
                            showMuteButton={false}
                          />
                        ) : (
                          <video
                            src={getMediaUrl(project.cover)}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Category Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
                          {categories.find((c) => c.value === project.category)?.icon} {project.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-white truncate">
                        {project.title || project.id}
                      </h3>
                      {project.area && (
                        <p className="text-sm text-gray-400 mt-1">📐 {project.area}</p>
                      )}
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-3">
                        📎 {project.media?.length || 0} media items
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="flex-1 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          disabled={deletingProjectId === project.id}
                          className="flex-1 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, project: null })}
        onConfirm={confirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmModal.project?.title || confirmModal.project?.id}"? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}

export default Dashboard;
