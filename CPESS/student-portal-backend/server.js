const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- File Upload Setup ----------
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

// ---------- MySQL Setup ----------
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "student_portal",
});

// ---------- Login ----------
app.post("/api/login", (req, res) => {
    const { id, password } = req.body;

    if (id === "prof123" && password === "adminpass") {
        return res.json({ role: "professor", id: "prof123", name: "Prof. Xavier" });
    }

    db.query("SELECT * FROM students WHERE id = ? AND password = ?", [id, password], (err, results) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });
        return res.json({ role: "student", id: results[0].id, name: results[0].name });
    });
});

// ---------- Register Student ----------
app.post("/api/register", (req, res) => {
    const { id, name, password } = req.body;
    if (!id || !name || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    db.query("INSERT INTO students (id, name, password) VALUES (?, ?, ?)", [id, name, password], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "Student ID already exists" });
            }
            return res.status(500).json({ message: "Error registering student" });
        }
        res.json({ message: "Registration successful" });
    });
});

// ---------- Get Student Details ----------
app.get("/api/student/:id", (req, res) => {
    const studentId = req.params.id;
    db.query("SELECT * FROM students WHERE id = ?", [studentId], (err, students) => {
        if (err || students.length === 0) return res.status(404).json({ error: "Student not found" });

        db.query(
            `SELECT id, subject_code, subject_name, task_name, status, filename, semester, school_year 
             FROM student_tasks WHERE student_id = ?`,
            [studentId],
            (err, tasks) => {
                if (err) return res.status(500).json({ error: "Error loading tasks" });

                // Group tasks by subject
                const groupedSubjects = {};
                tasks.forEach(task => {
                    if (!groupedSubjects[task.subject_code]) {
                        groupedSubjects[task.subject_code] = {
                            subjectName: task.subject_name,
                            semester: task.semester,
                            schoolYear: task.school_year,
                            tasks: []
                        };
                    }
                    groupedSubjects[task.subject_code].tasks.push({
                        id: task.id,
                        name: task.task_name,
                        status: task.status,
                        fileName: task.filename
                    });
                });

                res.json({
                    ...students[0],
                    subjects: groupedSubjects,
                    tasks: tasks.map(t => ({
                        id: t.id,
                        task_name: t.task_name,
                        subject_code: t.subject_code,
                        subject_name: t.subject_name,
                        semester: t.semester,
                        school_year: t.school_year,
                        status: t.status,
                        fileName: t.filename
                    }))
                });
            }
        );
    });
});

// ---------- Save or Update Student ----------
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

// ---------- Get All Students ----------
app.get("/api/students", (req, res) => {
    db.query("SELECT id, name FROM students", (err, results) => {
        if (err) return res.status(500).json({ message: "Error loading students" });
        res.json(results);
    });
});

// ---------- Delete Student ----------
app.delete("/api/student/:id", (req, res) => {
    const studentId = req.params.id;
    db.query("DELETE FROM students WHERE id = ?", [studentId], (err, result) => {
        if (err || result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ message: "Student deleted" });
    });
});

// ---------- Upload Task and Notify Professor ----------
app.post("/api/upload", upload.single("file"), (req, res) => {
    const { student_id, task_name, subject_code, subject_name, semester, school_year, description, unit, reason } = req.body;
    const file = req.file;

    console.log('Upload request received:', {
        student_id,
        task_name,
        subject_code,
        subject_name,
        semester,
        school_year,
        file: file ? file.filename : 'No file'
    });

    if (!student_id || !task_name || !subject_code || !subject_name || !semester || !school_year || !file) {
        console.error('Missing required fields:', {
            student_id: !student_id,
            task_name: !task_name,
            subject_code: !subject_code,
            subject_name: !subject_name,
            semester: !semester,
            school_year: !school_year,
            file: !file
        });
        return res.status(400).json({ error: "Missing required fields or file" });
    }

    const insertQuery = `
        INSERT INTO student_tasks
        (student_id, subject_code, subject_name, semester, school_year, task_name, filename, description, unit, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(insertQuery,
        [student_id, subject_code, subject_name, semester, school_year, task_name, file.filename, description, unit, reason, "Incomplete"],
        (err, result) => {
            if (err) {
                console.error('Database error during task upload:', err);
                return res.status(500).json({ error: "Failed to save task: " + err.message });
            }
            console.log('Task uploaded successfully:', result);
            res.json({ 
                message: "Task uploaded and saved successfully.",
                fileUrl: `/uploads/${file.filename}`,
                taskId: result.insertId
            });
        });
});

// ---------- Update Task Status (Complete / Incomplete) ----------
app.put('/api/tasks/:id/status', (req, res) => {
    const taskId = req.params.id;
    const { status } = req.body;

    if (!status || !["Completed", "Incomplete"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    db.query("UPDATE student_tasks SET status = ? WHERE id = ?", [status, taskId], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update task status" });
        res.json({ message: "Task status updated successfully." });
    });
});

// ---------- Delete Task ----------
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    db.query("DELETE FROM student_tasks WHERE id = ?", [taskId], (err, result) => {
        if (err || result.affectedRows === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task deleted" });
    });
});

// ---------- Get All Tasks with Pagination ----------
app.get('/api/tasks', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const offset = (page - 1) * limit;

    db.query('SELECT COUNT(*) AS total FROM student_tasks', (err, countResult) => {
        if (err) return res.status(500).json({ error: 'Count query failed' });

        const total = countResult[0].total;

        db.query('SELECT * FROM student_tasks ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset], (err, tasks) => {
            if (err) return res.status(500).json({ error: 'Fetch tasks failed' });
            res.json({ tasks, total });
        });
    });
});

// Additional APIs (Concerns, Notifications) remain unchanged, assuming you want them.

// ---------- Server Listen ----------
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

