# School Bus Tracking System (Backend)

A high-performance, scalable backend for tracking school buses in real-time. Built with Node.js, Express, MongoDB, Redis, and Socket.IO.

## 🚀 Features

- **Multi-Tenant Architecture**: Supports Super Admin, multiple Schools, Drivers, and Parents.
- **Unified Authentication**: Single login point for all roles with Session/JWT management.
- **Role-Based Access Control (RBAC)**: Secure access for Admin, School, Driver, and Parent.
- **Real-time Tracking**: Updates driver locations via Socket.IO and persists optimized data.
- **Geo-Fencing**: Automated proximity alerts (2KM radius) using MongoDB Geospatial queries.
- **Smart Dashboards**: Aggregated statistics for Super Admins and School Admins.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Caching**: Redis
- **Real-time**: Socket.IO
- **Logging**: Winston

## 📂 Project Structure

```
src/
 ├── config/         # DB & Redis configs
 ├── controllers/    # Request handlers (Admin, School, Auth, Driver, Parent)
 ├── middleware/     # Auth, Validation, Error handling
 ├── models/         # Mongoose Schemas (School, Driver, Trip, etc.)
 ├── repositories/   # Data Access Layer
 ├── routes/         # API Routes (v1)
 ├── services/       # Business Logic
 ├── sockets/        # Socket.IO handlers
 ├── utils/          # Logger, AppError, etc.
 └── server.js       # Entry point
```

## ⚡ Setup & Run

### Prerequisites
- Node.js (v14+)
- MongoDB (Running locally or cloud URI)
- Redis (Running locally or cloud URL)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd BusTracker
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/school_bus_tracker
    REDIS_URL=redis://localhost:6379
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=1h
    NODE_ENV=development
    ```

4.  **Start the Server**:
    ```bash
    npm start
    ```

## 🧪 API Documentation

**Base URL**: `/api/v1`

### 🔐 Authentication
- `POST /auth/login` - Unified Login (Select role: `admin`, `school`, `driver`, `parent`)

### 🛡️ Super Admin
- `GET /admin/dashboard` - Global Stats (Schools, Buses, Students)
- `POST /admin/schools` - Create New School

### 🏫 School Management
- `GET /school/dashboard` - School Stats
- `POST /school/drivers` - Create Driver
- `POST /school/buses` - Create Bus
- `POST /school/routes` - Create Route

### 🚌 Driver
- `POST /driver/trip/start` - Start Trip
- `PATCH /driver/trip/location` - Update Live Location
- `POST /driver/attendance` - Mark Student Attendance

### 👨‍👩‍👧 Parent
- `GET /parent/children` - Get Linked Children & Status

---
*Built for scale and performance.*
