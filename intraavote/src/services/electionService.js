import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  writeBatch
} from "firebase/firestore";

const ELECTION_DOC_ID = "election";
export const ELECTION_DURATION_SECONDS = 2 * 60 * 60; // 2 hours in seconds

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
      electionEndTime: null,
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
      endTime: null,
      electionEndTime: null
    };
  }

  return electionDoc.data();
};

/**
 * Start the election - sets status to "active" with 2-hour timer
 */
export const startElection = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  
  await initElectionSettings();
  
  // Calculate end time (2 hours from now)
  const startTime = new Date();
  const electionEndTime = new Date(startTime.getTime() + ELECTION_DURATION_SECONDS * 1000);
  
  await updateDoc(electionDocRef, {
    electionStatus: "active",
    startTime: serverTimestamp(),
    electionEndTime: electionEndTime.toISOString(),
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
    electionEndTime: null,
    resultsPublished: false,
    updatedAt: serverTimestamp()
  });

  return true;
};

/**
 * Publish results - marks results as published
 */
export const publishResults = async () => {
  const electionDocRef = doc(db, "settings", ELECTION_DOC_ID);
  
  await updateDoc(electionDocRef, {
    resultsPublished: true,
    updatedAt: serverTimestamp()
  });

  return true;
};

const BATCH_LIMIT = 450;

/**
 * Deletes all vote documents for testing reset
 */
export const resetAllVotes = async () => {
  const votesSnapshot = await getDocs(collection(db, "votes"));

  if (votesSnapshot.empty) {
    return { deletedVotes: 0 };
  }

  let batch = writeBatch(db);
  let operationCount = 0;
  let deletedVotes = 0;

  for (const voteDoc of votesSnapshot.docs) {
    batch.delete(voteDoc.ref);
    operationCount += 1;
    deletedVotes += 1;

    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return { deletedVotes };
};

/**
 * Clears votedPositions for all users so they can vote again during testing
 */
export const resetAllUserVotingStatus = async () => {
  const usersSnapshot = await getDocs(collection(db, "users"));

  if (usersSnapshot.empty) {
    return { resetUsers: 0 };
  }

  let batch = writeBatch(db);
  let operationCount = 0;
  let resetUsers = 0;

  for (const userDoc of usersSnapshot.docs) {
    batch.update(userDoc.ref, {
      votedPositions: [],
      votingSessionStarted: false,
      votingSessionCompleted: false,
      sessionStartTime: null
    });
    operationCount += 1;
    resetUsers += 1;

    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return { resetUsers };
};

/**
 * Full testing reset: clears votes, resets user voting status, and resets election state
 */
export const fullTestingReset = async () => {
  const [votesResult, usersResult] = await Promise.all([
    resetAllVotes(),
    resetAllUserVotingStatus()
  ]);

  await resetElection();

  return {
    deletedVotes: votesResult.deletedVotes,
    resetUsers: usersResult.resetUsers
  };
};
