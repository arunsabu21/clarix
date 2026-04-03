import { Navigate } from "react-router-dom";
import { useAuthGlobal } from "../context/AuthContext";
function ProtectedRoute({ children }) {
    const { user, loading } = useAuthGlobal();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;