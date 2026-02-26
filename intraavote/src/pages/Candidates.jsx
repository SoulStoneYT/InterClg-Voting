import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

export default function Candidates() {
  const { id } = useParams(); // position id
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      const querySnapshot = await getDocs(collection(db, "candidates"));

      const list = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(candidate => candidate.positionId === id);

      setCandidates(list);
    };

    const checkIfVoted = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const votedPositions = userDoc.data().votedPositions || [];

        if (votedPositions.includes(id)) {
          setAlreadyVoted(true);
        }
      }
    };

    fetchCandidates();
    checkIfVoted();
  }, [id]);

  const handleVote = async (candidateId) => {
    const user = auth.currentUser;
    if (!user) return;

    if (alreadyVoted) {
      alert("You have already voted for this position.");
      return;
    }

    try {
      // Save vote
      await addDoc(collection(db, "votes"), {
        positionId: id,
        candidateId: candidateId,
        userId: user.uid,
        timestamp: new Date()
      });

      // Update user votedPositions
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const votedPositions = userDoc.data().votedPositions || [];

      await updateDoc(userRef, {
        votedPositions: [...votedPositions, id]
      });

      setAlreadyVoted(true);
      alert("Vote recorded successfully!");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Candidates for {id}</h2>

      <button onClick={() => navigate("/positions")} style={{ marginBottom: "20px" }}>
        Back to Positions
      </button>

      {alreadyVoted && (
        <p style={{ color: "green" }}>
          You have already voted for this position.
        </p>
      )}

      {candidates.length === 0 && <p>No candidates found.</p>}

      {candidates.map(candidate => (
        <div key={candidate.id} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h4>{candidate.name}</h4>
          <p>{candidate.manifesto}</p>

          <button
            disabled={alreadyVoted}
            onClick={() => handleVote(candidate.id)}
          >
            Vote
          </button>
        </div>
      ))}
    </div>
  );
}