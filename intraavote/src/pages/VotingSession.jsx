import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ElectionTimer from "../components/ElectionTimer";
import CandidateCard from "../components/CandidateCard";
import useNotification from "../hooks/useNotification";

const TOTAL_TIME = 600; // 10 minutes in seconds

export default function VotingSession() {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(TOTAL_TIME);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

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

  // Subscribe to election status changes in real-time
  useEffect(() => {
    const electionDocRef = doc(db, "settings", "election");
    const unsubscribe = onSnapshot(electionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const status = docSnap.data().electionStatus;
        
        // Handle pause immediately
        if (status === "paused") {
          setIsPaused(true);
        } else if (status === "active") {
          setIsPaused(false);
        }
        
        // Handle end - but don't redirect immediately, let voters finish
        if (status === "ended") {
          setIsEnded(true);
          // Don't set isPaused - voters should still be able to vote until timer expires
        }
      }
    });

    return () => unsubscribe();
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

  // Timer countdown - pauses when election is paused
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(async () => {
      // Skip countdown if paused
      if (isPaused) return;

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
  }, [loading, navigate, isPaused]);

  const handleVote = useCallback(async (candidateId) => {
    // Block voting only if paused (voting is allowed when ended until timer expires)
    if (voting || positions.length === 0 || isPaused) return;
    
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
      showNotification("Failed to cast vote. Please try again.", "error");
      setVoting(false);
    }
  }, [voting, positions, currentIndex, navigate, isPaused, showNotification]);

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

  // Disable voting only when paused (voting is allowed when ended until timer expires)
  const canVote = !isPaused;

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      {/* Pause Banner - Shows when election is paused */}
      {isPaused && !isEnded && (
        <div style={{
          position: "fixed",
          top: "90px",
          left: 0,
          right: 0,
          backgroundColor: "#ffc107",
          color: "#212529",
          padding: "15px",
          textAlign: "center",
          fontSize: "18px",
          fontWeight: "bold",
          zIndex: 998
        }}>
          ⏸️ VOTING HAS BEEN PAUSED - You cannot vote right now. Please wait for the admin to resume.
        </div>
      )}

      {/* Election Ended Banner - Shows when election has ended */}
      {isEnded && (
        <div style={{
          position: "fixed",
          top: "50px",
          left: 0,
          right: 0,
          backgroundColor: "#fd7e14",
          color: "white",
          padding: "15px",
          textAlign: "center",
          fontSize: "16px",
          fontWeight: "bold",
          zIndex: 998
        }}>
          ⚠️ Election has ENDED - You can complete your current votes until your timer expires. No new votes will be accepted.
        </div>
      )}

      {/* Main Election Timer - visible to everyone */}
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: "#2196F3",
        color: "white",
        padding: "10px",
        textAlign: "center",
        fontSize: "18px",
        fontWeight: "bold",
        zIndex: 1000
      }}>
        <ElectionTimer compact />
      </div>

      {/* Individual Timer Display */}
      <div style={{ 
        position: "fixed", 
        top: "50px", 
        left: 0, 
        right: 0, 
        backgroundColor: remainingTime <= 60 ? "#f44336" : "#4CAF50",
        color: "white",
        padding: "8px",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "bold",
        zIndex: 999
      }}>
        Your Time: {formatTime(remainingTime)}
      </div>

      {/* Progress Bar */}
      <div style={{ 
        position: "fixed", 
        top: "80px", 
        left: 0, 
        right: 0, 
        height: "5px", 
        backgroundColor: "#ddd",
        zIndex: 998 
      }}>
        <div style={{ 
          height: "100%", 
          width: `${progress}%`, 
          backgroundColor: "#4CAF50",
          transition: "width 0.3s"
        }} />
      </div>

      <div style={{ marginTop: "100px", maxWidth: "1100px", margin: "100px auto 20px" }}>
        {/* Position Name at Top */}
        <div style={{ textAlign: "center", marginBottom: "30px", paddingTop: "10px" }}>
          <h2 style={{ margin: 0 }}>{currentPosition?.title}</h2>
        </div>

        {/* Candidates Cards */}
        <div className="candidate-grid" style={{ opacity: canVote ? 1 : 0.7 }}>
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onVote={handleVote}
              canVote={canVote}
              voting={voting}
            />
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
