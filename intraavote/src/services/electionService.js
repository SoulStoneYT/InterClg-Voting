import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const ELECTION_DOC_ID = "election";

/**
 * Initialize election settings document if it doesn't exist
 */
export const initElectionSettings = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  const electionDoc = await getDoc(electionDocRef);

  if (!electionDoc.exists()) {
    await setDoc(electionDocRef, {
      electionStatus: "not_started",
      startTime: null,
      endTime: null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }

  return true;
};

/**
 * Get current election status
 */
export const getElectionStatus = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  const electionDoc = await getDoc(electionDocRef);

  if (!electionDoc.exists()) {
    await initElectionSettings();
    return {
      electionStatus: "not_started",
      startTime: null,
      endTime: null
    };
  }

  return electionDoc.data();
};

/**
 * Start the election - sets status to "active"
 */
export const startElection = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  
  await initElectionSettings();
  
  await updateDoc(electionDocRef, {
    electionStatus: "active",
    startTime: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return true;
};

/**
 * Pause the election - sets status to "paused"
 */
export const pauseElection = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  
  await updateDoc(electionDocRef, {
    electionStatus: "paused",
    updatedAt: serverTimestamp()
  });

  return true;
};

/**
 * Resume the election - sets status back to "active"
 */
export const resumeElection = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  
  await updateDoc(electionDocRef, {
    electionStatus: "active",
    updatedAt: serverTimestamp()
  });

  return true;
};

/**
 * End the election - sets status to "ended"
 */
export const endElection = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  
  await updateDoc(electionDocRef, {
    electionStatus: "ended",
    endTime: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return true;
};

/**
 * Reset the election - sets status back to "not_started"
 */
export const resetElection = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  
  await updateDoc(electionDocRef, {
    electionStatus: "not_started",
    startTime: null,
    endTime: null,
    updatedAt: serverTimestamp()
  });

  return true;
};
