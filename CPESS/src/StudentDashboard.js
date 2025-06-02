import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';

function StudentDashboard({ studentId, setAuth }) {
  const [studentData, setStudentData] = useState(null);
  const [concern, setConcern] = useState("");
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [taskName, setTaskName] = useState("");
  const [taskFile, setTaskFile] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/student/${studentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load student data");
        return res.json();
      })
      .then((data) => {
        setStudentData(data);
        setCurrentSubjectIndex(0);
      })
      .catch((err) => {
        console.error(err);
        alert("Error loading student data.");
      });
  }, [studentId]);

  const handleLogout = () => {
    setAuth(null);
  };

  const handleConcernSubmit = () => {
    if (!concern.trim()) return alert("Please enter your concern.");

    fetch("http://localhost:5000/api/concern", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, concern }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to submit concern");
        return res.json();
      })
      .then(() => {
        alert("Concern submitted successfully!");
        setConcern("");
      })
      .catch((err) => {
        console.error(err);
        alert("Error submitting concern.");
      });
  };

  const handleTaskUpload = () => {
  if (!taskName || !taskFile) {
    alert("Please enter a task name and choose a file.");
    return;
  }

  const formData = new FormData();
  formData.append("student_id", studentId);
  formData.append("file", taskFile);  // Note the field name matches backend multer single("file")
  // Optionally send taskName, but backend currently ignores it
  formData.append("task_name", taskName);

  fetch("http://localhost:5000/api/upload", {
    method: "POST",
    body: formData,
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to upload task");
    return res.json();
  })
  .then(() => {
    alert("Task uploaded successfully and professor notified!");
    setTaskName("");
    setTaskFile(null);
  })
  .catch(err => {
    console.error(err);
    alert("Error uploading task.");
  });
};
  if (!studentData) return <p className="text-center mt-5">Loading...</p>;

  const subjectKeys = Object.keys(studentData.subjects || {});
  const currentSubject = subjectKeys[currentSubjectIndex];
  const allTasks = studentData.subjects[currentSubject] || [];
  const incompleteTasks = allTasks.filter((task) =>
    task.status.toLowerCase() !== "completed"
  );

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <img src="CPESS.png" alt="Logo" className="dashboard-logo" />
        <h1 className="dashboard-title">Student Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </nav>

      <div className="dashboard-main">
        {/* Student Info & Upload */}
        <div className="dashboard-card student-info-card">
          <div className="card-header">
            <h3>Student Info</h3>
          </div>
          <div className="card-content d-flex flex-column gap-3">
            {/* Student Info */}
            <div className="p-2 border rounded bg-light">
              <p><strong>Name:</strong> {studentData.name}</p>
              <p><strong>ID:</strong> {studentId}</p>
            </div>

            {/* Upload Incomplete Task */}
            <div className="p-2 border rounded bg-light">
              <h5>Upload Incomplete Task</h5>
              <input
                type="text"
                placeholder="Enter task name"
                className="form-control mb-2"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
              <input
                type="file"
                className="form-control mb-2"
                onChange={(e) => setTaskFile(e.target.files[0])}
              />
              <button className="btn btn-primary" onClick={handleTaskUpload}>
                Upload Task
              </button>
            </div>
          </div>
        </div>

        {/* Subjects & Tasks */}
        <div className="dashboard-card subjects-card">
          <div className="card-header">
            <h3>Subjects & Tasks</h3>
          </div>
          <div className="card-content scrollable">
            {subjectKeys.length > 0 ? (
              <div className="subject-section mb-4 d-flex flex-column" style={{ minHeight: "300px" }}>
                <div className="subject-header text-center mb-3">
                  <span className="subject-title">{currentSubject}</span>
                </div>

                <ul className="task-list flex-grow-1">
                  {incompleteTasks.length === 0 ? (
                    <li>All tasks are completed for this subject.</li>
                  ) : (
                    incompleteTasks.map((task, idx) => (
                      <li key={idx}>
                        {task.name} — <strong>{task.status}</strong>
                      </li>
                    ))
                  )}
                </ul>

                <div className="d-flex justify-content-between mt-3">
                  <button
                    className="pagination-button"
                    onClick={() => setCurrentSubjectIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentSubjectIndex === 0}
                  >
                    ⬅ Previous Subject
                  </button>
                  <button
                    className="pagination-button"
                    onClick={() =>
                      setCurrentSubjectIndex((prev) =>
                        Math.min(prev + 1, subjectKeys.length - 1)
                      )
                    }
                    disabled={currentSubjectIndex === subjectKeys.length - 1}
                  >
                    Next Subject ➡
                  </button>
                </div>
              </div>
            ) : (
              <p>No subjects found.</p>
            )}
          </div>
        </div>

        {/* Professor Info & Concern */}
        <div className="dashboard-card professor-card">
          <div className="card-header">
            <h3>Professor Info</h3>
          </div>
          <div className="card-content">
            <div className="professor-details">
              <p><strong>Name:</strong> Prof. Xavier</p>
              <p><strong>Email:</strong> xavier@ub.edu.ph</p>
            </div>
            <div className="concern-form">
              <label>Address Your Concern:</label>
              <textarea
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="Enter your concern here..."
              />
              <button onClick={handleConcernSubmit}>Submit</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        &copy; 2025 University of Batangas - Student Portal
      </footer>
    </div>
  );
}

export default StudentDashboard;
