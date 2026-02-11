/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} Distance in kilometers.
 */
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

/**
 * Checks if a location is within a specified radius of another location.
 * @param {Object} center - The center point { lat, lng }.
 * @param {Object} point - The point to check { lat, lng }.
 * @param {number} radiusKm - The radius in kilometers.
 * @returns {boolean} True if within radius, false otherwise.
 */
const isWithinRadius = (center, point, radiusKm) => {
    const distance = getDistanceFromLatLonInKm(center.lat, center.lng, point.lat, point.lng);
    return distance <= radiusKm;
};

module.exports = {
    getDistanceFromLatLonInKm,
    isWithinRadius
};
