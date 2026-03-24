import { useState } from "react";
import { db } from "../../firebase";
import { addDoc, deleteDoc, doc } from "firebase/firestore";
import { collection } from "firebase/firestore";

export default function CandidateManagement({ positions, candidates, onRefresh }) {
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateParty, setNewCandidateParty] = useState("");
  const [newCandidatePhoto, setNewCandidatePhoto] = useState("");
  const [newCandidateMotto, setNewCandidateMotto] = useState("");

  const handleAddCandidate = async () => {
    if (!selectedPosition) {
      alert("Please select a position");
      return;
    }
    if (!newCandidateName.trim()) {
      alert("Please enter a candidate name");
      return;
    }

    try {
      await addDoc(collection(db, "candidates"), {
        positionId: selectedPosition,
        name: newCandidateName.trim(),
        party: newCandidateParty.trim(),
        photo: newCandidatePhoto.trim(),
        motto: newCandidateMotto.trim(),
        createdAt: new Date()
      });
      setNewCandidateName("");
      setNewCandidateParty("");
      setNewCandidatePhoto("");
      setNewCandidateMotto("");
      setSelectedPosition("");
      setShowCandidateForm(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error adding candidate:", error);
      alert("Failed to add candidate");
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "candidates", candidateId));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  const getCandidatesForPosition = (positionId) => {
    return candidates.filter(c => c.positionId === positionId);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto 30px auto" }}>
      <div style={{ 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        padding: "20px",
        backgroundColor: "#000000"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0 }}>Candidates</h3>
          <button
            onClick={() => setShowCandidateForm(!showCandidateForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            {showCandidateForm ? "Cancel" : "+ Add Candidate"}
          </button>
        </div>

        {/* Add Candidate Form */}
        {showCandidateForm && (
          <div style={{ 
            marginBottom: "20px", 
            padding: "15px", 
            backgroundColor: "#000000",
            border: "1px solid #ddd",
            borderRadius: "5px"
          }}>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            >
              <option value="">Select Position</option>
              {positions.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.title}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Candidate Name"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            />
            <input
              type="text"
              placeholder="Party (Optional)"
              value={newCandidateParty}
              onChange={(e) => setNewCandidateParty(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            />
            <input
              type="url"
              placeholder="Cloudinary Photo URL (Optional)"
              value={newCandidatePhoto}
              onChange={(e) => setNewCandidatePhoto(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            />
            <textarea
              placeholder="Candidate Motto / Info for card back (Optional)"
              value={newCandidateMotto}
              onChange={(e) => setNewCandidateMotto(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                marginBottom: "10px",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit"
              }}
            />
            <button
              onClick={handleAddCandidate}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Add Candidate
            </button>
          </div>
        )}

        {/* Candidates List Grouped by Position */}
        {candidates.length === 0 ? (
          <p style={{ color: "#666" }}>No candidates created yet. Click "Add Candidate" to create one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {positions.map((position) => {
              const positionCandidates = getCandidatesForPosition(position.id);
              if (positionCandidates.length === 0) return null;
              
              return (
                <div key={position.id}>
                  <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>{position.title}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {positionCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 15px",
                          backgroundColor: "#000000",
                          border: "1px solid #ddd",
                          borderRadius: "5px"
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: "500" }}>{candidate.name}</span>
                          {candidate.party && (
                            <span style={{ marginLeft: "10px", color: "#666", fontSize: "14px" }}>
                              ({candidate.party})
                            </span>
                          )}
                          {candidate.motto && (
                            <p style={{ margin: "6px 0 0", color: "#888", fontSize: "12px" }}>
                              Motto: {candidate.motto}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteCandidate(candidate.id)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}