const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getCoordinates(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
        const response = await axios.get(url);
        const { results, status } = response.data;
        
        if (status !== "OK" || results.length === 0) {
            console.warn(`Address not found: ${address}`);
            return { error: 'Address not found', latitude: null, longitude: null };
        }
        
        const { lat, lng } = results[0].geometry.location;
        return { latitude: lat, longitude: lng };
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        return { error: 'Failed to fetch coordinates', latitude: null, longitude: null };
    }
}

module.exports = { getCoordinates };