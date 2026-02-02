import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const api = axios.create({
    // Replace localhost with your machine's IP address (check via ipconfig)
    // using 10.0.2.2 for Android Emulator usually works, but for physical device/other emulators use LAN IP
    baseURL: 'http://192.168.1.11:5000/api',
    // baseURL: 'https://driveeraserver-1.onrender.com/api', // Production

});
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// Auth API calls are usually handled separately or inline, but good to have central methods
export const registerVehicle = async (vehicleData) => {
    try {
        const response = await api.post('/owner/register-vehicle', vehicleData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Helper to get user's vehicle
export const getMyVehicle = async (userId) => {
    try {
        const response = await api.get(`/owner/my-vehicle?userId=${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getMyVehicles = async (userId) => {
    try {
        const response = await api.get(`/owner/my-vehicles?userId=${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteVehicle = async (vehicleId) => {
    try {
        const response = await api.delete(`/owner/vehicle/${vehicleId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateVehicle = async (vehicleId, updates) => {
    try {
        const response = await api.put(`/owner/vehicle/${vehicleId}`, updates);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createTrip = async (tripData) => {
    try {
        const response = await api.post('/trips', tripData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateTrip = async (tripId, updates) => {
    try {
        const response = await api.put(`/trips/${tripId}`, updates);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteTrip = async (tripId) => {
    try {
        const response = await api.delete(`/trips/${tripId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getMyTrips = async (userId) => {
    try {
        const response = await api.get(`/trips/my-trips?userId=${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getTrips = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/trips/list?${params}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};


// Booking API
export const createBooking = async (bookingData) => {
    try {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getTripBookings = async (tripId) => {
    try {
        const response = await api.get(`/bookings/trip/${tripId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// User/Driver API
export const registerDriver = async (driverData) => {
    try {
        const response = await api.post('/users/register-driver', driverData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getDriverStatus = async (userId) => {
    try {
        const response = await api.get(`/users/status/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateBookingStatus = async (bookingId, status) => {
    try {
        const response = await api.put(`/bookings/${bookingId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Request API
export const createTripRequest = async (requestData) => {
    try {
        const response = await api.post('/requests', requestData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getOwnerRequests = async (ownerId) => {
    try {
        const response = await api.get(`/requests/owner/${ownerId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getDriverRequests = async (driverId) => {
    try {
        const response = await api.get(`/requests/driver/${driverId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateRequestStatus = async (requestId, status) => {
    try {
        const response = await api.patch(`/requests/${requestId}`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteTripRequest = async (requestId) => {
    try {
        const response = await api.delete(`/requests/${requestId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteAccount = async () => {
    try {
        const response = await api.delete('/auth/delete-account');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default api;