import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ElectionTimer from "../components/ElectionTimer";

export default function StartVoting() {
  const [loading, setLoading] = useState(false);
  const [electionStatus, setElectionStatus] = useState(null); // eslint-disable-line no-unused-vars
  const [checkingStatus, setCheckingStatus] = useState(true); // eslint-disable-line no-unused-vars
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeElection = null;

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

      // Listen to election status in real-time
      const electionDocRef = doc(db, "settings", "election");
      unsubscribeElection = onSnapshot(
        electionDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const electionData = docSnap.data();
            setElectionStatus(electionData.electionStatus || "not_started");
          } else {
            setElectionStatus("not_started");
          }
          setCheckingStatus(false);
        },
        (error) => {
          console.error("Error listening to election status:", error);
          setElectionStatus("not_started");
          setCheckingStatus(false);
        }
      );
    };

    checkUserStatus();

    return () => {
      if (unsubscribeElection) {
        unsubscribeElection();
      }
    };
  }, [navigate]);

  const handleStartVoting = async () => {
    // Check if election is active before allowing to start
    if (electionStatus !== "active") {
      alert("Voting is not currently active. Please wait for the admin to start the election.");
      return;
    }

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

  const getStatusMessage = () => {
    if (checkingStatus) return null;
    
    switch (electionStatus) {
      case "active":
        return { color: "#28a745", bg: "#d4edda", text: "✅ Election is ACTIVE - You can start voting!" };
      case "paused":
        return { color: "#ffc107", bg: "#fff3cd", text: "⏸️ Election is PAUSED - Voting is temporarily disabled" };
      case "ended":
        return { color: "#dc3545", bg: "#f8d7da", text: "❌ Election has ENDED - Voting is closed" };
      default:
        return { color: "#6c757d", bg: "#f8f9fa", text: "⚪ Election has NOT STARTED - Please wait" };
    }
  };

  const statusInfo = getStatusMessage();
  const canVote = electionStatus === "active" && !loading;

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
      {/* Main Election Timer */}
      <div style={{ marginBottom: "20px" }}>
        <ElectionTimer />
      </div>
      
      <h2>Ready to Vote?</h2>
      <p style={{ fontSize: "18px", marginBottom: "30px" }}>
        Click Start to Begin Voting.<br />
        You will have 10 minutes to complete your ballot.
      </p>

      {statusInfo && (
        <div style={{
          color: statusInfo.color,
          backgroundColor: statusInfo.bg,
          padding: "12px 20px",
          borderRadius: "5px",
          marginBottom: "20px",
          border: `1px solid ${statusInfo.color}`,
          fontWeight: "500"
        }}>
          {statusInfo.text}
        </div>
      )}

      <button 
        onClick={handleStartVoting}
        disabled={!canVote}
        style={{ 
          padding: "15px 40px", 
          fontSize: "18px",
          backgroundColor: canVote ? "#4CAF50" : "#cccccc", 
          color: canVote ? "white" : "#666666",
          border: "none",
          cursor: canVote ? "pointer" : "not-allowed",
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "Starting..." : "Start Voting"}
      </button>
    </div>
  );
}
