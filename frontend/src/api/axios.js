  import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://sairaj-transport-system.onrender.com/api";
  
  if (!API_BASE) {
    throw new Error("❌ VITE_API_URL is not defined in .env");
  }
  // ── Public / User API ──
  const api = axios.create({
    baseURL: API_BASE, // ✅ FIXED
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  // Attach user token (sessionStorage — clears on tab close)
  api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ── Admin API ──
  const adminApi = axios.create({
    baseURL: API_BASE + "/admin", // ✅ FIXED
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  adminApi.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  export { api, adminApi };
  export default api;
