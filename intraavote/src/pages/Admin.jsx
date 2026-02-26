import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      <p>You are logged in as Admin.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
