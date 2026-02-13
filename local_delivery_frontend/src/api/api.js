import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true // IMPORTANT for Google session auth
});

// ---------- AUTH ----------
export const googleLogin = () => {
  window.location.href = "http://localhost:5000/api/auth/google";
};

// ---------- RESTAURANTS ----------
export const getRestaurants = () => API.get("/restaurants");
export const addRestaurant = (data) => API.post("/restaurants", data);

// ---------- ORDERS ----------
export const getOrders = () => API.get("/orders");
export const placeOrder = (data) => API.post("/orders", data);

export const getMenu = restaurantId =>
  API.get(`/menu/${restaurantId}`);

export const addMenuItem = data =>
  API.post("/menu/add", data);

export const deleteMenuItem = id =>
  API.delete(`/menu/${id}`);
export default API;
