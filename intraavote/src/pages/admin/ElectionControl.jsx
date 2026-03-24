import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import {
  startElection,
  pauseElection,
  resumeElection,
  endElection,
  resetElection,
  initElectionSettings,
  publishResults,
  ELECTION_DURATION_SECONDS
} from "../../services/electionService";
import ElectionTimer from "../../components/ElectionTimer";

export default function ElectionControl() {
  const [electionStatus, setElectionStatus] = useState("not_started");
  const [electionEndTime, setElectionEndTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [resultsPublished, setResultsPublished] = useState(false);

  // Initialize settings and subscribe to real-time updates
  useEffect(() => {
    const initializeAndSubscribe = async () => {
      try {
        // Initialize the election settings document if it doesn't exist
        await initElectionSettings();

        // Subscribe to real-time updates
        const electionDocRef = doc(db, "settings", "election");
        const unsubscribe = onSnapshot(electionDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setElectionStatus(data.electionStatus);
            setResultsPublished(data.resultsPublished || false);
            
            if (data.electionEndTime) {
              const endTime = typeof data.electionEndTime === 'string' 
                ? new Date(data.electionEndTime) 
                : data.electionEndTime.toDate ? data.electionEndTime.toDate() : new Date(data.electionEndTime);
              setElectionEndTime(endTime);
            }
            
            // Auto-end election if time has expired
            if (data.electionStatus === "active" && data.electionEndTime) {
              const now = new Date();
              const endTimeDate = typeof data.electionEndTime === 'string' 
                ? new Date(data.electionEndTime) 
                : data.electionEndTime.toDate ? data.electionEndTime.toDate() : new Date(data.electionEndTime);
              
              if (now >= endTimeDate) {
                await endElection();
              }
            }
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error initializing election:", err);
        setError("Failed to load election status");
        setLoading(false);
      }
    };

    initializeAndSubscribe();
  }, []);

  const handleStart = async () => {
    setProcessing(true);
    setError("");
    try {
      await startElection();
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handlePause = async () => {
    setProcessing(true);
    setError("");
    try {
      await pauseElection();
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handleResume = async () => {
    setProcessing(true);
    setError("");
    try {
      await resumeElection();
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handleEnd = async () => {
    if (!window.confirm("Are you sure you want to end the election? This action cannot be undone.")) {
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await endElection();
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset the election? This will clear all timing data.")) {
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await resetElection();
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handlePublishResults = async () => {
    if (!window.confirm("Are you sure you want to publish the results? This will make them visible to all voters.")) {
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await publishResults();
      setResultsPublished(true);
      alert("Results published successfully!");
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const getStatusBadge = () => {
    const statusConfig = {
      not_started: { color: "#6c757d", bg: "#f8f9fa", text: "NOT STARTED" },
      active: { color: "#28a745", bg: "#d4edda", text: "ACTIVE" },
      paused: { color: "#ffc107", bg: "#fff3cd", text: "PAUSED" },
      ended: { color: "#dc3545", bg: "#f8d7da", text: "ENDED" }
    };

    const config = statusConfig[electionStatus] || statusConfig.not_started;

    return (
      <span style={{
        color: config.color,
        backgroundColor: config.bg,
        padding: "8px 16px",
        borderRadius: "4px",
        fontWeight: "bold",
        fontSize: "14px",
        border: `1px solid ${config.color}`
      }}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading election status...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h2>Election Control Panel</h2>
        <p>Manage the election status and voting accessibility</p>
      </div>

      {/* Status Display */}
      <div style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "30px",
        backgroundColor: "#000000"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Current Status</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
          <span style={{ fontSize: "18px", fontWeight: "500" }}>Election:</span>
          {getStatusBadge()}
        </div>
        
        {/* Main Election Timer */}
        <div style={{ marginTop: "15px" }}>
          <ElectionTimer />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          color: "#dc3545",
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
          padding: "12px",
          marginBottom: "20px"
        }}>
          {error}
        </div>
      )}

      {/* Control Buttons */}
      <div style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px"
      }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Control Actions</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {/* Start Button */}
          {electionStatus === "not_started" && (
            <button
              onClick={handleStart}
              disabled={processing}
              style={{
                padding: "15px 25px",
                fontSize: "16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.7 : 1
              }}
            >
              {processing ? "Processing..." : "Start Election"}
            </button>
          )}

          {/* Pause/Resume Buttons */}
          {electionStatus === "active" && (
            <button
              onClick={handlePause}
              disabled={processing}
              style={{
                padding: "15px 25px",
                fontSize: "16px",
                backgroundColor: "#ffc107",
                color: "#212529",
                border: "none",
                borderRadius: "5px",
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.7 : 1
              }}
            >
              {processing ? "Processing..." : "Pause Election"}
            </button>
          )}

          {electionStatus === "paused" && (
            <button
              onClick={handleResume}
              disabled={processing}
              style={{
                padding: "15px 25px",
                fontSize: "16px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.7 : 1
              }}
            >
              {processing ? "Processing..." : "Resume Election"}
            </button>
          )}

          {/* End Button */}
          {(electionStatus === "active" || electionStatus === "paused") && (
            <button
              onClick={handleEnd}
              disabled={processing}
              style={{
                padding: "15px 25px",
                fontSize: "16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.7 : 1
              }}
            >
              {processing ? "Processing..." : "End Election"}
            </button>
          )}

          {/* Reset Button - Only for ended elections */}
          {electionStatus === "ended" && (
            <>
              <button
                onClick={handlePublishResults}
                disabled={processing || resultsPublished}
                style={{
                  padding: "15px 25px",
                  fontSize: "16px",
                  backgroundColor: resultsPublished ? "#28a745" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing ? 0.7 : 1
                }}
              >
                {resultsPublished ? "✓ Results Published" : "Publish Results"}
              </button>
              <button
                onClick={handleReset}
                disabled={processing}
                style={{
                  padding: "15px 25px",
                  fontSize: "16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing ? 0.7 : 1
                }}
              >
                {processing ? "Processing..." : "Reset Election"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Info */}
      <div style={{
        marginTop: "30px",
        padding: "15px",
        backgroundColor: "#e7f3ff",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#495057"
      }}>
        <strong>Status Guide:</strong>
        <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
          <li><strong>NOT STARTED</strong> - Voters cannot start voting</li>
          <li><strong>ACTIVE</strong> - Voters can start and complete voting</li>
          <li><strong>PAUSED</strong> - Voting is temporarily disabled</li>
          <li><strong>ENDED</strong> - Voting is closed permanently</li>
        </ul>
      </div>
    </div>
  );
}
