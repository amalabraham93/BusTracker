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
> **Note:** For new schools, the first login triggers an OTP sent to email. You must provide `otp` in the second request to verify. Subsequent logins only need email/password.
```json
{
  "role": "school", // or "admin"
  "email": "admin@greenwood.com",
  "password": "password123",
  "otp": "1234" // Required for first-time verification
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

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "data": { "user": { "id": "...", "role": "school", ... } }
}
```

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
Get attendance statistics (Total, Boarded, Dropped, Absent) and records for all schools (or filtered).
- **Endpoint**: `/admin/attendance`
- **Method**: `GET`
- **Query Params**: `?date=2023-10-27&schoolId=...`

### 4. Create School
Register a new School with login credentials.
Register a new School with login credentials.
- **Endpoint**: `/admin/schools`
- **Method**: `POST`

**Request Body:**
```json
{
  "name": "Greenwood High",
  "email": "admin@greenwood.com",
  "password": "password123",
  "address": "123 Main St"
}
```

---

## 🏫 School Management (Admin)
*Requires `School` Role*

### 1. Dashboard Stats
Get count of Routes, Buses, Students, and Drivers for *your* school.
- **Endpoint**: `/school/dashboard`
- **Method**: `GET`

### 2. Attendance Dashboard
Get attendance statistics (Total, Boarded, Dropped, Absent) and records for the school.
- **Endpoint**: `/school/attendance`
- **Method**: `GET`
- **Query Params**: `?date=2023-10-27`

### 3. Live Tracking (School)
Get active drivers/buses for your school.
- **Endpoint**: `/school/live-tracking`
- **Method**: `GET`

### 4. Create Driver
Register a new driver for your school.
- **Endpoint**: `/school/drivers`
- **Method**: `POST`

**Request Body:**
```json
{
  "name": "John Smith",
  "licenseNumber": "DL-123456789",
  "phone": "9876543210",
    "assignedBus": "..." // Bus ID
}
```

### 4. Get Drivers
Get list of drivers.
- **Endpoint**: `/school/drivers`
- **Method**: `GET`

### 5. Create Bus
Add a new bus to the fleet.
- **Endpoint**: `/school/buses`
- **Method**: `POST`

**Request Body:**
```json
{
  "busNumber": "KA-01-AB-9999",
  "capacity": 40,
  "assignedDriver": "60d5ecb8b3...1a", // Optional Driver ID
  "assignedRoute": "60d5ecb8b3...1b", // Route ID
  "gpsDeviceId": "GPS-101-XYZ",       // Optional
  "attender": "Jane Doe"              // Optional Attender Name
}
```

### 6. Get Buses
Get list of buses.
- **Endpoint**: `/school/buses`
- **Method**: `GET`

### 7. Create Route
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
      "location": { "type": "Point", "coordinates": [77.5946, 12.9716] } // [Lng, Lat]
    }
  ]
}
```

### 8. Get Routes
Get list of routes.
- **Endpoint**: `/school/routes`
- **Method**: `GET`

### 9. Create Student
Add student with Pickup/Drop location.
- **Endpoint**: `/school/students`
- **Method**: `POST`

**Request Body:**
```json
{
  "name": "Vignesh P",
  "studentRollId": "20142314",
  "classGrade": "10",
  "section": "C",
  "assignedBus": "...",
  "assignedRoute": "...",
  "parentPhone": "9876543210",         // Required for Parent Login
  "pickupLocation": { "type": "Point", "coordinates": [77.5946, 12.9716] } // Optional now
}
```

### 10. Get Students
Get list of students.
- **Endpoint**: `/school/students`
- **Method**: `GET`
```

---

## 🚌 Driver Operations
*Requires `Driver` Role*

### 1. Dashboard (My Details)
Get assigned Bus, Route, and Student List for the route.
- **Endpoint**: `/driver/dashboard`
- **Method**: `GET`

### 2. Start Trip
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

### 3. Update Location (Real-time)
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

### 4. Mark Attendance
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
Standard error format. Code `202` indicates OTP required for pending verification.
```json
{
  "status": "fail", // or "error" || "pending"
  "message": "Invalid password"
}
```
