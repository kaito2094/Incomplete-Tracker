import React, { useEffect, useState } from "react";

function ProfessorDashboard({ setAuth }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    password: "",
    subjects: {},
  });

  const [newTasks, setNewTasks] = useState({});
  const [newSubject, setNewSubject] = useState("");
  const [concerns, setConcerns] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/students")
      .then((res) => res.json())
      .then(setStudents)
      .catch(() => alert("Failed to fetch students"));

    fetch("http://localhost:5000/api/concerns")
      .then((res) => res.json())
      .then(setConcerns)
      .catch(() => alert("Failed to load concerns"));
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetch(`http://localhost:5000/api/student/${selectedStudentId}`)
        .then((res) => res.json())
        .then((data) => {
          setFormData({ ...data, password: data.id });
          setNewTasks({});
        })
        .catch((err) => alert(err.message));
    } else {
      setFormData({ id: "", name: "", password: "", subjects: {} });
      setNewTasks({});
    }
  }, [selectedStudentId]);

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    setFormData((prev) => ({
      ...prev,
      subjects: { ...prev.subjects, [newSubject.trim()]: [] },
    }));
    setNewSubject("");
  };

  const handleRemoveSubject = (subject) => {
    const updatedSubjects = { ...formData.subjects };
    delete updatedSubjects[subject];
    setFormData((prev) => ({ ...prev, subjects: updatedSubjects }));
  };

  const handleNewTaskChange = (subject, field, value) => {
    setNewTasks((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [field]: value },
    }));
  };

  const handleAddTask = (subject) => {
    const task = newTasks[subject];
    if (!task || !task.name.trim() || !task.status) return;
    const newTask = { name: task.name.trim(), status: task.status };

    setFormData((prev) => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [subject]: [...(prev.subjects[subject] || []), newTask],
      },
    }));
    setNewTasks((prev) => ({ ...prev, [subject]: { name: "", status: "" } }));
  };

  const handleTaskEdit = (subject, index, field, value) => {
    const updatedTasks = [...formData.subjects[subject]];
    updatedTasks[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      subjects: { ...prev.subjects, [subject]: updatedTasks },
    }));
  };

  const handleRemoveTask = (subject, index) => {
    const updatedTasks = formData.subjects[subject].filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      subjects: { ...prev.subjects, [subject]: updatedTasks },
    }));
  };

  const handleSave = () => {
    if (!formData.id || !formData.name) return alert("Student ID and Name required.");
    if (formData.password !== formData.id) return alert("Password must match ID.");

    fetch("http://localhost:5000/api/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Student saved!");
        return fetch("http://localhost:5000/api/students");
      })
      .then((res) => res.json())
      .then(setStudents)
      .catch((err) => alert(err.message));
  };

  const handleDelete = () => {
    if (!formData.id) return alert("No student selected.");
    if (!window.confirm(`Delete student ${formData.id}?`)) return;

    fetch(`http://localhost:5000/api/student/${formData.id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setStudents((prev) => prev.filter((s) => s.id !== formData.id));
        setSelectedStudentId("");
        alert("Student deleted.");
      })
      .catch((err) => alert(err.message));
  };

  const handleLogout = () => setAuth(null);

  const handleDeleteConcern = (id) => {
    if (!window.confirm("Delete this concern?")) return;
    fetch(`http://localhost:5000/api/concern/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setConcerns((prev) => prev.filter((c) => c.id !== id));
        alert("Concern deleted.");
      })
      .catch(() => alert("Error deleting concern"));
  };

  return (
    <div className="prof-dashboard-root">
      <div className="navbardashboard">
        <img src="CPESS.png" alt="Logo" className="logo3" />
        <h1>Professor Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="left-box-dashboard">
          <h2>Add Student</h2>
          <label>Select Student:</label>
          <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
            <option value="">-- Select Student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
            ))}
          </select>

          <input
            placeholder="Student ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value, password: e.target.value })}
          />
          <input
            placeholder="Student Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input placeholder="Password" value={formData.password} disabled />

          <button onClick={handleSave}>💾 Save Student</button>
          <button onClick={handleDelete}>🗑️ Delete Student</button>
        </div>

        <div className="center-box-dashboard">
          <h2>Add Activity</h2>
          {Object.entries(formData.subjects).length === 0 && <p>No subjects added yet.</p>}
          {Object.entries(formData.subjects).map(([subject, tasks]) => (
            <div key={subject} className="prof-subject-container">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h4>{subject}</h4>
              </div>

              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", marginBottom: "8px", alignItems: "center" }}
                >
                  <input
                    value={task.name}
                    onChange={(e) => handleTaskEdit(subject, idx, "name", e.target.value)}
                    style={{ width: "60%" }}
                  />
                  <select
                    value={task.status}
                    onChange={(e) => handleTaskEdit(subject, idx, "status", e.target.value)}
                    style={{ marginLeft: "20px", width: "160px", marginRight: "20px" }}
                  >
                    <option value="">Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Incomplete">Incomplete</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <button
                    onClick={() => handleRemoveTask(subject, idx)}
                    style={{
                      marginLeft: "10px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      backgroundColor: "#e74c3c",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                    title="Remove Task"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div>
                <input
                  placeholder="New task name"
                  value={newTasks[subject]?.name || ""}
                  onChange={(e) => handleNewTaskChange(subject, "name", e.target.value)}
                  style={{ width: "60%" }}
                />
                <select
                  value={newTasks[subject]?.status || ""}
                  onChange={(e) => handleNewTaskChange(subject, "status", e.target.value)}
                  style={{ marginLeft: "10px", width: "30%" }}
                >
                  <option value="">Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Incomplete">Incomplete</option>
                  <option value="Pending">Pending</option>
                </select>
                <button onClick={() => handleAddTask(subject)} style={{ marginLeft: "10px" }}>
                  Add Activity
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="right-box-dashboard">
          <h2>Add Subject</h2>
          <input placeholder="New Subject Name" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          <button onClick={handleAddSubject} style={{ marginTop: "10px" }}>Add Subject</button>

          <div className="professor-concerns" style={{ marginTop: "20px" }}>
            <h3>Student Concerns</h3>
            {concerns.length === 0 ? (
              <p>No concerns submitted.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {concerns.map((c) => (
                  <li key={c.id} style={{ backgroundColor: "#fff5f5", padding: "10px", marginBottom: "10px" }}>
                    <strong>{c.student_id} - {c.name}</strong>: {c.concern}
                    <br />
                    <button
                      onClick={() => handleDeleteConcern(c.id)}
                      style={{
                        marginTop: "5px",
                        backgroundColor: "#b52b27",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        cursor: "pointer",
                        borderRadius: "3px",
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <footer className="dashboard-footer">
        &copy; 2025 University of Batangas - Student Portal
      </footer>
    </div>
  );
}

export default ProfessorDashboard;
