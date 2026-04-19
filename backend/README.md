# 🚛 Sairaj Transport – Backend API

Node.js + Express.js + MySQL backend for the Sairaj Transport Management System.

---

## 📁 Project Structure

```
backend/
├── server.js                   ← Entry point, starts Express server
├── package.json                ← Dependencies & scripts
├── .env.example                ← Copy to .env and fill credentials
│
├── config/
│   └── db.js                   ← MySQL connection pool
│
├── models/
│   ├── User.js                 ← User DB queries (findByEmail, create)
│   ├── Truck.js                ← Truck DB queries (getAll, findById)
│   └── Booking.js              ← Booking DB queries (create, getByUserId, findByBookingId)
│
├── routes/
│   ├── authRoutes.js           ← POST /api/signup, POST /api/login
│   ├── truckRoutes.js          ← GET /api/trucks
│   └── bookingRoutes.js        ← POST /api/book, GET /api/bookings/:userId, GET /api/track/:bookingId
│
├── controllers/
│   ├── authController.js       ← Signup & Login business logic
│   ├── truckController.js      ← Truck listing logic
│   └── bookingController.js    ← Booking creation, history, tracking
│
└── database/
    └── schema.sql              ← MySQL table creation + sample data
```

---

## ⚙️ Setup Instructions

### Step 1 — Install Node.js & MySQL

- Node.js: https://nodejs.org (version 16 or higher)
- MySQL: https://dev.mysql.com/downloads/mysql/ (version 8.0)

### Step 2 — Set up the Database

Open MySQL Workbench or terminal and run:

```sql
source /path/to/backend/database/schema.sql
```

Or using the terminal:
```bash
mysql -u root -p < database/schema.sql
```

This will:
- Create the `sairaj_transport` database
- Create `users`, `trucks`, and `bookings` tables
- Insert 6 sample trucks and 3 sample bookings for testing

### Step 3 — Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and set your values:
```

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sairaj_transport
JWT_SECRET=any_long_random_string_here
JWT_EXPIRES_IN=7d
```

### Step 4 — Install Dependencies

```bash
cd backend
npm install
```

### Step 5 — Start the Server

```bash
# Normal start
npm start

# Development mode (auto-restarts on file changes)
npm run dev
```

You should see:
```
🚛  Sairaj Transport Backend
✅  Server running at http://localhost:5000
✅  MySQL Connected to database: sairaj_transport
```

---

## 🔌 API Reference

### Base URL
```
http://localhost:5000/api
```

---

### 1. POST /api/signup — Register a new user

**Request Body (JSON):**
```json
{
  "name":     "Rahul Sharma",
  "email":    "rahul@example.com",
  "phone":    "9876543210",
  "company":  "Sharma Traders",
  "password": "mypassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id":      3,
    "name":    "Rahul Sharma",
    "email":   "rahul@example.com",
    "phone":   "9876543210",
    "company": "Sharma Traders"
  }
}
```

**Error Response (409 – Email already exists):**
```json
{
  "success": false,
  "message": "An account with this email already exists."
}
```

---

### 2. POST /api/login — Login an existing user

**Request Body (JSON):**
```json
{
  "email":    "rahul@example.com",
  "password": "mypassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id":      3,
    "name":    "Rahul Sharma",
    "email":   "rahul@example.com",
    "phone":   "9876543210",
    "company": "Sharma Traders"
  }
}
```

**Error Response (401 – Wrong password):**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

### 3. GET /api/trucks — Get available trucks

**URL:** `GET /api/trucks`

**Optional Query Params:**
| Param      | Values                            | Example                        |
|------------|-----------------------------------|--------------------------------|
| `type`     | Container, Open Body, Refrigerated, Trailer | `?type=Container`     |
| `capacity` | upto12, 12to20, 20plus            | `?capacity=12to20`             |

**Examples:**
```
GET /api/trucks                            ← all trucks
GET /api/trucks?type=Container             ← only containers
GET /api/trucks?capacity=upto12            ← trucks up to 12 tons
GET /api/trucks?capacity=12to20&type=Container  ← combined filter
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id":             1,
      "truck_number":   "MH 20 AB 1234",
      "type":           "Container",
      "capacity_tons":  20,
      "base_location":  "Aurangabad",
      "year":           2021,
      "status":         "Available",
      "owner_name":     "Bharat Khese",
      "owner_phone":    "9284652405",
      "created_at":     "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. POST /api/book — Submit a booking

**Request Body (JSON):**
```json
{
  "userId":             3,
  "pickupLocation":     "Aurangabad, MH",
  "destination":        "Mumbai, MH",
  "goodsType":          "Agricultural Products",
  "weight":             12.5,
  "pickupDate":         "2024-12-20",
  "preferredTruckType": "Container",
  "notes":              "Handle with care"
}
```

**Success Response (201):**
```json
{
  "success":   true,
  "message":   "Booking submitted successfully! The transport owner will contact you for pricing.",
  "data": {
    "id":        7,
    "bookingId": "BK985231",
    "status":    "Pending"
  }
}
```

---

### 5. GET /api/bookings/:userId — Get all bookings for a user

**URL:** `GET /api/bookings/3`

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id":                  7,
      "booking_id":          "BK985231",
      "user_id":             3,
      "truck_id":            null,
      "pickup_location":     "Aurangabad, MH",
      "destination":         "Mumbai, MH",
      "goods_type":          "Agricultural Products",
      "weight_tons":         12.5,
      "pickup_date":         "2024-12-20T00:00:00.000Z",
      "preferred_truck_type":"Container",
      "notes":               "Handle with care",
      "status":              "Pending",
      "created_at":          "2024-12-15T08:30:00.000Z",
      "truck_number":        null,
      "truck_type":          null,
      "capacity_tons":       null
    }
  ]
}
```

---

### 6. GET /api/track/:bookingId — Track a shipment

**URL:** `GET /api/track/BK1001`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id":               1,
    "booking_id":       "BK1001",
    "pickup_location":  "Aurangabad, MH",
    "destination":      "Mumbai, MH",
    "goods_type":       "Agricultural Products",
    "weight_tons":      15,
    "pickup_date":      "2024-12-10T00:00:00.000Z",
    "status":           "In Transit",
    "created_at":       "2024-12-09T10:00:00.000Z",
    "user_name":        "Test User",
    "user_phone":       "9999999999",
    "truck_number":     "MH 20 AB 1234",
    "truck_type":       "Container",
    "owner_name":       "Bharat Khese",
    "owner_phone":      "9284652405"
  }
}
```

**Not Found Response (404):**
```json
{
  "success": false,
  "message": "Booking ID \"BK9999\" not found. Please check and try again."
}
```

---

## 🌐 Connecting the HTML Frontend to the API

Replace the dummy data in your HTML pages with these `fetch()` API calls:

### signup.html – Create Account

```javascript
async function handleSignup(e) {
  e.preventDefault();

  const userData = {
    name:     document.getElementById('fullname').value,
    email:    document.getElementById('workemail').value,
    phone:    document.getElementById('mobile').value,
    company:  document.getElementById('company').value,
    password: document.getElementById('newpassword').value
  };

  try {
    const response = await fetch('http://localhost:5000/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (result.success) {
      // Save token and user info in localStorage
      localStorage.setItem('token',  result.token);
      localStorage.setItem('userId', result.user.id);
      localStorage.setItem('userName', result.user.name);

      alert('Account created successfully!');
      window.location.href = 'index.html';
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('Network error. Is the backend running?');
  }
}
```

### login.html – Login

```javascript
async function handleLogin(e) {
  e.preventDefault();

  const credentials = {
    email:    document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem('token',    result.token);
      localStorage.setItem('userId',   result.user.id);
      localStorage.setItem('userName', result.user.name);

      window.location.href = 'index.html';
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('Network error. Is the backend running?');
  }
}
```

### trucks.html – Load Trucks from API

```javascript
async function loadTrucks(capacity = '', type = '') {
  let url = 'http://localhost:5000/api/trucks';
  const params = new URLSearchParams();
  if (capacity) params.append('capacity', capacity);
  if (type)     params.append('type', type);
  if (params.toString()) url += '?' + params.toString();

  const response = await fetch(url);
  const result   = await response.json();

  const grid = document.querySelector('.trucks-grid');
  grid.innerHTML = '';

  result.data.forEach(truck => {
    grid.innerHTML += `
      <div class="truck-card">
        <div class="truck-img-placeholder">🚛</div>
        <div class="truck-info">
          <div class="truck-header">
            <div class="truck-number">${truck.truck_number}</div>
            <span class="badge ${truck.status === 'Available' ? 'badge-green' : 'badge-orange'}">
              ● ${truck.status}
            </span>
          </div>
          <div class="truck-details">
            <div class="truck-detail">
              <span class="label">Type</span>
              <span class="value">${truck.type}</span>
            </div>
            <div class="truck-detail">
              <span class="label">Capacity</span>
              <span class="value">${truck.capacity_tons} Tons</span>
            </div>
            <div class="truck-detail">
              <span class="label">Base Location</span>
              <span class="value">${truck.base_location}</span>
            </div>
            <div class="truck-detail">
              <span class="label">Year</span>
              <span class="value">${truck.year}</span>
            </div>
          </div>
        </div>
        <div class="truck-footer">
          <div class="truck-owner">
            <strong>${truck.owner_name}</strong>
            <a href="tel:${truck.owner_phone}">📞 ${truck.owner_phone}</a>
          </div>
          <a href="book.html"><button class="btn btn-primary btn-sm">Book Now</button></a>
        </div>
      </div>`;
  });
}

// Call on page load
loadTrucks();
```

### book.html – Submit Booking

```javascript
async function handleBook(e) {
  e.preventDefault();

  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('Please login first to book a truck.');
    window.location.href = 'login.html';
    return;
  }

  const bookingData = {
    userId:             parseInt(userId),
    pickupLocation:     document.getElementById('pickup').value,
    destination:        document.getElementById('dest').value,
    goodsType:          document.getElementById('goods').value,
    weight:             parseFloat(document.getElementById('weight').value),
    pickupDate:         document.getElementById('pickdate').value,
    preferredTruckType: document.getElementById('trucktype').value,
    notes:              document.getElementById('notes').value
  };

  try {
    const response = await fetch('http://localhost:5000/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('successMsg').style.display = 'block';
      document.getElementById('successMsg').querySelector('h3').textContent =
        `Booking Submitted! ID: ${result.data.bookingId}`;
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert('Network error. Is the backend running?');
  }
}
```

### track.html – Track Shipment

```javascript
async function trackShipment() {
  const bookingId = document.getElementById('trackInput').value.trim().toUpperCase();

  try {
    const response = await fetch(`http://localhost:5000/api/track/${bookingId}`);
    const result   = await response.json();

    if (!result.success) {
      document.getElementById('trackError').style.display = 'block';
      return;
    }

    const s = result.data;
    document.getElementById('resultId').textContent  = s.booking_id;
    document.getElementById('tGoods').textContent    = s.goods_type;
    document.getElementById('tPickup').textContent   = s.pickup_location;
    document.getElementById('tDest').textContent     = s.destination;
    document.getElementById('tTruck').textContent    = s.truck_number || 'Not yet assigned';
    document.getElementById('tDate').textContent     = new Date(s.pickup_date).toLocaleDateString('en-IN');
    document.getElementById('tUpdated').textContent  = new Date(s.created_at).toLocaleString('en-IN');

    // Set status badge
    const badge = document.getElementById('statusBadge');
    badge.textContent = s.status;
    const badgeMap = { 'Pending':'badge-orange', 'In Transit':'badge-blue', 'Delivered':'badge-green' };
    badge.className = 'badge ' + (badgeMap[s.status] || 'badge-grey');

    document.getElementById('trackResult').classList.add('visible');
  } catch (err) {
    alert('Network error. Is the backend running?');
  }
}
```

### booking-history.html – Show My Bookings

```javascript
async function loadMyBookings() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  const response = await fetch(`http://localhost:5000/api/bookings/${userId}`);
  const result   = await response.json();

  const tbody = document.querySelector('.booking-table tbody');
  tbody.innerHTML = '';

  if (result.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No bookings found.</td></tr>';
    return;
  }

  result.data.forEach(b => {
    tbody.innerHTML += `
      <tr>
        <td>${b.booking_id}</td>
        <td>${b.goods_type}</td>
        <td>${b.pickup_location}</td>
        <td>${b.destination}</td>
        <td>${new Date(b.pickup_date).toLocaleDateString('en-IN')}</td>
        <td>${b.status}</td>
        <td><a href="track.html?id=${b.booking_id}">Track</a></td>
      </tr>`;
  });
}

loadMyBookings();
```

---

## 🗄️ Database Tables Summary

| Table      | Key Columns                                                                          |
|------------|--------------------------------------------------------------------------------------|
| `users`    | id, name, email, phone, company, password (hashed), created_at                      |
| `trucks`   | id, truck_number, type, capacity_tons, base_location, year, status, owner_name      |
| `bookings` | id, booking_id, user_id, truck_id, pickup_location, destination, status, created_at |

---

## 🧪 Testing the API with Postman

1. Download Postman from https://www.postman.com
2. Create a new request collection called "Sairaj Transport"
3. Test each endpoint using the examples above
4. For GET requests use the URL bar; for POST requests use the Body → raw → JSON tab

---

## 🚀 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `MySQL Connection Failed` | Check `.env` DB credentials. Make sure MySQL service is running. |
| `Cannot find module 'express'` | Run `npm install` in the backend folder |
| `EADDRINUSE: address already in use` | Change `PORT` in `.env` to 5001 or kill the existing process |
| `Access denied for user 'root'@'localhost'` | Verify MySQL username and password in `.env` |
| CORS error in browser | The `cors()` middleware in `server.js` should handle this automatically |

---

## 📞 Owner Contact

Bharat Khese — Transport Owner  
📱 9284652405  
✉️ kheesebharat@gmail.com  
📍 Plot No. E-34 Waluj Trade Center, MIDC Waluj Ranjangaon Phata, Chhatrapati Sambhajinagar