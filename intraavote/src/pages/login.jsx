import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const adminEmails = [
  "adityachaudhari237@nhitm.ac.in",
  "friend1@nhitm.ac.in"
];

export default function Login() {
  const [name, setName] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  // Auto login session detection with role-based redirect
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const role = userData.role;

          if (role === "admin") {
            navigate("/admin");
          } else {
            // Voter role - check voting status
            if (userData.votingSessionCompleted === true) {
              navigate("/already-voted");
            } else if (userData.votingSessionStarted === false) {
              navigate("/complete-profile");
            } else {
              navigate("/voting-session");
            }
          }
        }
      }
    });
  }, [navigate]);

  const handleLogin = async () => {
    if (!name || !enrollment || !email) {
      alert("All fields required");
      return;
    }

    // College domain restriction
    if (!email.endsWith("@nhitm.ac.in")) {
      alert("Only official college email IDs allowed.");
      return;
    }

    try {
      // Try login
      await signInWithEmailAndPassword(auth, email, enrollment);
      alert("Login successful");

    } catch {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, enrollment);
        const user = userCredential.user;

        const role = adminEmails.includes(email) ? "admin" : "voter";

        await setDoc(doc(db, "users", user.uid), {
          name: name,
          enrollmentNumber: enrollment,
          collegeEmail: email,
          role: role,
          department: "",
          year: "",
          dob: null,
          votingSessionStarted: false,
          votingSessionCompleted: false,
          sessionStartTime: null,
          votedPositions: []
        });

        alert("Account created successfully");

      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="login-container">
      <h2>IntraaVote Login</h2>

      <input
        placeholder="Full Name"
        onChange={(e) => setName(e.target.value)}
      /><br /><br />

      <input
        placeholder="Enrollment Number"
        onChange={(e) => setEnrollment(e.target.value)}
      /><br /><br />

      <input
        placeholder="College Email"
        onChange={(e) => setEmail(e.target.value)}
      /><br /><br />

      <button onClick={handleLogin}>Continue</button>
    </div>
  );
}
