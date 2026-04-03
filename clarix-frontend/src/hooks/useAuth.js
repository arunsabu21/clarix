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
    } catch {
      setGlobalError("Failed to send OTP. Try again.");
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
    } catch {
      setGlobalError("Incorrect code. Please try again.");
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