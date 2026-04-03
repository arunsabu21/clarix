import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!original || original._retry) {
      return Promise.reject(error);
    }

    if (original.url?.includes("/auth/token/refresh/")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      original._retry = true;

      try {
        const refresh = localStorage.getItem("refresh_token");

        if (!refresh) {
          throw new Error("No refresh token");
        }

        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;

        localStorage.setItem("access_token", newAccess);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;

        return api(original);
      } catch (err) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.replace("/login");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
