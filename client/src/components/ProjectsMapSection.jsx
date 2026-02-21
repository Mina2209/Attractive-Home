import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import projectLocations from "../data/projectLocations";

// Fix default marker icons in react-leaflet (webpack/vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DUBAI_CENTER = [25.1700, 55.2708];

/**
 * Reusable map section with project markers. Use in About page or standalone map page.
 * @param {string} title - Section heading (e.g. "Over 50 Projects Across Dubai")
 * @param {string} subtitle - Optional short description
 * @param {string} className - Optional wrapper class
 * @param {string} mapHeight - CSS height for the map container (default: calc(100vh-16rem))
 */
const ProjectsMapSection = ({
  title,
  subtitle,
  className = "",
  mapHeight = "min-h-[400px] sm:min-h-[450px] lg:h-[500px]",
}) => {
  const navigate = useNavigate();

  const handleViewProject = (categoryId, projectId) => {
    navigate(`/portfolio/${categoryId}/${projectId}`);
  };

  return (
    <div className={`bg-[#0d2637] text-[#F5E6D3] ${className}`}>
      {(title || subtitle) && (
        <div className="px-4 sm:px-6 lg:px-10 pt-12 pb-6">
          {title && (
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3"
              style={{ letterSpacing: "0.02em" }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-gray-300 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="px-4 sm:px-6 lg:px-10 pb-12 lg:pb-16">
        <div className={`rounded-xl overflow-hidden border border-[#1e3a4d] shadow-2xl ${mapHeight}`}>
          <MapContainer
            center={DUBAI_CENTER}
            zoom={11}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {projectLocations.map((loc) => (
              <Marker key={`${loc.categoryId}-${loc.projectId}`} position={[loc.lat, loc.lng]}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-gray-900 mb-2">{loc.title}</p>
                    <button
                      type="button"
                      onClick={() => handleViewProject(loc.categoryId, loc.projectId)}
                      className="w-full bg-[#0d2637] text-[#F5E6D3] font-medium py-2 px-4 rounded-lg hover:bg-[#143344] transition-colors"
                    >
                      View Project
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default ProjectsMapSection;
