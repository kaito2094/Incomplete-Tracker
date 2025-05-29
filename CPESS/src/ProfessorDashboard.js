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
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch students");
        return res.json();
      })
      .then((data) => setStudents(data))
      .catch((err) => alert(err.message));

    fetch("http://localhost:5000/api/concerns")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch concerns");
        return res.json();
      })
      .then((data) => setConcerns(data))
      .catch(() => alert("Failed to load concerns"));
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetch(`http://localhost:5000/api/student/${selectedStudentId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch student data");
          return res.json();
        })
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

    setFormData((prev) => {
      const updated = { ...prev };
      updated.subjects[subject] = [...(updated.subjects[subject] || []), newTask];
      return updated;
    });

    setNewTasks((prev) => ({ ...prev, [subject]: { name: "", status: "" } }));
  };

  const handleTaskEdit = (subject, index, field, value) => {
    setFormData((prev) => {
      const updatedTasks = [...(prev.subjects[subject] || [])];
      updatedTasks[index] = { ...updatedTasks[index], [field]: value };
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: updatedTasks,
        },
      };
    });
  };

  const handleRemoveTask = (subject, index) => {
    setFormData((prev) => {
      const updated = { ...prev };
      updated.subjects[subject] = updated.subjects[subject].filter((_, i) => i !== index);
      return updated;
    });
  };

  const handleSave = () => {
    if (!formData.id || !formData.name) {
      alert("Student ID and Name are required.");
      return;
    }
    if (formData.password !== formData.id) {
      alert("Password must match Student ID.");
      return;
    }

    fetch("http://localhost:5000/api/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save student data");
        return res.json();
      })
      .then(() => {
        alert("Student data saved!");
        return fetch("http://localhost:5000/api/students");
      })
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => alert(err.message));
  };

  const handleDelete = () => {
    if (!formData.id) {
      alert("No student selected to delete.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete student ${formData.id}?`)) {
      fetch(`http://localhost:5000/api/student/${formData.id}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete student");
          return res.json();
        })
        .then(() => {
          setStudents((prev) => prev.filter((s) => s.id !== formData.id));
          setSelectedStudentId("");
          alert("Student deleted successfully");
        })
        .catch((err) => alert(err.message));
    }
  };

  const handleLogout = () => {
    setAuth(null);
  };

  const handleDeleteConcern = (id) => {
    if (!window.confirm("Delete this concern?")) return;

    fetch(`http://localhost:5000/api/concern/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete concern");
        return res.json();
      })
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
          <div className="left-box-header">
            <h2>Add Student</h2>
          </div>
          <div className="left-box-content">
            <label htmlFor="student-select">Select Student:</label>
            <select
              id="student-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} - {s.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Student ID"
              value={formData.id}
              onChange={(e) => {
                const idValue = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  id: idValue,
                  password: idValue,
                }));
              }}
              style={{ marginTop: "10px" }}
            />
            <input
              placeholder="Student Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ marginTop: "10px" }}
            />
            <input
              placeholder="Password"
              type="text"
              value={formData.password}
              disabled
              style={{ marginTop: "10px" }}
            />
            <button
              onClick={handleSave}
              style={{
                marginTop: "10px",
                backgroundColor: "#771100",
                color: "white",
                border: "none",
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              💾 Save Student
            </button>
            <button
              onClick={handleDelete}
              style={{
                marginTop: "10px",
                backgroundColor: "#b52b27",
                color: "white",
                border: "none",
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              🗑️ Delete Student
            </button>
          </div>
        </div>

        <div className="center-box-dashboard">
          <div className="center-box-header">
            <h2>Add Activity</h2>
          </div>
          <div className="center-box-content">
            {Object.entries(formData.subjects).length === 0 && (
              <p>No subjects added yet. Add a subject first.</p>
            )}
            {Object.entries(formData.subjects).map(([subject, tasks]) => (
              <div className="prof-subject-container" key={subject}>
                <h4>{subject}</h4>
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="prof-task-container"
                    style={{ marginBottom: "8px" }}
                  >
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) =>
                        handleTaskEdit(subject, idx, "name", e.target.value)
                      }
                      style={{ width: "60%" }}
                    />
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleTaskEdit(subject, idx, "status", e.target.value)
                      }
                      style={{ width: "30%", marginLeft: "10px" }}
                    >
                      <option value="">Select status</option>
                      <option value="Completed">Completed</option>
                      <option value="Incomplete">Incomplete</option>
                      <option value="Pending">Pending</option>
                    </select>
                    <button
                      onClick={() => handleRemoveTask(subject, idx)}
                      style={{ marginLeft: "10px", cursor: "pointer" }}
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <div style={{ marginTop: "10px" }}>
                  <input
                    type="text"
                    placeholder="New task name"
                    value={newTasks[subject]?.name || ""}
                    onChange={(e) =>
                      handleNewTaskChange(subject, "name", e.target.value)
                    }
                    style={{ width: "60%" }}
                  />
                  <select
                    value={newTasks[subject]?.status || ""}
                    onChange={(e) =>
                      handleNewTaskChange(subject, "status", e.target.value)
                    }
                    style={{ width: "30%", marginLeft: "10px" }}
                  >
                    <option value="">Select status</option>
                    <option value="Completed">Completed</option>
                    <option value="Incomplete">Incomplete</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <button
                    onClick={() => handleAddTask(subject)}
                    style={{ marginLeft: "10px" }}
                  >
                    ➕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="right-box-dashboard">
          <div className="right-box-header">
            <h2>Add Subject</h2>
          </div>
          <div className="right-box-content">
            <input
              placeholder="New Subject Name"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button
              onClick={handleAddSubject}
              style={{ marginTop: "10px", cursor: "pointer" }}
            >
              Add Subject
            </button>

            {/* Student Concerns Section */}
            <div className="professor-concerns" style={{ marginTop: "20px" }}>
              <h3>Student Concerns</h3>
              {concerns.length === 0 ? (
                <p>No concerns submitted.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {concerns.map((concern) => (
                    <li
                      key={concern.id}
                      style={{
                        backgroundColor: "#fff5f5",
                        padding: "10px",
                        borderRadius: "6px",
                        marginBottom: "10px",
                      }}
                    >
                      <strong>
                        {concern.student_id} - {concern.name}
                      </strong>
                      : {concern.concern}
                      <br />
                      <button
                        onClick={() => handleDeleteConcern(concern.id)}
                        style={{
                          marginTop: "5px",
                          backgroundColor: "#b52b27",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          cursor: "pointer",
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
      </div>
      <footer className="dashboard-footer">
        &copy; 2025 University of Batangas - Student Portal
      </footer>
    </div>
  );
}

export default ProfessorDashboard;
