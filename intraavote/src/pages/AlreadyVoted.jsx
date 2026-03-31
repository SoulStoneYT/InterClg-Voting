import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

export default function AlreadyVoted() {
  const navigate = useNavigate();
  const [resultsPublished, setResultsPublished] = useState(false);

  useEffect(() => {
    const checkResults = async () => {
      try {
        const electionDocRef = doc(db, "settings", "election");
        const electionDocSnap = await getDoc(electionDocRef);

        if (electionDocSnap.exists()) {
          setResultsPublished(electionDocSnap.data().resultsPublished === true);
        }
      } catch (error) {
        console.error("Failed to check results status:", error);
      }
    };

    checkResults();
  }, []);

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
      <p>{resultsPublished ? "Results are now available." : "Please wait for results."}</p>

      {resultsPublished && (
        <button
          onClick={() => navigate("/results")}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            fontSize: "14px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          View Results
        </button>
      )}
      
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
