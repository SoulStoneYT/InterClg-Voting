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

  const isOnline = () => typeof navigator !== "undefined" ? navigator.onLine : true;

  const fallbackRedirect = (user) => {
    if (user?.email && adminEmails.includes(user.email)) {
      navigate("/admin");
    } else {
      navigate("/complete-profile");
    }
  };

  // Auto login session detection with role-based redirect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!isOnline()) {
          alert("You are offline. Please connect to the internet and reload the page.");
          return;
        }

        try {
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
          } else {
            fallbackRedirect(user);
          }
        } catch (err) {
          if (err.code !== "permission-denied" && err.code !== "unavailable" && err.code !== "network-request-failed") {
            console.error("Firestore error in auth state listener:", err);
          }
          fallbackRedirect(user);
          return;
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const redirectUser = async (user) => {
    if (!user) return false;
    if (!isOnline()) {
      alert("You are offline. Login succeeded, but we cannot fetch your profile until you reconnect.");
      return false;
    }

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role;

        if (role === "admin") {
          navigate("/admin");
        } else if (userData.votingSessionCompleted === true) {
          navigate("/already-voted");
        } else if (userData.votingSessionStarted === false) {
          navigate("/complete-profile");
        } else {
          navigate("/voting-session");
        }
      } else {
        fallbackRedirect(user);
      }

      return true;
    } catch (err) {
      if (err.code !== "permission-denied" && err.code !== "unavailable" && err.code !== "network-request-failed") {
        console.error("Firestore error during redirect:", err);
      }
      fallbackRedirect(user);
      return true;
    }
  };

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

    if (!isOnline()) {
      alert("You are offline. Please connect to the internet before logging in.");
      return;
    }

    let userCredential;

    try {
      userCredential = await signInWithEmailAndPassword(auth, email, enrollment);
    } catch (signInError) {
      if (signInError.code === "auth/network-request-failed") {
        alert("Network error during login. Please check your internet connection.");
        return;
      }

      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, enrollment);
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
      } catch (createError) {
        alert(createError.message);
        return;
      }
    }

    if (userCredential?.user) {
      await redirectUser(userCredential.user);
    } else {
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>IntraaVote Login</h2>
        </div>

        <div className="field-card">
          <label className="field-label" htmlFor="name">Full Name</label>
          <div className="input-group">
            <input
              id="name"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="field-card">
          <label className="field-label" htmlFor="enrollment">Student ID</label>
          <div className="input-group">
            <input
              id="enrollment"
              type="text"
              placeholder="Student ID"
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
            />
          </div>
        </div>

        <div className="field-card">
          <label className="field-label" htmlFor="email">Email Address</label>
          <div className="input-group">
            <input
              id="email"
              type="email"
              placeholder="College Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button className="primary-btn" onClick={handleLogin}>Continue</button>
      </div>
    </div>
  );
}
