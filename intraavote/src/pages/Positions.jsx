import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPositions = async () => {
      const querySnapshot = await getDocs(collection(db, "positions"));
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPositions(list);
    };

    fetchPositions();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Select Position</h2>

      {positions.map(position => (
        <div key={position.id} style={{ marginBottom: "15px" }}>
          <button onClick={() => navigate(`/position/${position.id}`)}>
            {position.title}
          </button>
        </div>
      ))}
    </div>
  );
}