export default function AlreadyVoted() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      textAlign: "center",
      padding: "20px"
    }}>
      <h2>You have already voted.</h2>
      <p>Please wait for results.</p>
    </div>
  );
}
