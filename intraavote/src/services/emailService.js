import emailjs from "@emailjs/browser";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAIL_SEND_DELAY_MS = 1200;

const hasEmailConfig = () => {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};

const getEligibleVoterEmails = async () => {
  const usersSnapshot = await getDocs(collection(db, "users"));

  const emails = usersSnapshot.docs
    .map((docSnap) => docSnap.data())
    .filter((user) => user.role !== "admin")
    .map((user) => user.collegeEmail)
    .filter(Boolean);

  return Array.from(new Set(emails));
};

export const sendResultsAnnouncementEmails = async (resultsLink) => {
  if (!hasEmailConfig()) {
    throw new Error(
      "EmailJS credentials are missing. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env"
    );
  }

  const emails = await getEligibleVoterEmails();

  if (emails.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const outcomes = [];

  for (const email of emails) {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          email,
          user_email: email,
          recipient_email: email,
          results_link: resultsLink,
          message: `The election results are announced. View results here: ${resultsLink}`,
          subject: "Election Results Announced - IntraaVote"
        },
        {
          publicKey: EMAILJS_PUBLIC_KEY
        }
      );

      outcomes.push({ status: "fulfilled" });
    } catch (error) {
      outcomes.push({
        status: "rejected",
        reason: error?.text || error?.message || "Unknown email error"
      });
    }

    // EmailJS free plan has strict rate limits, so avoid burst sending.
    await new Promise((resolve) => setTimeout(resolve, EMAIL_SEND_DELAY_MS));
  }

  const sent = outcomes.filter((item) => item.status === "fulfilled").length;
  const failed = outcomes.length - sent;
  const failedReasons = outcomes
    .filter((item) => item.status === "rejected")
    .map((item) => item.reason);

  return {
    sent,
    failed,
    total: outcomes.length,
    failedReasons
  };
};
