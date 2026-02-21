/**
 * Project locations for the map (pretend Dubai coordinates).
 * Each project is assigned a deterministic lat/lng so markers are spread across Dubai.
 */
import portfolioData from "./portfolioData";

// Dubai bounds (approximate): 24.9–25.3 lat, 55.1–55.5 lng
// Deterministic "random" positions so the same project always gets the same spot
const dubaiLocations = [
  [25.0877, 55.1385], // Jumeirah
  [25.0657, 55.1393],
  [25.2048, 55.2708], // Downtown
  [25.1124, 55.1390],
  [25.2285, 55.3273], // Dubai Marina area
  [25.2419, 55.2994],
  [25.0658, 55.2100],
  [25.1972, 55.2744],
  [25.1134, 55.1380],
  [25.0916, 55.1612],
  [25.2184, 55.2843],
  [25.0764, 55.1312],
  [25.2496, 55.3012],
  [25.0721, 55.1421],
  [25.1852, 55.2612],
  [25.0988, 55.1555],
];

/**
 * Build a flat list of all projects with their category, id, title, and a Dubai location.
 */
function buildProjectLocations() {
  const list = [];
  let index = 0;
  for (const [categoryId, category] of Object.entries(portfolioData)) {
    if (!category.projects || !Array.isArray(category.projects)) continue;
    for (const project of category.projects) {
      const [lat, lng] = dubaiLocations[index % dubaiLocations.length];
      list.push({
        categoryId,
        projectId: project.id,
        title: project.title,
        lat,
        lng,
      });
      index++;
    }
  }
  return list;
}

export const projectLocations = buildProjectLocations();

export default projectLocations;
