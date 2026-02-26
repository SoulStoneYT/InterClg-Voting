import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function StartVoting() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        navigate("/");
        return;
      }

      const data = docSnap.data();
      
      // Redirect if already voted
      if (data.votingSessionCompleted === true) {
        navigate("/already-voted");
        return;
      }
      
      // Redirect if already started voting
      if (data.votingSessionStarted === true) {
        navigate("/voting-session");
        return;
      }
      
      // Redirect if profile not complete
      if (!data.department || !data.year || !data.dob) {
        navigate("/complete-profile");
        return;
      }
    };

    checkUserStatus();
  }, [navigate]);

  const handleStartVoting = async () => {
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      
      await updateDoc(docRef, {
        votingSessionStarted: true,
        sessionStartTime: serverTimestamp()
      });

      navigate("/voting-session");
    } catch (error) {
      console.error("Error starting voting session:", error);
      alert("Failed to start voting session. Please try again.");
      setLoading(false);
    }
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
      <h2>Ready to Vote?</h2>
      <p style={{ fontSize: "18px", marginBottom: "30px" }}>
        Click Start to Begin Voting.<br />
        You will have 10 minutes to complete your ballot.
      </p>

      <button 
        onClick={handleStartVoting}
        disabled={loading}
        style={{ 
          padding: "15px 40px", 
          fontSize: "18px",
          backgroundColor: "#4CAF50", 
          color: "white",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "Starting..." : "Start Voting"}
      </button>
    </div>
  );
}
