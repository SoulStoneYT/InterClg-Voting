import { useState } from "react";

const FALLBACK_AVATAR =
  "https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg";

export default function CandidateCard({ candidate, onVote, canVote, voting }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const imageUrl = candidate.photo || FALLBACK_AVATAR;

  return (
    <div className="candidate-card-container">
      <div className={`candidate-card ${isFlipped ? "flipped" : ""}`}>
        <div className="card-face card-front">
          <button
            type="button"
            className="card-info-btn"
            onClick={() => setIsFlipped(true)}
            aria-label={`View ${candidate.name} details`}
            title="Candidate info"
          >
            ℹ️
          </button>

          <div className="card-photo-wrap">
            <img
              src={imageUrl}
              alt={candidate.name}
              className="card-photo"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_AVATAR;
              }}
            />
          </div>

          <h3 className="card-name">{candidate.name}</h3>
          <p className="card-party">{candidate.party || "Independent"}</p>

          <button
            type="button"
            onClick={() => onVote(candidate.id)}
            disabled={voting || !canVote}
            className="card-vote-btn"
          >
            {voting ? "Submitting..." : "Vote"}
          </button>
        </div>

        <div className="card-face card-back">
          <button
            type="button"
            className="card-info-btn"
            onClick={() => setIsFlipped(false)}
            aria-label={`Back to ${candidate.name}`}
            title="Back"
          >
            ↩️
          </button>

          <h3 className="card-back-title">{candidate.name}</h3>
          <p className="card-back-label">Motto</p>
          <p className="card-motto">
            {candidate.motto?.trim() || "No motto provided by this candidate yet."}
          </p>

          <button
            type="button"
            onClick={() => onVote(candidate.id)}
            disabled={voting || !canVote}
            className="card-vote-btn"
          >
            {voting ? "Submitting..." : "Vote"}
          </button>
        </div>
      </div>
    </div>
  );
}