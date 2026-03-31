import { useState } from "react";
import { db } from "../../firebase";
import { addDoc, deleteDoc, doc } from "firebase/firestore";
import { collection } from "firebase/firestore";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";

export default function CandidateManagement({ positions, candidates, onRefresh }) {
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateParty, setNewCandidateParty] = useState("");
  const [newCandidatePhoto, setNewCandidatePhoto] = useState("");
  const [newCandidateMotto, setNewCandidateMotto] = useState("");
  const { showNotification } = useNotification();
  const { showConfirm } = useConfirm();

  const handleAddCandidate = async () => {
    if (!selectedPosition) {
      showNotification("Please select a position", "warning");
      return;
    }
    if (!newCandidateName.trim()) {
      showNotification("Please enter a candidate name", "warning");
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
      showNotification("Failed to add candidate", "error");
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    const confirmed = await showConfirm("Are you sure you want to delete this candidate?", {
      title: "Delete Candidate",
      confirmText: "Delete"
    });

    if (!confirmed) {
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
    <section className="admin-section">
      <div className="admin-card">
        <div className="admin-section-header">
          <h3 style={{ margin: 0 }}>Candidates</h3>
          <button className="admin-btn primary" onClick={() => setShowCandidateForm(!showCandidateForm)}>
            {showCandidateForm ? "Cancel" : "+ Add Candidate"}
          </button>
        </div>

        {showCandidateForm && (
          <div className="admin-card admin-form">
            <select
              className="admin-select"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">Select Position</option>
              {positions.map(pos => (
                <option key={pos.id} value={pos.id}>{pos.title}</option>
              ))}
            </select>
            <input
              className="admin-input"
              type="text"
              placeholder="Candidate Name"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
            />
            <input
              className="admin-input"
              type="text"
              placeholder="Party (Optional)"
              value={newCandidateParty}
              onChange={(e) => setNewCandidateParty(e.target.value)}
            />
            <input
              className="admin-input"
              type="url"
              placeholder="Cloudinary Photo URL (Optional)"
              value={newCandidatePhoto}
              onChange={(e) => setNewCandidatePhoto(e.target.value)}
            />
            <textarea
              className="admin-textarea"
              placeholder="Candidate Motto / Info for card back (Optional)"
              value={newCandidateMotto}
              onChange={(e) => setNewCandidateMotto(e.target.value)}
            />
            <button className="admin-btn secondary" onClick={handleAddCandidate}>
              Add Candidate
            </button>
          </div>
        )}

        {candidates.length === 0 ? (
          <p style={{ color: "#566b87" }}>No candidates created yet. Click "+ Add Candidate" to create one.</p>
        ) : (
          <div className="admin-card">
            <div className="admin-list">
              {positions.map((position) => {
                const positionCandidates = getCandidatesForPosition(position.id);
                if (positionCandidates.length === 0) return null;

                return (
                  <div key={position.id}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#0f2640" }}>{position.title}</h4>
                    <div className="admin-list">
                      {positionCandidates.map((candidate) => (
                        <div key={candidate.id} className="admin-list-item">
                          <div>
                            <span className="item-title">{candidate.name}</span>
                            {candidate.party && (
                              <span style={{ marginLeft: "0.85rem", color: "#6b7a92", fontSize: "0.95rem" }}>
                                ({candidate.party})
                              </span>
                            )}
                            {candidate.motto && (
                              <p style={{ margin: "0.55rem 0 0", color: "#6b7a92", fontSize: "0.88rem" }}>
                                Motto: {candidate.motto}
                              </p>
                            )}
                          </div>
                          <button className="admin-btn danger" onClick={() => handleDeleteCandidate(candidate.id)}>
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}