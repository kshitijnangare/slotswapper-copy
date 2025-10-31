# SlotSwapper: Peer-to-Peer Time-Slot Scheduling

SlotSwapper is a full-stack web application that enables users to swap time slots with each other. Users can mark their busy calendar slots as "swappable" and request to exchange them with other users' available slots.

-----

## 🎯 Features

  * **🔒 Secure User Authentication:** Full JWT-based authentication system with signup and login.
  * **📅 Calendar Management:** Full CRUD (Create, Read, Update, Delete) functionality for personal calendar events.
  * **🚦 Swap Status Management:** Easily mark events as `BUSY`, `SWAPPABLE`, or `SWAP_PENDING`.
  * **🏪 Marketplace:** A central page to browse and discover all swappable slots from other users.
  * **🤝 Swap Requests:** A complete peer-to-peer system to send, receive, `Accept`, and `Reject` slot swap requests.
  * **✨ Real-time Updates:** The UI dynamically updates without page reloads using React's state management.
  * **🔐 Protected Routes:** All sensitive pages and API routes are protected by authentication middleware.

-----

## 💡 Technology & Design Rationale

This project was built using a specific set of technologies to best solve the challenge, aligning with modern, robust web development practices.

### Frontend: React

React was chosen for its component-based architecture, which makes it easy to build a scalable and maintainable UI. Reusable components were created for the Navbar, Event Forms, and Marketplace items. The **Context API** is used to manage global authentication state, providing a clean way to share user data across the entire application without prop-drilling.

### Backend: Node.js & Express.js

Node.js (with Express) is the "N" and "E" in the **MERN** stack mentioned in the job description. Its asynchronous, non-blocking I/O model is ideal for building a high-performance REST API that can handle many concurrent requests for slot data and user authentication.

### Database: MySQL

A **SQL database (MySQL)** was a deliberate choice over a NoSQL database (like MongoDB). The core "swap" logic is a classic **relational transaction**.

> When a user accepts a swap, two `events` in the database must have their `owner_id` fields exchanged *at the same time*. This operation must be **atomic** (all-or-nothing).

MySQL's support for **ACID transactions** guarantees data integrity, preventing race conditions or partial updates that could corrupt the schedule. This relational model is the most robust and secure way to handle the core business logic of this application.

-----

## 🚀 Getting Started (Docker - Recommended)

This project is fully containerized with Docker. This is the simplest and most reliable way to run the application, as it manages the database, backend, and frontend in one command.

### 1\. Prerequisites

  * [Git](https://www.google.com/search?q=https://git-scm.com/downloads)
  * [Docker](https://www.docker.com/products/docker-desktop/)

### 2\. Clone the Repository

```bash
git clone https://github.com/your-username/slotswapper.git
cd slotswapper
```

### 3\. Create the Environment File

This project uses a single `.env` file in the **root** of the project to configure all services.

1.  Copy the example file from the `backend` folder to the **root** folder.

    ```bash
    # (From the root 'slotswapper' directory)
    cp backend/.env.example .env
    ```

2.  Open the new `.env` file and fill in the variables. **It is critical that `DB_HOST` is set to `db`**.

    ```env
    # /slotswapper/.env

    # Backend
    PORT=5000
    NODE_ENV=development

    # Database (for Docker Compose)
    DB_HOST=db
    DB_USER=root
    DB_PASSWORD=your-strong-password-here
    DB_NAME=slotswapper_db

    # Security
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRE=7d
    ```

### 4\. Build and Run the Application

Run the following command from the root `slotswapper` directory:

```bash
docker-compose up --build
```

*(Add `-d` to run in detached (background) mode)*

### 5\. Access the Application

  * **Frontend:** `http://localhost:3000`
  * **Backend API:** `http://localhost:8080`

### 6\. Stop the Application

  * If running in the foreground, press `Ctrl + C`.
  * Run the following command to stop and remove all containers:
    ```bash
    docker-compose down
    ```

-----

## 🛠️ Option 2: Manual Local Setup

\<details\>
\<summary\>Click to expand for manual setup instructions\</summary\>

If you prefer to run the services manually on your own machine, you will need two terminals.

**Prerequisites:**

  * [Node.js](https://nodejs.org/) (v16 or higher)
  * [MySQL Server](https://dev.mysql.com/downloads/installer/) (v8.0 or higher)

### Terminal 1: Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Configure Environment:**
      * **Important:** For this manual setup, use the `.env` file inside the `backend` folder.
      * `cp .env.example .env`
      * Edit `backend/.env` with your **local** database credentials.
      * **Ensure `DB_HOST` is set to `localhost`**
        ```env
        # /backend/.env
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=your_local_mysql_password
        DB_NAME=slotswapper_db
        # ... (rest of the variables)
        ```
4.  **Create MySQL Database:**
      * Log in to your local MySQL server and run:
      * `CREATE DATABASE slotswapper_db;`
5.  **Start the Backend Server:**
    ```bash
    npm start
    ```
    The server will start on `http://localhost:5000` and automatically create the tables.

### Terminal 2: Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Create Environment File (Optional but Recommended):**
      * Create a `.env` file in the `frontend` directory.
      * Add the following line:
        ```env
        # /frontend/.env
        VITE_API_URL=http://localhost:5000/api
        ```
      * *(If you don't do this, the app will default to `http://localhost:8080/api`)*
4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The application will open at `http://localhost:5173` (or a similar port).

\</details\>

-----

## 🐛 Common Error Resolution

  * **Error (Docker):** `Port is already allocated` or `Address already in use`.

      * **Cause:** You have another service running on port `8080`, `3000`, or (most likely) `3306`.
      * **Solution:** Stop your local MySQL server or any other application using those ports. `docker-compose up` provides its own MySQL server.

  * **Error (Docker):** Backend logs show `connect ECONNREFUSED 127.0.0.1:3306`.

      * **Cause:** The `DB_HOST` in your root `.env` file is set to `localhost`.
      * **Solution:** Change `DB_HOST=localhost` to `DB_HOST=db` in the root `.env` file and restart with `docker-compose up`. `db` is the service name of the MySQL container.

  * **Error (Manual):** Backend logs show `connect ECONNREFUSED 127.0.0.1:3306`.

      * **Cause:** Your local MySQL server is not running.
      * **Solution:** Start your MySQL server service.

  * **Error:** Frontend loads, but Login/Signup fails (check the browser's Network tab).

      * **Cause:** The backend is not running or the frontend is pointing to the wrong API address.
      * **Solution (Docker):** Make sure your backend container is running. Your frontend is hard-coded to look for `http://localhost:8080/api`.
      * **Solution (Manual):** Make sure your backend server is running on `http://localhost:5000` and that your `frontend/.env` file `VITE_API_URL` variable is set correctly.

-----

## 📡 API Endpoints

All protected endpoints require a JWT token in the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description | Auth Req. |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in a user | No |
| `GET` | `/api/auth/profile`| Get the current user's profile | Yes |

### Events (Calendar Slots)

| Method | Endpoint | Description | Auth Req. |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/events` | Get all events for the logged-in user | Yes |
| `POST` | `/api/events` | Create a new event | Yes |
| `PUT` | `/api/events/:id` | Update an event (e.g., set status) | Yes |
| `DELETE` | `/api/events/:id` | Delete an event | Yes |

### Swapping

| Method | Endpoint | Description | Auth Req. |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/swappable-slots` | Get all `SWAPPABLE` events from *other* users | Yes |
| `GET` | `/api/my-requests` | Get user's incoming & outgoing swap requests | Yes |
| `POST` | `/api/swap-request` | Request a new swap | Yes |
| `POST` | `/api/swap-response/:requestId` | `Accept` or `Reject` an incoming swap request | Yes |

-----

## 🔑 Key Implementation Details

### The Core Swap Logic

The most critical part of the backend is the transaction-safe swap logic.

1.  **Creating a Swap Request (`POST /api/swap-request`)**

      * A MySQL transaction is started.
      * The system verifies that `mySlotId` belongs to the current user and `theirSlotId` belongs to another.
      * It locks both `event` rows to prevent race conditions.
      * It confirms both slots are currently `SWAPPABLE`.
      * A new `swap_requests` record is created with `PENDING` status.
      * Both `event` records are updated to `SWAP_PENDING` (this removes them from the marketplace).
      * The transaction is committed. If any step fails, the entire operation is rolled back.

2.  **Responding to a Swap (`POST /api/swap-response/:id`)**

      * A MySQL transaction is started.
      * The system finds the `swap_requests` record and locks the two associated `event` records.
      * It verifies the current user is the *receiver* of the request.
      * **If `accept: true`:**
          * The `owner_id` of `event_A` is given to `event_B`.
          * The `owner_id` of `event_B` is given to `event_A`.
          * Both events' statuses are set back to `BUSY`.
          * The `swap_requests` record is set to `ACCEPTED`.
      * **If `accept: false` (Rejected):**
          * Both events' statuses are set back to `SWAPPABLE` (returning them to the marketplace).
          * The `swap_requests` record is set to `REJECTED`.
      * The transaction is committed.

-----

## 📁 Project Structure

```
slotswapper/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # Sequelize connection & models sync
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT verification middleware
│   │   ├── models/              # Sequelize models (User, Event, SwapRequest)
│   │   ├── controllers/         # Business logic for each route
│   │   ├── routes/              # API route definitions
│   │   └── server.js            # Express server entry point
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile             # Builds the backend container
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── context/             # AuthContext
│   │   ├── services/            # Axios API layer
│   │   ├── App.jsx
│   │   └── index.js
│   ├── .dockerignore
│   ├── Dockerfile             # Multi-stage build for React app
│   ├── nginx.conf             # Nginx config for React Router
│   └── package.json
│
├── .env                       # Root environment file (for Docker)
├── .gitignore                 # Root .gitignore
├── docker-compose.yml         # Main Docker file to run all services
└── README.md                  # This file
```

-----

## 🔮 Future Enhancements

  * **⚡ Real-time Notifications:** Use WebSockets to notify users instantly of new swap requests.
  * **📧 Email Notifications:** Send emails when a request is received or accepted/rejected.
  * **🗓️ Calendar Grid View:** Implement a visual calendar (e.g., `react-big-calendar`) instead of a list.
  * **🔍 Search & Filter:** Allow users to filter the marketplace by date, time, or event title.
  * **🧪 Test Coverage:** Add comprehensive unit and integration tests using Jest and Supertest.
