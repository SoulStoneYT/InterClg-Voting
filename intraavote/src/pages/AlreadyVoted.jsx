import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AlreadyVoted() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      textAlign: "center",
      padding: "20px"
    }}>
      <h2>You have already voted.</h2>
      <p>Please wait for results.</p>
      
      <button
        onClick={handleLogout}
        style={{
          marginTop: "30px",
          padding: "12px 20px",
          fontSize: "14px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        [TEMP] Logout
      </button>
    </div>
  );
}
