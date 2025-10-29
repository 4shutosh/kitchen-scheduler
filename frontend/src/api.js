import axios from "axios";

// Get API URL from environment variable or detect from window location
// When running on local network, use the hostname instead of localhost
const getApiBaseUrl = () => {
	// Check if VITE_API_URL is set (for build-time configuration)
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL;
	}

	// If running in development and accessed via network IP, use that IP for API
	if (
		import.meta.env.DEV &&
		window.location.hostname !== "localhost" &&
		window.location.hostname !== "127.0.0.1"
	) {
		return `http://${window.location.hostname}:8000`;
	}

	// Default to localhost for local development
	return "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Stations API
export const stationsAPI = {
	getAll: () => api.get("/stations/"),
	getById: (id) => api.get(`/stations/${id}`),
	create: (data) => api.post("/stations/", data),
	update: (id, data) => api.put(`/stations/${id}`, data),
	delete: (id) => api.delete(`/stations/${id}`),
};

// Menus API
export const menusAPI = {
	getAll: () => api.get("/menus/"),
	getById: (id) => api.get(`/menus/${id}`),
	create: (data) => api.post("/menus/", data),
	update: (id, data) => api.put(`/menus/${id}`, data),
	delete: (id) => api.delete(`/menus/${id}`),
	getMenuItems: (menuId) => api.get(`/menus/${menuId}/menu-items/`),
};

// Menu Items API
export const menuItemsAPI = {
	getAll: () => api.get("/menu-items/"),
	getById: (id) => api.get(`/menu-items/${id}`),
	create: (data) => api.post("/menu-items/", data),
	update: (id, data) => api.put(`/menu-items/${id}`, data),
	delete: (id) => api.delete(`/menu-items/${id}`),
};

// Orders API
export const ordersAPI = {
	getAll: () => api.get("/orders/"),
	getById: (id) => api.get(`/orders/${id}`),
	create: (data) => api.post("/orders/", data),
};

// Kitchen Staff API
export const kitchenAPI = {
	getOrderItemsByStation: (stationId, status = null) => {
		const params = status ? { status } : {};
		return api.get(`/stations/${stationId}/order-items/`, { params });
	},
	updateOrderItemStatus: (orderItemId, status) =>
		api.patch(`/order-items/${orderItemId}/status`, { status }),
};

export default api;
