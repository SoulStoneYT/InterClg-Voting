import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function ElectionTimer({ compact = false, showLabel = true }) {
  const [electionEndTime, setElectionEndTime] = useState(null);
  const [electionStatus, setElectionStatus] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const electionDocRef = doc(db, "settings", "election");
    const unsubscribe = onSnapshot(
      electionDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setElectionStatus(data.electionStatus);

          if (data.electionEndTime) {
            // Handle both string and Date formats
            const endTime = typeof data.electionEndTime === 'string' 
              ? new Date(data.electionEndTime) 
              : data.electionEndTime.toDate();
            setElectionEndTime(endTime);
          } else {
            setElectionEndTime(null);
          }
        }
      },
      (error) => {
        if (error.code !== "permission-denied" && error.code !== "unavailable" && error.code !== "network-request-failed") {
          console.error("ElectionTimer Firestore snapshot error:", error);
        }
        setElectionStatus(null);
        setElectionEndTime(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update timer tick while election is active
  useEffect(() => {
    if (!electionEndTime || electionStatus !== "active") {
      return;
    }

    const interval = setInterval(() => setTick(Date.now()), 1000);
    
    return () => clearInterval(interval);
  }, [electionEndTime, electionStatus]);

  const remainingSeconds = useMemo(() => {
    if (!electionEndTime || electionStatus !== "active") {
      return null;
    }

    const diff = Math.floor((electionEndTime.getTime() - tick) / 1000);
    return diff <= 0 ? 0 : diff;
  }, [electionEndTime, electionStatus, tick]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--:--";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't show if election not active
  if (electionStatus !== "active" || remainingSeconds === null) {
    return null;
  }

  // Determine color based on remaining time
  let bgColor = "#28a745"; // green - more than 30 min
  if (remainingSeconds <= 600) { // 10 min
    bgColor = "#dc3545"; // red
  } else if (remainingSeconds <= 1800) { // 30 min
    bgColor = "#ffc107"; // yellow
  }

  if (compact) {
    return (
      <div style={{
        backgroundColor: bgColor,
        color: remainingSeconds <= 1800 ? "#212529" : "white",
        padding: "8px 16px",
        borderRadius: "5px",
        fontWeight: "bold",
        fontSize: "14px",
        display: "inline-block"
      }}>
        ⏱️ {formatTime(remainingSeconds)}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: bgColor,
      color: remainingSeconds <= 1800 ? "#212529" : "white",
      padding: "15px 20px",
      borderRadius: "8px",
      textAlign: "center",
      fontWeight: "bold"
    }}>
      {showLabel && (
        <div style={{ fontSize: "14px", marginBottom: "5px", opacity: 0.9 }}>
          MAIN ELECTION TIMER
        </div>
      )}
      <div style={{ fontSize: "28px" }}>
        {formatTime(remainingSeconds)}
      </div>
      {remainingSeconds <= 300 && remainingSeconds > 0 && (
        <div style={{ fontSize: "12px", marginTop: "5px", opacity: 0.9 }}>
          ⚠️ Less than 5 minutes remaining!
        </div>
      )}
    </div>
  );
}
