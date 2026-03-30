import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  startElection,
  pauseElection,
  resumeElection,
  endElection,
  resetElection,
  initElectionSettings,
  publishResults,
  resetAllVotes,
  resetAllUserVotingStatus,
  fullTestingReset
} from "../../services/electionService";
import ElectionTimer from "../../components/ElectionTimer";

export default function ElectionControl() {
  const [electionStatus, setElectionStatus] = useState("not_started");
  const [, setElectionEndTime] = useState(null);
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

  const handleResetVotesOnly = async () => {
    if (!window.confirm("Reset all voting results? This will delete all votes for testing.")) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const { deletedVotes } = await resetAllVotes();
      alert(`Reset complete. Deleted ${deletedVotes} vote records.`);
    } catch (err) {
      setError(err.message || "Failed to reset voting results");
    }

    setProcessing(false);
  };

  const handleResetUserVotingOnly = async () => {
    if (!window.confirm("Reset all user voting status? This clears voted positions for every user.")) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const { resetUsers } = await resetAllUserVotingStatus();
      alert(`Reset complete. Cleared voting status for ${resetUsers} users.`);
    } catch (err) {
      setError(err.message || "Failed to reset user voting status");
    }

    setProcessing(false);
  };

  const handleFullTestingReset = async () => {
    if (!window.confirm("Run FULL TEST RESET? This will clear votes, reset all user voting status, and reset election state.")) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const { deletedVotes, resetUsers } = await fullTestingReset();
      setResultsPublished(false);
      alert(
        `Full reset complete. Deleted ${deletedVotes} votes and reset ${resetUsers} users. Election status set to NOT STARTED.`
      );
    } catch (err) {
      setError(err.message || "Failed to run full testing reset");
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
    <section className="admin-section">
      <div className="admin-section-header">
        <div>
          <h3 className="admin-section-title">Election Control Panel</h3>
          <p style={{ margin: "0.6rem 0 0", color: "#546c8d" }}>Manage the election status and voting accessibility</p>
        </div>
      </div>

      <div className="admin-card">
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
        <div className="admin-alert admin-alert--error">
          {error}
        </div>
      )}

      <div className="admin-card admin-panel-controls">
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Control Actions</h3>

        <div className="control-grid">
          {/* Start Button */}
          {electionStatus === "not_started" && (
            <button
              onClick={handleStart}
              disabled={processing}
              className="admin-btn primary"
            >
              {processing ? "Processing..." : "Start Election"}
            </button>
          )}

          {/* Pause/Resume Buttons */}
          {electionStatus === "active" && (
            <button
              onClick={handlePause}
              disabled={processing}
              className="admin-btn secondary"
            >
              {processing ? "Processing..." : "Pause Election"}
            </button>
          )}

          {electionStatus === "paused" && (
            <button
              onClick={handleResume}
              disabled={processing}
              className="admin-btn primary"
            >
              {processing ? "Processing..." : "Resume Election"}
            </button>
          )}

          {/* End Button */}
          {(electionStatus === "active" || electionStatus === "paused") && (
            <button
              onClick={handleEnd}
              disabled={processing}
              className="admin-btn danger"
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
                className="admin-btn primary"
              >
                {resultsPublished ? "✓ Results Published" : "Publish Results"}
              </button>
              <button
                onClick={handleReset}
                disabled={processing}
                className="admin-btn tertiary"
              >
                {processing ? "Processing..." : "Reset Election"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Testing Tools */}
      <div className="admin-card admin-card--warning">
        <h3 style={{ marginTop: 0, marginBottom: "10px", color: "#ffd36a" }}>
          🧪 Temporary Testing Tools
        </h3>
        <p style={{ marginTop: 0, marginBottom: "16px", fontSize: "14px", color: "#f8d89b" }}>
          Use these admin-only actions to quickly reset data while testing.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={handleResetVotesOnly}
            disabled={processing}
            className="admin-btn secondary"
          >
            {processing ? "Processing..." : "Reset Voting Results (Delete Votes)"}
          </button>

          <button
            onClick={handleResetUserVotingOnly}
            disabled={processing}
            className="admin-btn primary"
          >
            {processing ? "Processing..." : "Reset User Voting Status"}
          </button>

          <button
            onClick={handleFullTestingReset}
            disabled={processing}
            className="admin-btn danger"
          >
            {processing ? "Processing..." : "Full Testing Reset (Votes + Users + Election)"}
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className="admin-card admin-card--info">
        <strong>Status Guide:</strong>
        <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
          <li><strong>NOT STARTED</strong> - Voters cannot start voting</li>
          <li><strong>ACTIVE</strong> - Voters can start and complete voting</li>
          <li><strong>PAUSED</strong> - Voting is temporarily disabled</li>
          <li><strong>ENDED</strong> - Voting is closed permanently</li>
        </ul>
      </div>
    </section>
  );
}
