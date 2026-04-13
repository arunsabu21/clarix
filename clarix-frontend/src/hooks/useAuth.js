import { useState } from "react";
import { requestOTP, verifyOTP } from "../services/auth";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const clearError = () => setGlobalError("");

  const requestOtpHandler = async (email) => {
    clearError();

    try {
      setLoading(true);
      await requestOTP(email);
      return true;
    } catch (err) {
      const message = 
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Unable to send OTP to this email address. Please check your internet connection and try again."
      setGlobalError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpHandler = async (email, otp) => {
    clearError();

    try {
      setLoading(true);
      const res = await verifyOTP(email, otp);
      return res.data;
    } catch (err) {
      const message = 
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Incorrect code. Please try again."
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    globalError,
    setGlobalError,
    requestOtpHandler,
    verifyOtpHandler,
  };
}
