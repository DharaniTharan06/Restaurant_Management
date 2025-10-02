How to Run the Backend
Step 1: Initial Setup
Follow the setup instructions from the previous version to install Node.js, PostgreSQL, create a project folder, install dependencies (npm install), and configure your .env file.

Step 2: Create the users Table
Before running the application, you need to create a table to store user credentials.

Connect to your PostgreSQL database using a tool like psql or PGAdmin.

Run the following SQL command to create the users table:

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(50) NOT NULL, -- In production, this should be a hashed password (e.g., VARCHAR(255))
    role VARCHAR(10) NOT NULL CHECK (role IN ('manager', 'staff'))
);

Step 3: Add Sample Users
Run these commands to add a manager and a staff user. You will use these credentials to test the API.

-- Create a manager user (username: admin, password: password123)
INSERT INTO users (username, password, role) VALUES ('admin', 'password123', 'manager');

-- Create a staff user (username: user, password: password123)
INSERT INTO users (username, password, role) VALUES ('user', 'password123', 'staff');

Step 4: Run the Backend Server
In your terminal (inside the project folder), start the server:

npm start

You should see the confirmation message: Server is running on http://localhost:3001

The backend server is now running and ready to accept API requests from the frontend or an API testing tool like Postman.
