import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function Results() {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const electionDocRef = doc(db, "settings", "election");
        const electionDoc = await getDoc(electionDocRef);

        if (!electionDoc.exists() || electionDoc.data().resultsPublished !== true) {
          setResultsPublished(false);
          setLoading(false);
          return;
        }

        setResultsPublished(true);

        const [positionsSnapshot, candidatesSnapshot, votesSnapshot] = await Promise.all([
          getDocs(collection(db, "positions")),
          getDocs(collection(db, "candidates")),
          getDocs(collection(db, "votes"))
        ]);

        setPositions(positionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCandidates(candidatesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setVotes(votesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const computedResults = useMemo(() => {
    return positions
      .filter((position) => position.isActive !== false)
      .map((position) => {
        const positionCandidates = candidates.filter((c) => c.positionId === position.id);

        const standings = positionCandidates
          .map((candidate) => {
            const voteCount = votes.filter(
              (vote) => vote.positionId === position.id && vote.candidateId === candidate.id
            ).length;

            return {
              candidateId: candidate.id,
              name: candidate.name,
              party: candidate.party || "Independent",
              voteCount
            };
          })
          .sort((a, b) => b.voteCount - a.voteCount);

        return {
          positionId: position.id,
          positionTitle: position.title,
          standings,
          winner: standings[0] || null,
          totalVotes: standings.reduce((sum, row) => sum + row.voteCount, 0)
        };
      });
  }, [positions, candidates, votes]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Loading results...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#dc3545" }}>
        <h2>Unable to load results</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!resultsPublished) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>Results Not Published Yet</h2>
        <p>Please wait for the admin to publish the final results.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "8px" }}>🎉 Election Results</h1>
      <p style={{ textAlign: "center", color: "#555", marginBottom: "28px" }}>
        Final outcomes of the election
      </p>

      {computedResults.length === 0 ? (
        <p style={{ textAlign: "center" }}>No positions available.</p>
      ) : (
        computedResults.map((result) => (
          <div
            key={result.positionId}
            style={{
              border: "1px solid #e3e7ef",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "16px",
              backgroundColor: "#fff"
            }}
          >
            <h3 style={{ margin: "0 0 8px" }}>{result.positionTitle}</h3>
            <p style={{ marginTop: 0, color: "#6b7280", fontSize: "14px" }}>
              Total Votes: {result.totalVotes}
            </p>

            {result.winner ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#eefaf0",
                  border: "1px solid #95d5a6",
                  marginBottom: "12px"
                }}
              >
                🏆 <strong>Winner:</strong> {result.winner.name} ({result.winner.party}) —{" "}
                <strong>{result.winner.voteCount}</strong> votes
              </div>
            ) : (
              <p>No candidates for this position.</p>
            )}

            {result.standings.length > 0 && (
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                {result.standings.map((entry) => (
                  <li key={entry.candidateId} style={{ marginBottom: "6px" }}>
                    {entry.name} ({entry.party}) - {entry.voteCount} votes
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))
      )}
    </div>
  );
}
