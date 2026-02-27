# 🌍 Sularchi

### Strava for Waste Management

AI-powered, gamified civic cleanliness platform built with React Native (Expo).

---

## 🚀 Vision

**Sularchi** (சுலர்ச்சி – "positive change / civic movement") transforms city cleanliness into a competitive, social experience.

If **Strava** gamified running, Sularchi gamifies civic responsibility.

---

## 🧠 Problem

Illegal dumping in Indian cities often:

- Goes unreported
- Lacks transparency
- Has no tracking system
- Provides no citizen incentive

Traditional complaint systems feel bureaucratic and disengaging.

---

##  Solution

Sularchi allows citizens to:

1. 📸 Snap illegal waste
2. 🤖 Auto-detect waste type using AI
3. 📍 Capture GPS automatically
4. 🏛 Auto-file complaint
5. 🏆 Earn points & climb leaderboards
6. 🗺 Compete to clean city segments

**Initial rollout target:** Madurai
**Integrated with:** Madurai Municipal Corporation

---

## Architecture Overview

```
Expo App (React Native)
        ↓
API Gateway
        ↓
Python Backend (Game Logic Engine)
        ↓
AI Detection Service
        ↓
PostgreSQL + Redis
        ↓
IPFS Storage
        ↓
Blockchain (Optional Phase 2)
```

---

## 📱 Frontend – React Native (Expo)

Built using:

- Expo Router
- React Navigation
- Expo Camera
- Expo Location
- Expo Secure Store
- React Query
- Zustand / Redux Toolkit

### Core Screens

- 🗺 Map (Heatmap + Segments)
- 📸 Camera (AI preview)
- 🏆 Leaderboard
- 👤 Profile
- 📊 Activity Feed

---

## 🤖 AI Detection Service

- YOLOv8-based object detection
- Waste classification:
  - Plastic
  - Organic
  - Construction debris
  - Hazardous waste
- Severity scoring
- Duplicate image detection
- Confidence threshold validation

**Outputs:**

- Waste type
- Severity score
- Confidence %

---

## 🎮 Gamification Engine

### 🏆 Impact Score Formula

```
Impact Score =
    (Resolved Reports × 2)
    + Severity Bonus
    + Streak Bonus
    - Spam Penalty
```

### 🎖 Ranks

- 🌱 Volunteer
- 🛡 Street Guard
- 🔥 Waste Hunter
- 👑 Sularchi Elite

---

## 🗺 Waste Segments (Strava Model)

City divided into competitive zones.

Each segment tracks:

- Cleanliness score
- Total reports
- Active guardians
- Current Segment Leader

Users compete to "own" streets.

---

## 🏆 Leaderboards

- 🌆 City Leaderboard
- 📍 Ward Leaderboard
- 📅 Monthly Rankings
- 👥 Friends Ranking

---

## ⚙️ Backend (Python)

Built using:

- FastAPI
- SQLAlchemy / asyncpg
- PostgreSQL
- Redis (real-time ranking cache)
- JWT Authentication
- Event-driven scoring system

**Microservices:**

- Auth Service
- Complaint Service
- Impact Engine
- Leaderboard Engine
- Notification Service

---

## ⛓ Blockchain (Phase 2)

Stores:

- Complaint hash
- Timestamp
- Location hash
- Status
- Score snapshot

**Goal:** tamper-proof transparency.

---

## 🔐 Anti-Cheat

- GPS spoof detection
- Speed anomaly detection
- Image similarity hashing
- AI confidence threshold
- Stake-to-report (future feature)

---


## 🛠 Tech Stack

| Layer      | Tech                |
| ---------- | ------------------- |
| Mobile     | React Native (Expo) |
| Backend    | Python (FastAPI)    |
| Database   | PostgreSQL          |
| Cache      | Redis               |
| AI         | YOLOv8 (Python)     |
| Storage    | IPFS                |
| Blockchain | Polygon / Solana    |

---

## 🗺 Roadmap

### Phase 1 – MVP

- [ ] Photo upload
- [ ] AI detection
- [ ] Points system
- [ ] Leaderboard
- [ ] Basic heatmap

### Phase 2 – Strava Model

- [ ] Patrol route tracking
- [ ] Segments
- [ ] Activity feed
- [ ] Streak system

### Phase 3 – Scale

- [ ] On-chain transparency
- [ ] Business reward integrations
- [ ] Expand across Tamil Nadu

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Python 3.10+ (for backend & AI service)
- PostgreSQL 15+
- Redis

### Mobile App

```bash
cd app
npm install
npx expo start
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### AI Service

```bash
cd ai-service
pip install -r requirements.txt
python src/server.py
```

---

## 📄 License

MIT License – see [LICENSE](LICENSE) for details.

---

## 🔥 Tagline

> **Sularchi — Clean Streets. Competitive Spirit. Civic Evolution.**
