# Smart Grievance Management System (SGMS)

A modern, AI-powered platform for citizens to report and track grievances, and for officers/admins to manage and resolve them.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v16 or higher
- **MongoDB**: Local installation or MongoDB Atlas URI
- **Python**: (Optional) For AI/ML features

---

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart_grievance
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the server (with nodemon):
   ```bash
   npm run dev
   ```

---

### 3. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```

---

## 🔑 Default Credentials (Mock Mode)

The system currently runs with in-memory mock data for testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` |
| **Officer** | `officer@example.com` | `password123` |
| **Citizen** | Register via the UI | (Set your own) |

---

## ✨ Key Features
- **Geo-Tagging**: Photos uploaded during grievance submission automatically capture GPS coordinates.
- **Priority Selection**: Users can choose between Normal, Medium, and Urgent priorities.
- **AI Analysis**: Backend placeholders ready for AI-based categorization and sentiment analysis.
- **Role-Based Access**: Specialized dashboards for Citizens, Officers, and Admins.

---

## 🛠 Troubleshooting
- **Port Conflict**: If port 5000 or 3000 is in use, change it in `.env` (backend) or `package.json` (frontend).
- **MongoDB**: Ensure your MongoDB service is running or the URI is correct.

