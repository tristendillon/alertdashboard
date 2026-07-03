import type { LatLng } from "@/lib/types";

export const getLatLngDistances = (
  latlng1: LatLng,
  latlng2: LatLng,
): number => {
  const R = 6371000; // Earth's radius in meters (same as Google Maps)

  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (latlng1.lat * Math.PI) / 180;
  const lat2Rad = (latlng2.lat * Math.PI) / 180;
  const deltaLatRad = ((latlng2.lat - latlng1.lat) * Math.PI) / 180;
  const deltaLngRad = ((latlng2.lng - latlng1.lng) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  const distance = R * c;

  return distance;
};

export const getCenterOfLatLngs = (latLngs: LatLng[]) => {
  const realLatLngs = latLngs.filter(
    (latLng) => latLng.lat !== 0 && latLng.lng !== 0,
  );
  const center = realLatLngs.reduce(
    (acc, curr) => {
      acc.lat += curr.lat;
      acc.lng += curr.lng;
      return acc;
    },
    { lat: 0, lng: 0 },
  );
  center.lat /= realLatLngs.length;
  center.lng /= realLatLngs.length;
  return center;
};

export function getZoomForLatLngsWithBounds(
  latLngs: LatLng[],
  viewportWidth: number,
  viewportHeight: number,
) {
  if (latLngs.length === 0) return 17;

  const filteredLatLngs = latLngs.filter(
    (latLng) => latLng.lat !== 0 && latLng.lng !== 0,
  );

  // Compute bounds
  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;
  for (const { lat, lng } of filteredLatLngs) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  function latToY(lat: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  }

  function lngToX(lng: number) {
    return (lng + 180) / 360;
  }

  const xMin = lngToX(minLng);
  const xMax = lngToX(maxLng);
  const yMin = latToY(maxLat); // note: maxLat -> yMin due to Mercator
  const yMax = latToY(minLat);

  const xSpan = Math.max(xMax - xMin, 1e-6);
  const ySpan = Math.max(yMax - yMin, 1e-6);

  // Calculate zoom
  const WORLD_TILE_SIZE = 256;
  const ZOOM_MAX = 21;

  const xZoom = Math.log2(viewportWidth / WORLD_TILE_SIZE / xSpan);
  const yZoom = Math.log2(viewportHeight / WORLD_TILE_SIZE / ySpan);

  const zoom = Math.min(xZoom, yZoom, ZOOM_MAX);

  return Math.floor(zoom);
}

export function getSmartZoomIgnoringOutliers(
  latLngs: LatLng[],
  viewportWidth: number,
  viewportHeight: number,
  outlierPercent = 0.05,
) {
  if (latLngs.length === 0) return 17;

  const filteredLatLngs = latLngs.filter(
    (latLng) => latLng.lat !== 0 && latLng.lng !== 0,
  );

  if (filteredLatLngs.length === 0) return 17;

  const center = getCenterOfLatLngs(filteredLatLngs);

  // Compute distances
  const distances = filteredLatLngs.map((point) => ({
    point,
    dist: getLatLngDistances(center, point),
  }));

  // Sort by distance
  distances.sort((a, b) => a.dist - b.dist);

  // Keep up to (1 - outlierPercent) closest points
  const cutoff = Math.floor(distances.length * (1 - outlierPercent));
  const mainPoints = distances
    .slice(0, Math.max(cutoff, 1))
    .map((d) => d.point);

  return getZoomForLatLngsWithBounds(mainPoints, viewportWidth, viewportHeight);
}
