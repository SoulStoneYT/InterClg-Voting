import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Design"
];

const years = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year"
];

export default function CompleteProfile() {
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Redirect if profile is already complete
        if (data.votingSessionStarted === false && 
            data.votingSessionCompleted === false &&
            data.department && data.year && data.dob) {
          navigate("/start-voting");
          return;
        }
      }
      setLoading(false);
    };

    checkUserProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!department || !year || !dob) {
      alert("Please fill all fields");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      
      // Convert date string to Firestore Timestamp
      const dobTimestamp = new Date(dob);
      
      await updateDoc(docRef, {
        department: department,
        year: year,
        dob: dobTimestamp,
        votingSessionStarted: false,
        votingSessionCompleted: false,
        sessionStartTime: null,
        votedPositions: []
      });

      navigate("/start-voting");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{ 
      maxWidth: "400px", 
      margin: "50px auto", 
      padding: "20px",
      textAlign: "center"
    }}>
      <h2>Complete Your Profile</h2>
      <p>Please provide your details to proceed with voting.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Department</label>
          <select 
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Year</label>
          <select 
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select Year</option>
            {years.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Date of Birth</label>
          <input 
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <button 
          type="submit"
          style={{ 
            width: "100%", 
            padding: "12px", 
            backgroundColor: "#4CAF50", 
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Submit & Continue
        </button>
      </form>
    </div>
  );
}
