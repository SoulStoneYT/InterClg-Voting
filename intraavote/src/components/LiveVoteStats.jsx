import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { db } from "../firebase";

const CHART_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#F44336",
  "#00BCD4",
  "#8BC34A",
  "#FF5722"
];

export default function LiveVoteStats({ positions = [], candidates = [] }) {
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    const votesRef = collection(db, "votes");

    const unsubscribe = onSnapshot(votesRef, (snapshot) => {
      const allVotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVotes(allVotes);
    });

    return () => unsubscribe();
  }, []);

  const statsByPosition = useMemo(() => {
    return positions
      .map((position) => {
        const positionCandidates = candidates.filter((c) => c.positionId === position.id);

        const chartData = positionCandidates
          .map((candidate) => {
            const count = votes.filter(
              (vote) =>
                vote.positionId === position.id && vote.candidateId === candidate.id
            ).length;

            return {
              name: candidate.name,
              value: count,
              party: candidate.party || "Independent"
            };
          })
          .filter((row) => row.value > 0);

        const totalVotes = chartData.reduce((sum, row) => sum + row.value, 0);

        return {
          positionId: position.id,
          positionTitle: position.title,
          chartData,
          totalVotes
        };
      })
      .filter((item) => item.chartData.length > 0);
  }, [positions, candidates, votes]);

  const totalVotesOverall = votes.length;

  return (
    <section className="admin-section">
      <div className="admin-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <h3 style={{ margin: 0 }}>📊 Live Vote Statistics</h3>
          <span
            style={{
              background: "#1f2937",
              padding: "6px 10px",
              borderRadius: "999px",
              fontSize: "13px",
              color: "#e5e7eb"
            }}
          >
            Total Votes: <strong>{totalVotesOverall}</strong>
          </span>
        </div>

        {statsByPosition.length === 0 ? (
          <p style={{ color: "#666", marginBottom: 0 }}>
            No vote data yet. Charts will appear automatically as votes are cast.
          </p>
        ) : (
          <div className="live-stats-grid">
            {statsByPosition.map((item) => (
              <div key={item.positionId} className="live-stats-card">
                <h4 style={{ marginTop: 0, marginBottom: "6px" }}>{item.positionTitle}</h4>
                <p style={{ marginTop: 0, color: "#9ca3af", fontSize: "13px" }}>
                  Votes: {item.totalVotes}
                </p>

                <div className="live-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={item.chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={35}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {item.chartData.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
