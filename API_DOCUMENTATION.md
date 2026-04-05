# 🚌 School Bus Tracking System - API Documentation (v1)

Welcome to the School Bus Tracking System API! This API drives the backend for a multi-tenant tracking platform connecting Schools, Drivers, and Parents.

## 🌟 Getting Started

**Base URL**: `http://localhost:5000/api/v1`

### Authentication
Most endpoints are protected and require a **JSON Web Token (JWT)**.
1.  **Login** to get a `token`.
2.  Include the token in the **Authorization** header of subsequent requests:
    ```http
    Authorization: Bearer <your_token>
    ```

---

## 🔐 Authentication

### Unified Login
A single endpoint handles login for all roles.
- **Endpoint**: `/auth/login`
- **Method**: `POST`

**Request Body (School/Admin):**
> **Note:** For new schools, the first login triggers an OTP sent to email. You must provide `otp` in the second request to verify. **(TEMPORARILY BYPASSED: Currently only requires email/password to ease testing).**
```json
{
  "role": "school", // or "admin"
  "email": "admin@greenwood.com",
  "password": "password123"
}
```

**Request Body (Driver/Parent):**
```json
{
  "role": "driver", // or "parent"
  "phone": "9876543210",
  "otp": "1234"
}
```

### Logout
Invalidate the current session (client should also clear the token).
- **Endpoint**: `/auth/logout`
- **Method**: `POST`

---

## 🛡️ Super Admin
*Requires `Admin` Role*

### 1. Dashboard Stats
Get global count of Schools, Buses, and Students.
- **Endpoint**: `/admin/dashboard`
- **Method**: `GET`

### 2. Live Tracking (Global)
Get all active drivers/buses with their current location.
- **Endpoint**: `/admin/live-tracking`
- **Method**: `GET`

### 3. Global Attendance Reports
Get attendance statistics and records for all schools.
- **Endpoint**: `/admin/attendance`
- **Method**: `GET`
- **Query Params**: `?date=2023-10-27&schoolId=...`

### 4. School Management (Admin Context)
Manage all schools in the system.
- **Endpoints**: 
    - `GET /admin/schools` (Lists all schools. Query: `page`, `limit`, `search`, `isActive`)
    - `POST /admin/schools` (Create school. Body: `name`, `email`, `password`, `address`, `schoolID`)
    - `PATCH /admin/schools/:id` (Update school. Body: any field including `isActive`)
    - `DELETE /admin/schools/:id` (Delete school)

### 5. Global Resource Management
Admins can manage any resource in the system. All actions are **Logged** in the `AuditLogs` collection.
- **Endpoints**:
    - `/admin/buses` (GET/POST/PATCH/DELETE)
    - `/admin/routes` (GET/POST/PATCH/DELETE)
    - `/admin/students` (GET/POST/PATCH/DELETE)
- **Common Query Params for LIST APIs**:
    - `page`: Page number (default 1)
    - `limit`: Records per page (default 10)
    - `search`: Case-insensitive search on primary fields (name, number, ID)
    - `isActive`: Filter by status (`true`/`false`)
    - `schoolId`: Filter resources by a specific school.

---

## 🏫 School Management (School Context)
*Requires `School` Role*

### 1. Dashboard & Reports
- **Dashboard**: `GET /school/dashboard`
- **Attendance**: `GET /school/attendance`
- **Live**: `GET /school/live-tracking`

### 2. Resource Management
Manage resources **strictly for your own school**. All actions are **Logged**.
- **Endpoints**:
    - `/school/buses` (GET/POST/PATCH/DELETE)
    - `/school/drivers` (GET/POST/PATCH/DELETE)
    - `/school/routes` (GET/POST/PATCH/DELETE)
    - `/school/students` (GET/POST/PATCH/DELETE)
- **Common Query Params for LIST APIs**:
    - `page`, `limit`, `search`, `isActive` (Same as Admin)

---

## 🚌 Driver Operations
*Requires `Driver` Role*

### 1. Core Operations
- **Dashboard**: `GET /driver/dashboard`
- **Start Trip**: `POST /driver/trip/start`
- **Update Location**: `PATCH /driver/trip/location`
- **Mark Attendance**: `POST /driver/attendance`

### 2. Instant Alerts (New)
Drivers can push real-time alerts to parents and schools.
- **Alert Parents (Route Updates)**:
    - **Endpoint**: `/driver/alerts/parents`
    - **Method**: `POST`
    - **Body**: `{ "type": "Delay", "message": "10 mins late" }`
    - **Types**: `Route Change`, `Delay`, `Breakdown`
- **Panic Button (Emergency)**:
    - **Endpoint**: `/driver/alerts/emergency`
    - **Method**: `POST`
    - **Description**: Instantly notifies the school administration room.

---

## 📡 Real-time (Socket.IO)
Connect to `socket.io` server for instant updates.

### Rooms to Join
- **`route:<routeId>`**: Join this to receive alerts for a specific bus route.
- **`school:<schoolId>`**: Join this (School Admins) to receive emergency panic alerts.

### Events
- **`routeAlert`**: Data: `{ type, message, timestamp }`
- **`emergencyAlert`**: Data: `{ driverName, driverPhone, message, timestamp }`
- **`locationUpdate`**: Data: `{ driverId, lat, lng }` (Sent to room `route:ID`)

---

## 👨‍👩‍👧 Parent Access
*Requires `Parent` Role (Phone Auth)*

- **Get My Children**: `GET /parent/children`

---

### ⚠️ Error Handling
Standard error format. 
```json
{
  "status": "fail", // or "error"
  "message": "Error description here"
}
```
