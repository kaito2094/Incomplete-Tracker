const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- File Upload Setup ---------- //
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// ---------- MySQL Setup ---------- //
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // default in XAMPP
  database: "student_portal",
});

// ---------- Login ---------- //
app.post("/api/login", (req, res) => {
  const { id, password } = req.body;

  // Professor login
  if (id === "prof123" && password === "adminpass") {
    return res.json({ role: "professor", id: "prof123", name: "Prof. Xavier" });
  }

  // Student login
  db.query("SELECT * FROM students WHERE id = ? AND password = ?", [id, password], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({ role: "student", id: results[0].id, name: results[0].name });
  });
});
// ---------- Register Student ---------- //
app.post("/api/register", (req, res) => {
  const { id, name, password } = req.body;

  if (!id || !name || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query("INSERT INTO students (id, name, password) VALUES (?, ?, ?)", [id, name, password], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Student ID already exists" });
      }
      return res.status(500).json({ message: "Error registering student" });
    }

    res.json({ message: "Registration successful" });
  });
});

// ---------- Get Student Details ---------- //
app.get("/api/student/:id", (req, res) => {
  const studentId = req.params.id;

  db.query("SELECT * FROM students WHERE id = ?", [studentId], (err, students) => {
    if (err || students.length === 0) return res.status(404).json({ error: "Student not found" });

    db.query("SELECT subject_name, task_name, status FROM subjects WHERE student_id = ?", [studentId], (err, tasks) => {
      if (err) return res.status(500).json({ error: "Error loading subjects" });

      const subjects = {};
      for (const row of tasks) {
        if (!subjects[row.subject_name]) subjects[row.subject_name] = [];
        subjects[row.subject_name].push({ name: row.task_name, status: row.status });
      }

      res.json({ ...students[0], subjects });
    });
  });
});

// ---------- Save or Update Student ---------- //
app.post("/api/student", (req, res) => {
  const { id, name, password, subjects } = req.body;

  db.query("REPLACE INTO students (id, name, password) VALUES (?, ?, ?)", [id, name, password || id], (err) => {
    if (err) return res.status(500).json({ message: "Error saving student" });

    db.query("DELETE FROM subjects WHERE student_id = ?", [id], (err) => {
      if (err) return res.status(500).json({ message: "Error clearing old subjects" });

      const taskData = [];
      for (const subject in subjects) {
        for (const task of subjects[subject]) {
          taskData.push([id, subject, task.name, task.status]);
        }
      }

      if (taskData.length === 0) return res.json({ message: "Student saved" });

      db.query("INSERT INTO subjects (student_id, subject_name, task_name, status) VALUES ?", [taskData], (err) => {
        if (err) return res.status(500).json({ message: "Error saving tasks" });
        res.json({ message: "Student saved" });
      });
    });
  });
});

// ---------- Get All Students ---------- //
app.get("/api/students", (req, res) => {
  db.query("SELECT id, name FROM students", (err, results) => {
    if (err) return res.status(500).json({ message: "Error loading students" });
    res.json(results);
  });
});

// ---------- Delete Student ---------- //
app.delete("/api/student/:id", (req, res) => {
  const studentId = req.params.id;
  db.query("DELETE FROM students WHERE id = ?", [studentId], (err, result) => {
    if (err || result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student deleted" });
  });
});

// ---------- Step 1: Upload Task and Notify Professor ---------- //
app.post("/api/upload", upload.single("file"), (req, res) => {
  const { student_id, task_name } = req.body;
  const file = req.file;

  if (!student_id || !task_name || !file) {
    return res.status(400).json({ error: "Missing required fields or file" });
  }

  const message = `Student ${student_id} uploaded a task: "${task_name}"`;

  db.query(
    "INSERT INTO notifications (student_id, message) VALUES (?, ?)",
    [student_id, message],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to save notification" });
      res.json({ message: "Task uploaded and professor notified" });
    }
  );
});

// ---------- Step 2: Concerns API ---------- //
app.post("/api/concern", (req, res) => {
  const { student_id, concern } = req.body;
  if (!student_id || !concern) return res.status(400).json({ error: "Missing data" });

  db.query(
    "INSERT INTO concerns (student_id, concern) VALUES (?, ?)",
    [student_id, concern],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to save concern" });
      res.json({ message: "Concern submitted" });
    }
  );
});

app.get("/api/concerns", (req, res) => {
  db.query(
    `SELECT concerns.id, concerns.student_id, students.name, concerns.concern, concerns.timestamp
     FROM concerns
     JOIN students ON concerns.student_id = students.id
     ORDER BY concerns.timestamp DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch concerns" });
      res.json(results);
    }
  );
});

app.delete("/api/concern/:id", (req, res) => {
  const concernId = req.params.id;
  db.query("DELETE FROM concerns WHERE id = ?", [concernId], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete concern" });
    res.json({ message: "Concern deleted" });
  });
});

// ---------- Step 3: Notifications API ---------- //
app.get("/api/notifications", (req, res) => {
  db.query("SELECT * FROM notifications ORDER BY timestamp DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch notifications" });
    res.json(results);
  });
});

app.post("/api/notifications/read/:id", (req, res) => {
  const notificationId = req.params.id;
  db.query(
    "UPDATE notifications SET read = TRUE WHERE id = ?",
    [notificationId],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to mark notification as read" });
      res.json({ message: "Notification marked as read" });
    }
  );
});

// ---------- Server Listen ---------- //
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
