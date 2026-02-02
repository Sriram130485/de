import axios from 'axios';

const GOOGLE_API_KEY = "AIzaSyCQVOHYZs4ePvBd1Rvm1nvowXeSst7F46A";

const PLACES_BASE_URL = "https://places.googleapis.com/v1";

// Create an axios instance for Google Places API
const googleApiClient = axios.create({
    baseURL: PLACES_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
    }
});

/**
 * Fetches place suggestions based on user input string.
 * Uses the New Places Autocomplete API.
 * 
 * @param {string} input - The search text (e.g. "Raja")
 * @returns {Promise<Array>} - List of prediction objects
 */
export const fetchPlaceSuggestions = async (input) => {
    try {
        if (!input || input.length < 2) return [];

        // API Endpoint: POST https://places.googleapis.com/v1/places:autocomplete
        const response = await googleApiClient.post('/places:autocomplete', {
            input: input,
            includedRegionCodes: ["IN"], // Restrict to India
        });

        // The new API returns { suggestions: [ { placePrediction: { ... } }, ... ] }
        return response.data.suggestions || [];
    } catch (error) {
        console.error("Google Places Autocomplete Error:", error.response?.data || error.message);
        return [];
    }
};

/**
 * Fetches place details (lat, lng, components) for a specific Place ID.
 * Uses the New Places Details API.
 * 
 * @param {string} placeId 
 * @returns {Promise<Object|null>} - { lat, lng, city, state, address }
 */
export const fetchPlaceDetails = async (placeId) => {
    try {
        if (!placeId) return null;

        // Fields we want to retrieve
        const fields = [
            'id',
            'formattedAddress',
            'location', // contains lat, lng
            'addressComponents' // to extract city/state
        ];

        // API Endpoint: GET https://places.googleapis.com/v1/places/{placeId}
        const response = await googleApiClient.get(`/places/${placeId}`, {
            headers: {
                'X-Goog-FieldMask': fields.join(',')
            }
        });

        const place = response.data;

        // Extract meaningful data
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        const address = place.formattedAddress;

        let city = '';
        let state = '';

        // Parse address components to find City (Locality) and State (Admin Area Level 1)
        if (place.addressComponents) {
            place.addressComponents.forEach(component => {
                const types = component.types;
                if (types.includes('locality')) {
                    city = component.longText;
                }
                if (types.includes('administrative_area_level_1')) {
                    state = component.longText;
                }
            });
        }

        return {
            placeId: place.id,
            address,
            lat,
            lng,
            city,
            state
        };

    } catch (error) {
        console.error("Google Places Details Error:", error.response?.data || error.message);
        throw error;
    }
};
