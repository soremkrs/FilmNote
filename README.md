# 🎬 Film Note — Movie Journal App with Node.js + PostgreSQL

**Film Note** is a web application that allows users to search for movies via an external API using Axios, then leave personal notes and ratings for each movie. It's built using Node.js, Express, PostgreSQL, EJS templates, and Axios for movie search integration.

---

## 🌐 Live Demo

🚀 [https://filmnote.onrender.com](https://filmnote.onrender.com)

## 🚀 Technologies Used

- 🟩 Node.js
- 🚂 Express.js
- 🛢️ PostgreSQL
- 🎨 EJS (Embedded JavaScript templates)
- 🧠 Axios (for movie API requests)
- 🎭 express-session (user authentication)
- 📄 CSS
- 📦 pg (PostgreSQL client for Node)

---

## Author

- Made by SoremOne
- Movie data powered by external APIs via Axios
- Built with ❤️ using Node.js and PostgreSQL

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/soremkrs/FilmNote.git

# Navigate to the project folder
cd FilmNote

# Install dependencies
npm install

#Create a PostgreSQL database and run the following SQL to create the required table:

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name TEXT NOT NULL UNIQUE,
    user_password TEXT NOT NULL
);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    poster TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    username TEXT NOT NULL,
    date DATE NOT NULL,
    post TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id)
);

#⚠️ Important: You need to insert your PostgreSQL credentials in index.js file:

const db = new pg.Client({
  user: "YOUR_DB_USER",
  host: "YOUR_DB_HOST",
  database: "YOUR_DB_NAME",
  password: "YOUR_DB_PASSWORD",
  port: 5432,
});

# Start the server
node index.js

#Then visit 
http://localhost:3000