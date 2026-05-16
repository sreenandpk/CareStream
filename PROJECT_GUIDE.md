# 🏥 CareStream: Next-Generation Clinical Monitoring & Identity Nexus

CareStream is a professional, hospital-grade clinical monitoring platform designed to unify real-time patient telemetry, medical device management, and secure identity verification into a single, high-fidelity command center.

---

## 🛠️ Technology Stack

### **Frontend (The Command Center)**
*   **Framework**: Next.js 16+ (App Router)
*   **Logic**: React 19 (Hooks & Context)
*   **Styling**: Tailwind CSS 4 with custom design tokens.
*   **State Management**: Zustand (Presence & Auth)
*   **Real-Time**: WebSockets (Django Channels)
*   **Aesthetics**: Professional Clean (Light) Theme with high-fidelity glassmorphism, CareStream Blue accents, and Framer Motion animations.
*   **UI Components**: Radix UI & Shadcn/UI primitives.

### **Backend (The Engine)**
*   **Framework**: Django REST Framework (DRF)
*   **Database**: PostgreSQL 16
*   **Real-Time Layer**: Django Channels (ASGI)
*   **Task Queue**: Celery with Redis (Asynchronous validation & simulations).
*   **AI & Data Science**: Scikit-Learn, Pandas, and NumPy (For clinical forensics & pattern detection).
*   **Caching**: Redis (Rate limiting & identity buffering).
*   **Logging**: Multi-layer Audit & Security logging (File + WebSockets).

### **Infrastructure & DevOps**
*   **Containerization**: Docker & Docker Compose.
*   **Web Server**: Daphne (ASGI) & Next.js Dev Server.
*   **Gateway**: ngrok (For local webhook testing).
*   **Email Services**: 
    *   **SendGrid**: Identity Shield (Deliverability Signals).
    *   **Gmail SMTP**: High-reliability OTP & Credential dispatch.

---

## 🚀 Core Functionalities

### **1. Identity Shield (SendGrid Interceptor)**
*   **Asynchronous Validation**: When a user is created, a background Celery task polls for SendGrid bounce signals for 20 seconds.
*   **Automatic Deactivation**: If an email is found to be non-existent, the account is instantly deactivated and flagged in the UI.
*   **Local Simulation**: Built-in simulator for developers to test deactivation logic on `localhost` using keywords like `bounce` or `fake`.

### **2. Clinical Context Management**
*   **Ward & Room Hierarchy**: Multi-level organization of hospital infrastructure.
*   **Nurse Assignments**: Dynamic assignment of clinical staff to specific wards and shifts.
*   **Presence Tracking**: Real-time tracking of online staff members via WebSockets.

### **3. Real-Time Telemetry & Hardware Nexus**
*   **Physical Hardware Support**: Native integration with **ESP32** microcontrollers for real-time sensor data ingestion.
*   **Dual Mode Ingestion**: Seamlessly switch between **Simulation Mode** (1Hz generated data) and **Real Device Mode** (Live medical sensor data).
*   **Vital Grid**: Responsive dashboard showing high-fidelity HR and SpO2 metrics with synchronized waveform updates.
*   **Streamlined Notifications**: Optimized single-layer notification system for clinical efficiency (replacing complex legacy alerts).

### **4. AI Forensics & Review Replay**
*   **AI-Driven Forensics**: Intelligence layer for analyzing clinical telemetry history to detect patterns or anomalies.
*   **Review Replay**: Full forensic playback of clinical telemetry sessions, allowing doctors to review patient vitals as they happened in real-time.

### **5. Administrative Lockdown & Security**
*   **Role-Based Access (RBAC)**: Strict separation between Admin, Doctor, and Nurse roles.
*   **Protected Accounts**: System-managed Administrative accounts that cannot be modified or escalated via the UI.
*   **OTP Verification**: Mandatory 6-digit verification for sensitive identity changes.

---

## 🏗️ Architecture Overview

CareStream follows a **decoupled architecture**:
1.  **Frontend** communicates with the **Backend** via a Stateless REST API for CRUD operations.
2.  **WebSockets** provide a persistent side-channel for telemetry, hardware signals, and security events.
3.  **Celery Workers** handle heavy lifting (Email validation, Hardware simulations) to keep the UI responsive.
4.  **Redis** acts as the high-speed bridge between the Backend, Workers, and WebSocket layers.

---

## 🛡️ Security Protocols
*   **JWT Authentication**: Secure, token-based sessions.
*   **Rate Limiting**: IP-based protection against brute-force attacks.
*   **Audit Trails**: Every administrative action is logged to dedicated audit files.
*   **Identity Integrity**: Users are born in a "Pending" state and must clear the Deliverability Signal before being marked as "Valid".

## 🌐 Production Deployment (The Cloud Nexus)

CareStream is deployed using a synchronized "Cloud Nexus" architecture for maximum security and scalability.

### **1. Infrastructure Map**
*   **Frontend**: Hosted on **Vercel** (`https://care-stream.vercel.app`)
*   **Backend**: Hosted on **AWS ECS** (Elastic Container Service)
*   **Public Gateway**: **DuckDNS** (`https://carestream-cloud.duckdns.org`)
*   **Certificate Authority**: **Let's Encrypt** (Automated via Certbot in `start.sh`)

### **2. Production Security Hardening**
*   **SSL Handshaking**: The system uses a non-destructive Certbot loop that detects "Dummy" vs "Real" certificates, ensuring the padlock 🔒 is always green.
*   **CORS Policy**: Configured to trust specific Vercel origins while permitting cross-domain production cookies.
*   **Protocol Enforcement**: Production environments force `wss://` (Secure WebSockets) for all clinical telemetry to prevent mixed-content blocking.
*   **Root Gateway**: The application root (`/`) is locked and automatically redirects to the System Authentication Nexus.

### **3. Scaling to Production**

To deploy a new instance of the CareStream Nexus:
1.  **Backend (AWS ECR)**:
    ```bash
    docker build -t carestream-backend:latest .
    docker tag carestream-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/carestream-backend:latest
    docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/carestream-backend:latest
    ```
2.  **Frontend (Vercel)**:
    Set the following Environment Variables:
    *   `NEXT_PUBLIC_API_URL`: `https://carestream-cloud.duckdns.org/api/`
    *   `NEXT_PUBLIC_WS_URL`: `wss://carestream-cloud.duckdns.org/ws`

---

## 📥 Installation & Setup

1.  **Clone the Repository**
2.  **Environment Setup**:
    *   Configure `.env` in the `backend` folder (see `.env.example`).
    *   Add `SENDGRID_API_KEY` and `NGROK_AUTHTOKEN`.
3.  **Launch with Docker**:
    ```bash
    docker-compose up --build
    ```
4.  **Access the Dashboard**:
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:8000/api/`
