import api from "./api";

export const requestOTP = (email, name = "") =>
  api.post("/auth/request-otp/", { email, name });

export const verifyOTP = (email, otp) =>
  api.post("/auth/verify-otp/", { email, otp });

export const logout = () => {
  const refresh = localStorage.getItem("refresh_token");
  return api.post("/auth/logout/", { refresh });
};

export const getMe = () => api.get("/auth/me/");
