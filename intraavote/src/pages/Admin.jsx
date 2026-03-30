import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import ElectionControl from "./admin/ElectionControl";
import ElectionTimer from "../components/ElectionTimer";
import CandidateManagement from "./admin/CandidateManagement";
import LiveVoteStats from "../components/LiveVoteStats";

export default function Admin() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [showPositionForm, setShowPositionForm] = useState(false);
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

  return (
    <div className="admin-page">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Dashboard</h2>
          <p>You are logged in as Admin.</p>
          <div className="admin-panel-topline">
            <ElectionTimer />
            <button className="admin-btn primary" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <section className="admin-section">
          <div className="admin-section-header">
            <h3 className="admin-section-title">Positions</h3>
            <button className="admin-btn primary" onClick={() => setShowPositionForm(!showPositionForm)}>
              {showPositionForm ? "Cancel" : "+ Add Position"}
            </button>
          </div>

          {showPositionForm && (
            <div className="admin-card">
              <div className="admin-form">
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Position Title (e.g., President, Vice President)"
                  value={newPositionTitle}
                  onChange={(e) => setNewPositionTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPosition()}
                />
                <button className="admin-btn secondary" onClick={handleAddPosition}>Add Position</button>
              </div>
            </div>
          )}

          {loading ? (
            <p>Loading positions...</p>
          ) : positions.length === 0 ? (
            <p style={{ color: "#566b87" }}>No positions created yet. Click "+ Add Position" to create one.</p>
          ) : (
            <div className="admin-list">
              {positions.map((position) => (
                <div key={position.id} className="admin-list-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <span className={`admin-badge ${position.isActive ? "active" : "inactive"}`}>
                      {position.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <span className="item-title">{position.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      className={position.isActive ? "admin-btn tertiary" : "admin-btn secondary"}
                      onClick={() => handleTogglePosition(position)}
                    >
                      {position.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="admin-btn danger" onClick={() => handleDeletePosition(position.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <CandidateManagement 
        positions={positions} 
        candidates={candidates}
        onRefresh={refreshData}
      />

      <LiveVoteStats positions={positions} candidates={candidates} />

      <ElectionControl />
    </div>
  );
}
