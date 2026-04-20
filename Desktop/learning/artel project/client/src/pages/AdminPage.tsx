import { Navigate } from "react-router-dom";

/** תאימות לאחור: כתובת זו מפנה למרכז הניהול המאוחד. */
export default function AdminPage() {
  return <Navigate to="/admin" replace />;
}
