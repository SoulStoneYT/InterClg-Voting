import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const TOTAL_TIME = 600; // 10 minutes in seconds

export default function VotingSession() {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(TOTAL_TIME);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Prevent browser back navigation
  useEffect(() => {
    const preventBack = (e) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);
    return () => window.removeEventListener("popstate", preventBack);
  }, []);

  // Check user status and load positions
  useEffect(() => {
    const initializeSession = async () => {
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
      setUserData(data);

      // Security checks
      if (data.role === "admin") {
        navigate("/admin");
        return;
      }

      if (data.votingSessionCompleted === true) {
        navigate("/already-voted");
        return;
      }

      if (data.votingSessionStarted !== true) {
        navigate("/start-voting");
        return;
      }

      // Calculate remaining time
      if (data.sessionStartTime) {
        const startTime = data.sessionStartTime.toDate ? data.sessionStartTime.toDate() : new Date(data.sessionStartTime);
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const remaining = TOTAL_TIME - elapsed;

        if (remaining <= 0) {
          // Time expired
          await updateDoc(docRef, {
            votingSessionCompleted: true
          });
          navigate("/already-voted");
          return;
        }

        setRemainingTime(remaining);
      }

      // Fetch active positions
      const positionsQuery = query(collection(db, "positions"), where("isActive", "==", true));
      const positionsSnapshot = await getDocs(positionsQuery);
      
      const positionsData = positionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out already voted positions
      const votedPositions = data.votedPositions || [];
      const remainingPositions = positionsData.filter(p => !votedPositions.includes(p.id));
      
      setPositions(remainingPositions);
      setLoading(false);
    };

    initializeSession();
  }, [navigate]);

  // Fetch candidates for current position
  useEffect(() => {
    const fetchCandidates = async () => {
      if (positions.length === 0) return;

      const currentPosition = positions[currentIndex];
      if (!currentPosition) return;

      const candidatesQuery = query(
        collection(db, "candidates"), 
        where("positionId", "==", currentPosition.id)
      );
      const candidatesSnapshot = await getDocs(candidatesQuery);
      
      const candidatesData = candidatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCandidates(candidatesData);
    };

    fetchCandidates();
  }, [currentIndex, positions]);

  // Timer countdown
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(async () => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time expired - mark as completed
          const completeVoting = async () => {
            const user = auth.currentUser;
            if (user) {
              const docRef = doc(db, "users", user.uid);
              await updateDoc(docRef, {
                votingSessionCompleted: true
              });
            }
            navigate("/already-voted");
          };
          completeVoting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, navigate]);

  const handleVote = useCallback(async (candidateId) => {
    if (voting || positions.length === 0) return;
    
    setVoting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const currentPosition = positions[currentIndex];
      
      // Save vote to votes collection
      await addDoc(collection(db, "votes"), {
        positionId: currentPosition.id,
        candidateId: candidateId,
        userId: user.uid,
        timestamp: new Date()
      });

      // Update user's votedPositions
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const currentVotedPositions = userDoc.data().votedPositions || [];
      
      await updateDoc(userDocRef, {
        votedPositions: [...currentVotedPositions, currentPosition.id]
      });

      // Move to next position or complete
      if (currentIndex < positions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setVoting(false);
      } else {
        // All positions voted
        await updateDoc(userDocRef, {
          votingSessionCompleted: true
        });
        navigate("/already-voted");
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Failed to cast vote. Please try again.");
      setVoting(false);
    }
  }, [voting, positions, currentIndex, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  if (positions.length === 0) {
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
        <h2>No Active Positions</h2>
        <p>There are no active positions to vote for at this time.</p>
      </div>
    );
  }

  const currentPosition = positions[currentIndex];
  const progress = ((currentIndex) / positions.length) * 100;

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      {/* Timer Display */}
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: remainingTime <= 60 ? "#f44336" : "#2196F3",
        color: "white",
        padding: "10px",
        textAlign: "center",
        fontSize: "20px",
        fontWeight: "bold",
        zIndex: 1000
      }}>
        Time Remaining: {formatTime(remainingTime)}
      </div>

      {/* Progress Bar */}
      <div style={{ 
        position: "fixed", 
        top: "45px", 
        left: 0, 
        right: 0, 
        height: "5px", 
        backgroundColor: "#ddd",
        zIndex: 999 
      }}>
        <div style={{ 
          height: "100%", 
          width: `${progress}%`, 
          backgroundColor: "#4CAF50",
          transition: "width 0.3s"
        }} />
      </div>

      <div style={{ marginTop: "100px", maxWidth: "600px", margin: "100px auto 20px" }}>
        {/* Position Name at Top */}
        <div style={{ textAlign: "center", marginBottom: "30px", paddingTop: "10px" }}>
          <h2 style={{ margin: 0 }}>{currentPosition?.title}</h2>
        </div>

        {/* Candidates List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {candidates.map((candidate) => (
            <div 
              key={candidate.id}
              style={{ 
                border: "1px solid #ddd", 
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{candidate.name}</h3>
                {candidate.party && (
                  <p style={{ margin: "5px 0 0 0", color: "#666" }}>
                    {candidate.party}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleVote(candidate.id)}
                disabled={voting}
                style={{ 
                  padding: "10px 25px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: voting ? "not-allowed" : "pointer",
                  opacity: voting ? 0.7 : 1,
                  fontSize: "16px"
                }}
              >
                Vote
              </button>
            </div>
          ))}
        </div>

        {/* Position Counter at Bottom */}
        <div style={{ textAlign: "center", marginTop: "30px", color: "#666" }}>
          Position {currentIndex + 1} / {positions.length}
        </div>
      </div>
    </div>
  );
}
