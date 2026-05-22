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

### Authentication Flow (Driver/Parent)

#### 1. Send OTP
Request a 4-digit code.
- **Endpoint**: `/auth/send-otp`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "role": "driver", // or "parent"
    "phone": "9876543210"
  }
  ```
- **Response**: `200 OK`. The OTP is returned in the `otp` key for testing purposes.
  ```json
  {
    "status": "success",
    "message": "OTP sent successfully",
    "role": "driver",
    "otp": "1234" 
  }
  ```

#### 2. Verify OTP (Login)
Submit the code to receive a JWT token.
- **Endpoint**: `/auth/verify-otp`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "phone": "9876543210",
    "role": "driver",
    "otp": "1234"
  }
  ```

---

### Legacy/Unified Login (Admin/School)
A single endpoint handles initial login.
- **Endpoint**: `/auth/login`
- **Method**: `POST`

**Request Body Structure:**
- **School / Admin**:
  ```json
  {
    "role": "school", // or "admin"
    "email": "admin@greenwood.com",
    "password": "password123"
  }
  ```
- **Driver / Parent (Email & Password)**:
  ```json
  {
    "role": "driver", // or "parent"
    "email": "praveen@yopmail.com",
    "password": "Praveen@05"
  }
  ```
- **Driver / Parent (Phone & OTP)**:
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
- **Live Tracking (Drivers)**: `GET /school/live-tracking`
- **Active Trips (Map/List View)**: `GET /school/active-trips` (Returns all ongoing trips with real-time driver coordinates, bus, and route details)

### 2. Resource Management
Manage resources **strictly for your own school**. All actions are **Logged**.

#### 🚌 Buses
- **Endpoints**: `GET/POST/PATCH/DELETE /school/buses`
- **Fields (List & Add)**:
    - `busId`: Custom ID for the bus.
    - `busNumber`: Registration number.
    - `capacity`: Seating capacity.
    - `assignedRoute`: The Route ID assigned to this bus (Populated in list/get operations).
- **Route Details (Populated on `GET`)**:
    - `assignedRoute.routeName`: Name of the route.
    - `assignedRoute.startPoint`: GeoJSON start coordinate.
    - `assignedRoute.endPoint`: GeoJSON end coordinate.
- **Searchable Fields**: `busNumber`, `busId`

#### 👨‍✈️ Drivers
- **Endpoints**: `GET/POST/PATCH/DELETE /school/drivers`
- **Fields (List)**: `name`, `phone` (Mobile), `licenseNumber`, `email`
- **Fields (Add)**: `name`, `phone`, `licenseNumber`, `email`, `password`
- **Searchable Fields**: `name`, `phone`, `licenseNumber`, `email`

#### 🛣️ Routes
- **Endpoints**: 
    - `GET/POST/PATCH/DELETE /school/routes`
    - `GET /school/routes/:routeId/buses` (Retrieve all buses assigned to this route)
- **Fields (List)**: `routeName`, `startPoint`, `endPoint`
- **Fields (Add)**:
    - `routeName`: Name of the route.
    - `startPoint`: `{ "type": "Point", "coordinates": [lng, lat], "name": "Start Name" }`
    - `endPoint`: `{ "type": "Point", "coordinates": [lng, lat], "name": "End Name" }`
- **Note**: Stops are currently optional and not required for core route definition.

#### 🎓 Students
- **Endpoints**: `GET/POST/PATCH/DELETE /school/students`
- **Fields (List)**:
    - `name`: Student Name.
    - `classGrade`: Class.
    - `section`: Section.
    - `parentPhone`: Parent Number.
    - `assignedRoute`: Route (Populated).
    - `assignedBus`: Bus (Populated).
    - `parentEmail`, `parentPassword`: Parent Credentials.
    - `studentRollId`: Roll No.
- **Fields (Add)**: `name`, `classGrade`, `section`, `parentPhone`, `assignedRoute`, `assignedBus`, `parentEmail`, `studentRollId`
- **Validation Constraints**: 
    - `assignedRoute` (if provided) must exist and belong to the school.
    - `assignedBus` (if provided) must exist, belong to the school, and be assigned to the student's `assignedRoute`.
- **Searchable Fields**: `name`, `studentRollId`, `parentPhone`, `parentEmail`

#### Common Query Params for LIST APIs:
- `page`, `limit`, `search`, `isActive`

---

## 🚌 Driver Operations
*Requires `Driver` Role*

### 1. Core Operations
- **Dashboard**: `GET /driver/dashboard` (Returns `tripStatus: 'Ongoing'` or `'pending'` and contextual data)
- **Get School Routes**: `GET /driver/routes` (Returns all routes for the driver's school)
- **Get Buses by Route**: `GET /driver/routes/:routeId/buses` (Returns all buses assigned to a specific route)
- **Get Students List**: `GET /driver/students?routeId=X&busId=Y`
- **Start Trip**: `POST /driver/trip/start` (Body requires `busId`, `routeId`, `schoolId`, and `type` (Pickup/Drop))
- **Update Location**: `PATCH /driver/trip/location`
- **Mark Attendance**: `POST /driver/attendance`
- **End Trip**: `POST /driver/trip/end`

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
- **`route:<routeId>`**: Join this to receive initial `tripStarted` alerts for a specific bus route.
- **`trip:<tripId>`**: **(NEW)** Join this immediately after a trip starts to receive real-time 2-second location updates and `tripEnded` alerts for that specific trip.
- **`school:<schoolId>`**: Join this (School Admins) to receive emergency panic alerts.

### Events
- **`tripStarted`**: Data: `{ tripId, type }` (Sent to room `route:ID`. Parents use this `tripId` to join the trip room)
- **`tripEnded`**: Data: `{ tripId }` (Sent to room `trip:ID`)
- **`routeAlert`**: Data: `{ type, message, timestamp }` (Sent to room `trip:ID`)
- **`emergencyAlert`**: Data: `{ driverName, driverPhone, busId, tripId, message, timestamp }`
- **`locationUpdate`**: Data: `{ driverId, lat, lng, tripId }` (Sent to room `trip:ID`)

---

## 👨‍👩‍👧 Parent Access
*Requires `Parent` Role (Phone Auth)*

- **Get My Children**: `GET /parent/children`

---

## ⚠️ Error Handling
The API uses standard HTTP status codes and a consistent JSON error format.

### Error Response Format
```json
{
  "status": "fail", // or "error"
  "message": "Descriptive error message"
}
```

### Common Error Codes:
- **400 Bad Request**: 
  - **Duplicate Data**: When a unique field (like phone, email, or busId) is already registered.
  - **Validation Error**: When required fields are missing or invalid.
  - **Invalid Query**: When pagination or search parameters are malformed.
- **401 Unauthorized**: Missing or invalid JWT token.
- **403 Forbidden**: Role-based access denied.
- **404 Not Found**: Resource doesn't exist.
- **500 Internal Server Error**: Unexpected server error.

---

## 🔍 Pagination & Search
All LIST APIs support the following parameters:

- **`page`**: The page number to retrieve (default: 1).
- **`limit`**: Number of records per page. **If omitted, the API returns the full list.**
- **`search`**: A string to search across primary fields (e.g., name, phone, number). 
  - Special characters are automatically escaped.
- **`isActive`**: Filter by active/inactive status (`true`/`false`).

---
