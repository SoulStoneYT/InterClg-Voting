import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import ElectionControl from "./admin/ElectionControl";

export default function Admin() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateParty, setNewCandidateParty] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch positions
  useEffect(() => {
    const loadData = async () => {
      try {
        const positionsSnapshot = await getDocs(collection(db, "positions"));
        const positionsList = positionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPositions(positionsList);

        const candidatesSnapshot = await getDocs(collection(db, "candidates"));
        const candidatesList = candidatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCandidates(candidatesList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    try {
      const positionsSnapshot = await getDocs(collection(db, "positions"));
      const positionsList = positionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPositions(positionsList);

      const candidatesSnapshot = await getDocs(collection(db, "candidates"));
      const candidatesList = candidatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCandidates(candidatesList);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleAddPosition = async () => {
    if (!newPositionTitle.trim()) {
      alert("Please enter a position title");
      return;
    }

    try {
      await addDoc(collection(db, "positions"), {
        title: newPositionTitle.trim(),
        isActive: true,
        createdAt: new Date()
      });
      setNewPositionTitle("");
      setShowPositionForm(false);
      refreshData();
    } catch (error) {
      console.error("Error adding position:", error);
      alert("Failed to add position");
    }
  };

  const handleTogglePosition = async (position) => {
    try {
      await updateDoc(doc(db, "positions", position.id), {
        isActive: !position.isActive
      });
      refreshData();
    } catch (error) {
      console.error("Error toggling position:", error);
    }
  };

  const handleDeletePosition = async (positionId) => {
    if (!window.confirm("Are you sure you want to delete this position?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "positions", positionId));
      refreshData();
    } catch (error) {
      console.error("Error deleting position:", error);
    }
  };

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
        createdAt: new Date()
      });
      setNewCandidateName("");
      setNewCandidateParty("");
      setSelectedPosition("");
      setShowCandidateForm(false);
      refreshData();
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
      refreshData();
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  const getCandidatesForPosition = (positionId) => {
    return candidates.filter(c => c.positionId === positionId);
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header Section */}
      <div style={{ maxWidth: "800px", margin: "0 auto 30px auto" }}>
        <h2>Admin Dashboard</h2>
        <p>You are logged in as Admin.</p>
        
        <button
          onClick={handleLogout}
          style={{
            padding: "12px 20px",
            fontSize: "14px",
            backgroundColor: "#26df1f",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      {/* Position Management Section */}
      <div style={{ maxWidth: "800px", margin: "0 auto 30px auto" }}>
        <div style={{ 
          border: "1px solid #ddd", 
          borderRadius: "8px", 
          padding: "20px",
          backgroundColor: "#000000"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>Positions</h3>
            <button
              onClick={() => setShowPositionForm(!showPositionForm)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              {showPositionForm ? "Cancel" : "+ Add Position"}
            </button>
          </div>

          {/* Add Position Form */}
          {showPositionForm && (
            <div style={{ 
              marginBottom: "20px", 
              padding: "15px", 
              backgroundColor: "#2f3136",
              border: "1px solid #ddd",
              borderRadius: "5px"
            }}>
              <input
                type="text"
                placeholder="Position Title (e.g., President, Vice President)"
                value={newPositionTitle}
                onChange={(e) => setNewPositionTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  marginBottom: "10px",
                  boxSizing: "border-box"
                }}
                onKeyPress={(e) => e.key === "Enter" && handleAddPosition()}
              />
              <button
                onClick={handleAddPosition}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Add Position
              </button>
            </div>
          )}

          {/* Positions List */}
          {loading ? (
            <p>Loading positions...</p>
          ) : positions.length === 0 ? (
            <p style={{ color: "#666" }}>No positions created yet. Click "Add Position" to create one.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {positions.map((position) => (
                <div
                  key={position.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 15px",
                    backgroundColor: "#000000",
                    border: "1px solid #ddd",
                    borderRadius: "5px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "3px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor: position.isActive ? "#d4edda" : "#f8d7da",
                      color: position.isActive ? "#155724" : "#721c24"
                    }}>
                      {position.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <span style={{ fontWeight: "500" }}>{position.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleTogglePosition(position)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: position.isActive ? "#ffc107" : "#28a745",
                        color: position.isActive ? "#212529" : "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer"
                      }}
                    >
                      {position.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeletePosition(position.id)}
                      style={{
                        padding: "6px 12px",
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Candidate Management Section */}
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
          {loading ? (
            <p>Loading candidates...</p>
          ) : candidates.length === 0 ? (
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

      {/* Election Control Panel - Integrated Directly */}
      <ElectionControl />
    </div>
  );
}
