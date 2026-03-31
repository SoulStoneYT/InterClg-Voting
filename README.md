# 🗳️ IntraaVote — Project Report

IntraaVote is a web-based college election management and voting platform designed to run secure, transparent, and timed elections for intra-college use. This README is an in-depth project report that can also be shared directly with your project group.

---

## 1) Introduction

Traditional paper-based college elections are often time-consuming, difficult to monitor in real time, and prone to manual errors in vote counting. IntraaVote solves this by providing a digital voting workflow with controlled election states, role-based access, secure user authentication, real-time updates, and structured result publication.

The project supports both **voter** and **admin** journeys in one application:
- Voters can register/login, complete profile details, start a timed voting session, and cast votes per position.
- Admins can create positions/candidates, control the election lifecycle, monitor live voting stats, and publish results with optional email notifications.

---

## 2) Purpose

The purpose of IntraaVote is to:

1. Conduct fair and transparent intra-college elections.
2. Enforce **one voter, one vote per position**.
3. Reduce dependence on manual ballot collection and counting.
4. Enable real-time election monitoring and control.
5. Provide clear result publishing and communication to voters.
6. Offer an easy-to-use, modern interface for both students and administrators.

---

## 3) How It Works

### A. Authentication & Role Routing
- Users login using college email and student details.
- New users are created in Firebase Authentication and mirrored in Firestore `users` collection.
- Role (`admin` or `voter`) determines dashboard route.

### B. Voter Flow
1. Login with college email.
2. Complete profile (department, year, DOB).
3. Navigate to **Start Voting** page.
4. Voter can start only when election status is `active`.
5. A **10-minute personal timer** starts for the voter session.
6. Voter sees one position at a time and selects a candidate.
7. Vote is stored in Firestore `votes` collection.
8. User's `votedPositions` updates to prevent duplicate voting.
9. After all positions (or timer expiry), voter is marked completed and redirected.

### C. Admin Flow
1. Admin logs into dashboard.
2. Creates/activates/deactivates positions.
3. Adds/removes candidates for each position.
4. Controls election lifecycle:
   - `not_started` → `active` → `paused` → `active` → `ended`
5. Views real-time vote statistics (charts).
6. Publishes final results.
7. Optional automated result announcements via EmailJS.

### D. Election State Logic
- `not_started`: voters cannot start.
- `active`: voters can start and vote.
- `paused`: session remains, but voting actions are blocked.
- `ended`: no new sessions, existing active voter context handled by timer/session logic.

---

## 4) Tech Stack

### Frontend
- **React 19**
- **Vite 7**
- **React Router DOM 7**
- Custom CSS

### Backend-as-a-Service
- **Firebase Authentication** (user auth)
- **Firebase Firestore** (users, positions, candidates, votes, settings)

### Data Visualization
- **Recharts** for live vote statistics (pie charts)

### Notification/Communication
- **EmailJS** for result announcement emails

### Tooling
- ESLint (code quality)
- npm scripts (`dev`, `build`, `preview`, `lint`)

---

## 5) Detailed Feature List & Explanation

### 5.1 College Email Restricted Login
- Restricts login to specific college domain (e.g., `@nhitm.ac.in`).
- Improves election integrity by reducing unauthorized participation.

### 5.2 Auto Role-Based Redirection
- Admin users are redirected to `/admin`.
- Voters are redirected based on profile/session/voting status.

### 5.3 Voter Profile Completion Step
- Captures `department`, `year`, and `dob` before voting.
- Ensures voter metadata completeness and structured user records.

### 5.4 Position Management (Admin)
- Add, activate/deactivate, and delete election positions.
- Supports multi-position elections such as President, Secretary, etc.

### 5.5 Candidate Management (Admin)
- Add candidates with name, party, photo URL, and motto.
- Link candidates to specific positions.

### 5.6 Timed Voting Session per User
- Each voter gets a 10-minute session.
- Session start time is stored in Firestore.
- Expired sessions are auto-marked complete.

### 5.7 Vote Integrity Rules
- Votes stored with `positionId`, `candidateId`, `userId`, and timestamp.
- `votedPositions` list prevents multiple votes on the same position.

### 5.8 Election Lifecycle Control
- Admin can start, pause, resume, end, and reset election states.
- Global election timer support via settings document.

### 5.9 Real-Time Live Vote Stats
- Admin dashboard shows live vote charts by position.
- Instant updates powered by Firestore listeners.

### 5.10 Result Publishing System
- Results remain hidden until admin marks `resultsPublished`.
- Public results page computes standings and winners per position.

### 5.11 Result Email Announcements
- On publish, system can email result link to eligible voter emails.
- Includes throttled sending to respect EmailJS limits.

### 5.12 Testing Utilities (Admin)
- Reset all votes.
- Reset user voting status.
- Full testing reset (votes + user state + election reset).

### 5.13 UX and Safety Enhancements
- In-app notifications for success/warning/error.
- Confirmation dialogs for destructive admin actions.
- Offline and network error handling in key flows.

---

## 6) Requirements

### Software
- **Node.js** (LTS recommended)
- **npm**
- Modern browser (Chrome/Edge/Firefox)

### Accounts/Services
- Firebase project with:
  - Authentication enabled
  - Cloud Firestore enabled
- EmailJS account (optional, for result email feature)

### Environment Variables (Vite)
Create a `.env` file inside `intraavote/` with:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

---

## 7) Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/SoulStoneYT/InterClg-Voting.git
cd InterClg-Voting
```

### Step 2: Install Dependencies
```bash
cd intraavote
npm install
```

### Step 3: Configure Environment
- Create `intraavote/.env`.
- Add Firebase and EmailJS keys (as listed above).

### Step 4: Run Development Server
```bash
npm run dev
```

### Step 5: Build for Production
```bash
npm run build
```

### Step 6: Preview Production Build
```bash
npm run preview
```

---

## Suggested Section for Sharing in Project Group

If you want to paste a short summary in your group chat/document:

> **IntraaVote** is our inter-college digital voting system built with React + Firebase. It provides role-based login (admin/voter), profile validation, timed voting sessions, position-wise candidate voting, real-time live vote stats, election control (start/pause/resume/end), and controlled result publication with optional email announcements via EmailJS.

---

## License

This project is currently intended for academic/project use.
