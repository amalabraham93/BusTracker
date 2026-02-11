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

### 1. School Admin Login
Login for school administrators to manage their fleet.
- **Endpoint**: `/auth/school/login`
- **Method**: `POST`

**Request Body:**
```json
{
  "email": "admin@greenwood.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "data": { "user": { "name": "Greenwood High", "email": "..." } }
}
```

### 2. Driver Login
Login for drivers using their registered phone number and OTP.
- **Endpoint**: `/auth/driver/login`
- **Method**: `POST`

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "1234" 
}
```

---

## 🏫 School Management (Admin)
*Requires `School` Role*

### 1. Create Driver
Register a new driver for your school.
- **Endpoint**: `/school/drivers`
- **Method**: `POST`

**Request Body:**
```json
{
  "name": "John Smith",
  "licenseNumber": "DL-123456789",
  "phone": "9876543210"
}
```

### 2. Create Bus
Add a new bus to the fleet.
- **Endpoint**: `/school/buses`
- **Method**: `POST`

**Request Body:**
```json
{
  "busNumber": "KA-01-AB-9999",
  "capacity": 40,
  "assignedDriver": "60d5ecb8b3...1a" // Optional Driver ID
}
```

### 3. Create Route
Define a route with stops.
- **Endpoint**: `/school/routes`
- **Method**: `POST`

**Request Body:**
```json
{
  "routeName": "Route 5 - Downtown",
  "stops": [
    {
      "stopName": "Central Park",
      "location": { "type": "Point", "coordinates": [77.5946, 12.9716] }
    }
  ]
}
```

---

## 🚌 Driver Operations
*Requires `Driver` Role*

### 1. Start Trip
Start a trip session. This triggers push notifications to parents.
- **Endpoint**: `/driver/trip/start`
- **Method**: `POST`

**Request Body:**
```json
{
  "busId": "60d5...",
  "routeId": "60d5...",
  "schoolId": "60d5..."
}
```

### 2. Update Location (Real-time)
Send GPS updates. The server automatically checks for nearby students (2KM radius) and sends alerts.
- **Endpoint**: `/driver/trip/location`
- **Method**: `PATCH`

**Request Body:**
```json
{
  "lat": 12.9716,
  "lng": 77.5946
}
```
*Note: This endpoint is rate-limited to avoid spam.*

### 3. Mark Attendance
Update a student's status (Boarded/Dropped/Absent).
- **Endpoint**: `/driver/attendance`
- **Method**: `POST`

**Request Body:**
```json
{
  "studentId": "60d5...",
  "status": "Boarded" // Options: "Boarded", "Dropped", "Absent"
}
```

---

## 👨‍👩‍👧 Parent Access
*Requires `Parent` Role (Phone Auth)*

### 1. Get My Children
Fetch all students linked to the logged-in parent's phone number. Supports children in different schools.
- **Endpoint**: `/parent/children`
- **Method**: `GET`

**Response:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "children": [
      {
        "name": "Alice Code",
        "schoolId": { "name": "Greenwood High" },
        "pickupLocation": { "coordinates": [77.6, 12.9] }
      }
    ]
  }
}
```

---

### ⚠️ Error Handling
Standard error format:
```json
{
  "status": "fail", // or "error"
  "message": "Invalid credentials"
}
```
