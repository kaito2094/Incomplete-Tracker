import React, { useEffect, useState } from "react";
import './Dashboard.css';

function StudentDashboard({ studentId, setAuth }) {
  const [studentData, setStudentData] = useState(null);
  const [concern, setConcern] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/student/${studentId}`)
      .then((res) => res.json())
      .then((data) => setStudentData(data));
  }, [studentId]);

  const handleLogout = () => {
    setAuth(null); // Clear authentication
  };

  const handleConcernSubmit = () => {
    if (!concern.trim()) return alert("Please enter your concern.");

    fetch("http://localhost:5000/api/concern", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        concern: concern,
      }),
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

  if (!studentData) return <p>Loading...</p>;

  return (
    <div className="dashboard-root">
      <nav className="navbardashboard">
        <img src="CPESS.png" alt="Logo" className="logo3" />
        <h1>Student Dashboard</h1>
        <div className="nav-links">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Left box: Student Info */}
        <div className="left-box-dashboard">
          <div className="left-box-header">
            <h2>Student Info</h2>
          </div>
          <div className="left-box-content">
            <p><strong>Name:</strong> {studentData.name}</p>
            <p><strong>ID:</strong> {studentId}</p>
          </div>
        </div>

        {/* Center box: Subjects & Tasks */}
        <div className="center-box-dashboard">
          <div className="center-box-header">
            <h2>Subjects & Tasks</h2>
          </div>
          <div className="center-box-content">
            {Object.keys(studentData.subjects).map((subject) => (
              <div key={subject}>
                <h3>{subject}</h3>
                <ul>
                  {studentData.subjects[subject].map((task, idx) => (
                    <li key={idx}>
                      {task.name} — <strong>{task.status}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Right box: Professor Info and Student Concern Form */}
        <div className="right-box-dashboard">
          <div className="right-box-header">
            <h2>Professor Info</h2>
          </div>
          <div className="right-box-content">
            <p><strong>Name:</strong> Prof. Xavier</p>
            <p><strong>Email:</strong> xavier@ub.edu.ph</p>
            <div style={{ marginTop: "1em" }}>
              <label><strong>Address Your Concern:</strong></label>
              <textarea
                rows="4"
                style={{ width: "100%", marginTop: "0.5em" }}
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="Enter your concern here..."
              ></textarea>
              <button onClick={handleConcernSubmit} style={{ marginTop: "0.5em" }}>
                Submit
              </button>
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
