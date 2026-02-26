import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Vote() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Voting Dashboard</h2>
      <p>Select a position and cast your vote.</p>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => navigate("/positions")}
          style={{ marginRight: "10px" }}
        >
          Go to Voting
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}