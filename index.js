// Import required modules
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import session from "express-session";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();


const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static("public"));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize session middleware for user authentication
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Connect to PostgreSQL database using credentials from environment variables
const db = new pg.Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

db.connect();

// Middleware to protect routes from unauthorized access
function requireAuth(req, res, next) {
  if (req.session.user) {
    next(); 
  } else {
    res.redirect('/'); 
  }
}

// OMDb API config
const apiUrl = "http://www.omdbapi.com/";
const apiKey = process.env.OMDB_API_KEY;

// Variables for storing last search result and login message
let lastSearchedMovie = [];
let userMessage = "Welcome! Please enter your name to get started.";

// Route: Login page
app.get("/", (req, res) => {
    try {
        res.render("sign.ejs", { message: userMessage } );
    } catch (error) {
        console.log(error);
    }
});

// Route: Home page showing all movie reviews
app.get("/home", requireAuth, async (req, res) => {
    const result = await db.query("SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes");
    const movieDB = result.rows;

    // Sort by date
    const dateDesc = await db.query("SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes ORDER BY date DESC");
    const movieDateDesc = dateDesc.rows;

    // Sort by rating
    const ratingDesc = await db.query("SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes ORDER BY rating DESC");
    const movieRatingDesc = ratingDesc.rows;

    res.render("home.ejs", {
        user: req.session.user,
        film: movieDB,
        sortByRating: movieRatingDesc,
        sortByDate: movieDateDesc
    });
});

// Route: Create note page (after searching for a movie)
app.get("/create-note",requireAuth, (req, res) => {
    res.render("create.ejs", {
        content: lastSearchedMovie,
        user: req.session.user
    });
});

// Route: Logout
app.get("/logout", requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
        return console.log(err);
        }
        userMessage = "Welcome! Please enter your name to get started.";
        res.redirect('/'); 
    });
});

// Route: View a single review
app.get("/post/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).send("Invalid note ID");
    } else {
        try {
            const result = await db.query("SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes WHERE id = $1", [id]);
            const noteFind = result.rows[0];
            // console.log(noteFind);
            res.render("note.ejs", { 
                user: req.session.user,
                content : noteFind
            });
        } catch (err) {
            console.log(err);
        }
    }
});

// Route: Edit a review
app.get("/edit/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).send("Invalid note ID");
    } else {
        try {
            const result = await db.query("SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes WHERE id = $1", [id]);
            const noteFind = result.rows[0];
            // console.log(noteFind);
            res.render("create.ejs", {
                edit: noteFind,
                user: req.session.user
            });
        } catch (err) {
            console.log(err);
        }
    }
});

// Route: User's personal movie reviews (with sorting)
app.get("/your-movies", requireAuth, async (req, res) => {
    const user = req.session.user.username;
    const sort = req.query.sort;
    let orderBy = `id`; 

    if (sort === `rating`) {
        orderBy = `rating`;
    } else if (sort === 'date') {
        orderBy = `date`;
    } else {
        orderBy = `id`;
    }
    try {
        const result = await db.query(`SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes WHERE username = $1 ORDER BY ${orderBy} DESC`, [user]);
        const userMovies = result.rows;
        res.render("your-movies.ejs", {
            user: req.session.user,
            content: userMovies,
            sort: sort || null
        });
    } catch (err) {
        console.log(err);
    }
});

// Route: Global rankings page (all users)
app.get("/rankings", requireAuth, async (req, res) => {
    const sort = req.query.sort;
    let orderBy = `rating DESC`; 

    if (sort === 'date') {
        orderBy = `date DESC`;
    } else if (sort === 'rating') {
        orderBy = `rating ASC`;
    }else {
        orderBy = `rating DESC`;
    }
    try {
        const result = await db.query(`SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes ORDER BY ${orderBy}`);
        const userMovies = result.rows;
        // console.log(userMovies);
        res.render("ranking.ejs", {
            user: req.session.user,
            content: userMovies,
            sort: sort || null
        });
    } catch (err) {
        console.log(err);
    }
});

// Route: Community page (all reviews from all users)
app.get("/community", requireAuth, async (req, res) => {
    const sort = req.query.sort;
    let orderBy = `id DESC`; 

    if (sort === 'date') {
        orderBy = `date DESC`;
    } else if (sort === 'rating') {
        orderBy = `rating DESC`;
    }else {
        orderBy = `id DESC`;
    }
    try {
        const result = await db.query(`SELECT id, name, poster, rating, username, TO_CHAR(date, 'Month DD, YYYY') AS date, post FROM notes ORDER BY ${orderBy}`);
        const userMovies = result.rows;
        // console.log(userMovies);
        res.render("community.ejs", {
            user: req.session.user,
            content: userMovies,
            sort: sort || null
        });
    } catch (err) {
        console.log(err);
    }
});

// Route: Sign in user (login)
app.post("/signin", async (req,res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE user_name = $1', [username]);

        if (result.rows.length === 0) {
            userMessage = "User does not exist. Please register.";
            res.redirect("/");
        } else {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.user_password); 

            if (match) {
                req.session.user = { id: user.id, username: user.user_name };
                res.redirect("/home");
            } else {
                userMessage = "Incorrect password.";
                res.redirect("/")
            }
        }
    } catch (err) {
        console.error(err);
        userMessage = "Error logging in.";
        res.redirect("/");
    }
});

// Route: Register a new user
app.post("/registration", async (req,res) => {
    const { username, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    try {
        await db.query('INSERT INTO users (user_name, user_password) VALUES ($1, $2)', [username, hashed]);
        userMessage = "User registered! You can now log in.";
        res.redirect("/")
    } catch (err) {
        console.error(err);
        userMessage = "User already registered!";
        res.redirect("/")
    }
});

// Route: Search for a movie via OMDb API
app.post("/search", async (req, res) => {
    try {
        const result = await axios.get(apiUrl, {
            params: {
                apikey : apiKey,
                t: req.body.name
            }
        });
        lastSearchedMovie = result.data;
        res.render("search.ejs", { 
            content: result.data,
            user: req.session.user
        });

    } catch (err) {
        console.log(err);
    }

});

// Route: Submit a new movie review
app.post("/submit-review", async (req, res) => {
    const submit = req.body;
    try {
      await db.query(
        "INSERT INTO notes(name, poster, rating, username, date, post, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [submit.name, submit.poster, submit.rating, req.session.user.username, submit.date, submit.post, req.session.user.id]
      );
      res.redirect("/home");
    } catch (err) {
      console.log(err);
    }
});

// Route: Submit edited review
app.post("/submit-edit/:id", requireAuth ,async (req, res) => {
    const edit = req.body;
    const id = Number(req.params.id);
    try {
        await db.query(
            "UPDATE notes SET rating = $1, date = $2, post = $3 WHERE id = $4",
            [edit.rating, edit.date, edit.post, id]
        );
        res.redirect("/home");
    } catch (err) {
        console.log(err);
    }
});

// Route: Delete a review
app.post("/delete/:id", requireAuth ,async (req, res) => {
    const id = Number(req.params.id);
     try {
        await db.query(
            "DELETE FROM notes WHERE id = $1",
            [id]
        );
        res.redirect("/home");
    } catch (err) {
        console.log(err);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

