# School Bus Tracking System (Backend)

A high-performance, scalable backend for tracking school buses in real-time. Built with Node.js, Express, MongoDB, Redis, and Socket.IO.

## 🚀 Features

- **Multi-Tenant Architecture**: Supports Super Admin, multiple Schools, Drivers, and Parents.
- **Real-time Tracking**: Updates driver locations via Socket.IO and persists optimized data.
- **Geo-Fencing**: Automated proximity alerts (2KM radius) using MongoDB Geospatial queries.
- **Performance**:
  - **Redis Caching**: Caches active trips and session data.
  - **Optimized DB**: Compound indexes and GeoJSON support.
- **Security**:
  - JWT Authentication & Referesh Tokens.
  - Role-Based Access Control (RBAC).
  - Rate Limiting, Helmet, and Input Validation.

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
 ├── controllers/    # Request handlers
 ├── middleware/     # Auth, Validation, Error handling
 ├── models/         # Mongoose Schemas
 ├── repositories/   # Data Access Layer
 ├── routes/         # API Routes
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

### Auth
- `POST /api/v1/auth/school/login`
- `POST /api/v1/auth/driver/login`

### School (Admin)
- `POST /api/v1/school/drivers` - Create Driver
- `POST /api/v1/school/buses` - Create Bus
- `PUT /api/v1/school/routes` - Create Route

### Driver
- `POST /api/v1/driver/trip/start` - Start Trip
- `PATCH /api/v1/driver/trip/location` - Update Location
- `POST /api/v1/driver/attendance` - Mark Attendance

### Parent
- `GET /api/v1/parent/children` - Get Linked Children

---
*Built for scale and performance.*
