# 🗳️ IntraaVote

A secure, scalable digital voting system for conducting transparent
college elections.

------------------------------------------------------------------------

## What This Does

IntraaVote enables colleges to conduct internal elections completely
online — eliminating paper ballots, manual counting, and duplicate
voting.

It ensures:

-   One Student → One Vote  
-   Secure Authentication  
-   Position-based Voting  
-   Real-time Vote Storage  
-   Controlled Result Publishing  
-   Automated Email Result Notification

Built for colleges. Designed for scale.

------------------------------------------------------------------------

## Key Features

**Secure Authentication** — Only verified college voters can access the
system.

**One Vote Enforcement** — Prevents duplicate or repeat voting per
position.

**Position-Based Elections** — Multiple posts (President, Secretary,
etc.) within the same election.

**Admin Control Panel** — Create elections, add candidates, monitor
votes, publish results.

**Automated Result Emails** — Notify all voters once results are
officially published.

**Live Vote Counting Engine** — Real-time vote aggregation with
database-backed accuracy.

**Role-Based Access Control** — Separate permissions for Admins and
Voters.

**Clean Dashboard UI** — Simple, focused interface for distraction-free
voting.

------------------------------------------------------------------------

## Installation

### Clone Repository

``` bash
git clone https://github.com/your-repo/intraavote.git
cd intraavote
```

### Install Dependencies

#### Frontend:

``` bash
cd client
npm install
npm start
```

#### Backend:

``` bash
cd server
npm install
npm run dev
```

------------------------------------------------------------------------

## Tech Stack

### Frontend

-   React.js  
-   Tailwind CSS

### Backend

-   Node.js  
-   Express.js

### Database

-   MongoDB / Firebase

### Authentication

-   JWT / Firebase Auth

### Email Service

-   Nodemailer / SendGrid

------------------------------------------------------------------------

## Election Lifecycle

Create Election  
→ Add Positions  
→ Add Candidates  
→ Open Voting  
→ Monitor Participation  
→ Close Voting  
→ Publish Results  
→ Send Result Emails

------------------------------------------------------------------------

## Security Model

-   Unique voter identity validation  
-   One-vote-per-position enforcement  
-   Encrypted vote storage  
-   Admin-only result publishing  
-   Server-side vote verification  
-   Protected API routes

------------------------------------------------------------------------

## Output Example

Each vote stored securely in database:

``` json
{
  "voterId": "COLLEGE12345",
  "position": "President",
  "candidateId": "CAND789",
  "timestamp": "2026-02-25T10:45:00Z"
}
```

------------------------------------------------------------------------

## Future Roadmap

-   OTP-based verification  
-   Blockchain-backed vote ledger  
-   Multi-college deployment  
-   Advanced analytics dashboard  
-   Mobile application version

------------------------------------------------------------------------

## Requirements

-   Node.js v18+  
-   MongoDB / Firebase instance  
-   SMTP Email Service

------------------------------------------------------------------------

## License

Academic & Educational Use
