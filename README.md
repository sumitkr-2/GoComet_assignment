# British Auction in RFQ System

A full-stack, enterprise-grade **Request for Quotation (RFQ) British Auction Web Application**. Built with **FastAPI**, **SQLAlchemy**, **SQLite/PostgreSQL**, and **React 18 + TypeScript + Vite + Tailwind CSS**.

This system implements a competitive reverse-bidding procurement platform where buyers post RFQs and pre-qualified suppliers (carriers) compete by submitting progressively lower quotes. The system features an authoritative **British Auction Automatic Extension Engine** that prevents last-second bid sniping and enforces hard forced-close limits.

---

## 1. Key System Features

- **British Auction Automatic Extension Engine**:
  - **Trigger Window ($X$ Minutes)**: Dynamically monitors bidding activity close to closing time.
  - **Extension Duration ($Y$ Minutes)**: Automatically adds extra time when qualifying bids occur.
  - **3 Extension Trigger Types Supported**:
    - **Type A (`BID_RECEIVED`)**: Extends when *any* valid bid is placed in the trigger window.
    - **Type B (`ANY_RANK_CHANGE`)**: Extends only when *any supplier ranking changes* in the trigger window.
    - **Type C (`L1_RANK_CHANGE`)**: Extends only when a *new lowest bidder ($L1$)* emerges. (Self-lowering by current $L1$ does not extend).
  - **Forced Close Hard Ceiling**: $\text{new\_close\_time} = \min(\text{current\_close} + Y, \text{forced\_close})$. The auction will *never* extend beyond the buyer's forced closing limit.
- **Supplier Ranking & Reverse Bidding**:
  - Deterministic leaderboard ranking ($L1, L2, L3 \dots$) where lowest total bid holds $L1$.
  - Quotation breakdown: $\text{Total} = \text{Freight Charges} + \text{Origin Charges} + \text{Destination Charges}$.
  - Continuous price reduction: Suppliers can lower their quotes to beat competitors.
- **Real-Time Live Bidding Experience**:
  - Countdown timer with live pulse indicator when entering the trigger window.
  - Reactive 2-second background sync updating rankings, lowest quotation, and status.
  - Immutable audit logs capturing extensions, ranking shifts, and closures.
- **Enterprise SaaS Dashboard**:
  - Real-time KPI cards and 7-day activity area charts using Recharts.
  - Status filters: Active Bidding, Upcoming, Closed, Force Closed.
  - 1-Click Quick Demo Switcher bar for testing between Buyer and 3 Suppliers without re-typing credentials.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS (Enterprise dark-navy sidebar & light theme)
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios with JWT interceptors
- **Routing**: React Router v6

### Backend
- **Framework**: FastAPI (Python 3.11)
- **ORM & Database**: SQLAlchemy 2.0 with SQLite (compatible with PostgreSQL)
- **Validation**: Pydantic v2
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing
- **Server**: Uvicorn

### Testing
- **Backend Test Runner**: Pytest with in-memory SQLite and FastAPI TestClient

---

## 3. Demo Credentials

Pre-seeded demo accounts are automatically loaded on first startup:

| Role | Name | Company / Organization | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **BUYER** | Rajesh Sharma | Apex Enterprises | `buyer@cocomet.com` | `Buyer@123` |
| **SUPPLIER 1** | Amit Verma | BlueDart Express Freight | `supplier1@cocomet.com` | `Supplier@123` |
| **SUPPLIER 2** | Vikram Singh | DHL Global Forwarding | `supplier2@cocomet.com` | `Supplier@123` |
| **SUPPLIER 3** | Pooja Patel | Maersk Logistics India | `supplier3@cocomet.com` | `Supplier@123` |

> **Pro-Tip**: Use the **Quick Demo Bar** at the top of the app interface to switch between accounts in one click!

---

## 4. Quick Start & Running Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.11)
- Node.js 18+ (tested on Node v25 / v20)
- npm

### 4.1 Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment
source venv/bin/activate
# (On Windows: venv\Scripts\activate)

# 3. Install dependencies
pip install -r requirements.txt

# 4. Seed the database with demo accounts & sample RFQs
python seed.py

# 5. Start the FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API and interactive Swagger documentation will be live at:
- **API URL**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

### 4.2 Frontend Setup
```bash
# In a separate terminal, navigate to the frontend directory
cd frontend

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
The frontend application will be live at:
- **Frontend App**: `http://localhost:5173`

---

## 5. Automated Test Suite

Run the complete backend test suite covering RFQ validation, ranking calculation, tie-breaking, all 3 British Auction extension trigger types (A, B, C), and forced close capping:

```bash
# From workspace root:
PYTHONPATH=backend backend/venv/bin/pytest backend/tests -v
```

### Verified Test Matrix:
- `test_trigger_type_a_bid_received`: Validates extension when any bid is placed in trigger window.
- `test_trigger_type_b_any_rank_change`: Validates extension only occurs when a supplier changes rank position.
- `test_trigger_type_c_l1_rank_change`: Validates extension occurs when a new L1 emerges, and verifies that current L1 self-lowering does **not** trigger extension.
- `test_forced_close_capping`: Verifies extensions are strictly capped at `forced_close_time`.
- `test_ranking_calculation_and_tie_breaking`: Verifies deterministic L1/L2/L3 ranking and tie-breaking.
- `test_create_valid_rfq` & `test_create_rfq_invalid_times`: Verifies start < close < forced close boundaries.
- `test_supplier_cannot_create_rfq`: Verifies role-based access control.
- `test_full_bidding_workflow`: End-to-end API integration test.

---

## 6. How to Demonstrate Automatic Auction Extension & Forced Close

The database comes pre-configured with a dedicated test RFQ:
**`RFQ-FAST-001: Urgent Pharma Freight - Mumbai to Delhi (Live Demo)`**
- Trigger Window: **2 minutes**
- Extension Duration: **1 minute**
- Extension Trigger Type: **Type A (Bid Received)**

### Step-by-Step Demo Walkthrough:
1. Open `http://localhost:5173` and log in (or click **Buyer (Apex)** on the top Quick Demo Bar).
2. Go to **All RFQ Auctions** and click on `RFQ-FAST-001`.
3. Notice the **Countdown Timer**: If the remaining time is under 2 minutes, the timer displays a yellow alert badge: `TRIGGER WINDOW ACTIVE (2m)`.
4. Switch to **Supplier 2 (DHL)** using the top Quick Demo Bar.
5. In the bid submission box, enter:
   - Carrier: `DHL Express Wings`
   - Freight: `30000`, Origin: `4000`, Destination: `3000` (Total: ₹37,000.00 — lower than L1's ₹44,500.00).
6. Click **Place Official Quotation**.
7. **Observe the Extension Engine**:
   - The countdown timer immediately adds **+1 minute** to the deadline.
   - An indigo alert banner appears: *"British Auction Automatic Extension Triggered!"*
   - Supplier 2 moves to **L1** on the leaderboard.
   - An `AUCTION_EXTENDED` event appears in the live activity stream.
8. **Demonstrating Forced Close Capping**:
   - As repeated bids extend the auction, the closing time approaches the configured Forced Close limit (e.g., 10 minutes from creation).
   - Once the forced close limit is reached, any extension is capped at that exact second.
   - When the clock passes the forced close time, the status automatically switches to **Force Closed**, and the bidding interface is permanently disabled.

---

## 7. Deliverables & Documentation Index

- **Deliverable 1: High-Level Design (HLD)**: [`docs/HLD.md`](./docs/HLD.md)
- **Deliverable 2: Database Schema & ERD**: [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)
- **Deliverable 3: Backend Source Code**: [`backend/app/`](./backend/app/)
- **Deliverable 4: Frontend Source Code**: [`frontend/src/`](./frontend/src/)
