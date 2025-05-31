import React, { useEffect, useState } from "react"; 
import "bootstrap/dist/css/bootstrap.min.css"; 
import "./ProfessorDashboard.css"; 
 
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1; // Adjust this number as needed
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const tasksPerPage = 5; // Adjust this number as needed

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

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentConcerns = concerns.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(concerns.length / itemsPerPage);

  // Task Pagination Logic
  const handleTaskPagination = (subject) => {
    const indexOfLastTask = currentTaskPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    return formData.subjects[subject].slice(indexOfFirstTask, indexOfLastTask);
  };

  const totalTaskPages = (subject) => {
    return Math.ceil(formData.subjects[subject].length / tasksPerPage);
  };

  return ( 
    <div className="container py-4"> 
      <div className="navbar-custom d-flex justify-content-between align-items center mb-4 p-3 rounded"> 
        <img src="CPESS.png" alt="Logo" style={{ height: 50 }} /> 
        <h2 className="text-white m-0">Professor Dashboard</h2> 
        <button className="btn btn-light btn-sm btn-logout-small" onClick={handleLogout}> 
          Logout 
        </button> 
      </div> 
 
      <div className="row"> 
        {/* Left Column */} 
        <div className="col-md-4 mb-4"> 
          <div className="card p-3"> 
            <h4>Add Student</h4> 
            <div className="mb-2"> 
              <label className="form-label">Select Student:</label> 
              <select className="form-select" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}> 
                <option value="">-- Select Student --</option> 
                {students.map((s) => ( 
                  <option key={s.id} value={s.id}>{s.id} - {s.name}</option> 
                ))} 
              </select> 
            </div> 
 
            <input className="form-control mb-2" placeholder="Student ID" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value, password: e.target.value })} /> 
            <input className="form-control mb-2" placeholder="Student Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /> 
            <input className="form-control mb-3" placeholder="Password" value={formData.password} disabled /> 
 
            <button className="btn btn-success me-2 mb-2" onClick={handleSave}>💾 Save</button> 
            <button className="btn btn-outline-danger" onClick={handleDelete}>🗑️ Delete</button> 
          </div> 
        </div> 
 
        {/* Center Column */} 
        <div className="col-md-5 mb-4"> 
          <div className="card p-3" style={{ width: '100%', minHeight: '400px', marginLeft: '0px' }}> {/* Adjusted width and margin */} 
            <h4>Subjects & Tasks</h4> 
            {Object.entries(formData.subjects).length === 0 ? ( 
              <p className="text-muted">No subjects added.</p> 
            ) : ( 
              Object.entries(formData.subjects).map(([subject, tasks]) => { 
                const paginatedTasks = handleTaskPagination(subject);
                const totalPages = totalTaskPages(subject);
                
                return (  
                  <div key={subject} className="mb-3"> 
                    <h5>{subject} <button className="btn btn-sm btn-outline-danger float-end" onClick={() => handleRemoveSubject(subject)}>Remove Subject</button></h5> 
                    {paginatedTasks.map((task, idx) => ( 
                      <div className="d-flex align-items-center mb-2" key={idx}> 
                        <input className="form-control me-2" value={task.name} onChange={(e) => handleTaskEdit(subject, idx, "name", e.target.value)} /> 
                        <select className="form-select me-2" value={task.status} onChange={(e) => handleTaskEdit(subject, idx, "status", e.target.value)}> 
                          <option>Status</option> 
                          <option>Completed</option> 
                          <option>Incomplete</option> 
                          <option>Pending</option> 
                        </select> 
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoveTask(subject, idx)}>🗑️</button> 
                      </div> 
                    ))} 
                    <div className="d-flex mb-3"> 
                      <input className="form-control me-2" placeholder="New task name" value={newTasks[subject]?.name || ""} onChange={(e) => handleNewTaskChange(subject, "name", e.target.value)} /> 
                      <select className="form-select me-2" value={newTasks[subject]?.status || ""} onChange={(e) => handleNewTaskChange(subject, "status", e.target.value)}> 
                        <option>Status</option> 
                        <option>Completed</option> 
                        <option>Incomplete</option> 
                        <option>Pending</option> 
                      </select> 
                      <button className="btn btn-primary" onClick={() => handleAddTask(subject)}>Add</button> 
                    </div> 
                    <div className="d-flex justify-content-center gap-2 mt-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => setCurrentTaskPage((prev) => Math.max(prev - 1, 1))} disabled={currentTaskPage === 1}>
                        Previous
                      </button>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => setCurrentTaskPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentTaskPage === totalPages}>
                        Next
                      </button>
                    </div>
                    <span className="mt-2">Page {currentTaskPage} of {totalPages}</span>
                  </div>  
                );  
              })  
            )} 
          </div> 
        </div> 
 
        {/* Right Column */} 
        <div className="col-md-3 mb-4"> 
          <div className="card p-3"> 
            <h4>Add Subject</h4> 
            <input className="form-control mb-2" placeholder="New Subject Name" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} /> 
            <button className="btn btn-primary mb-4" onClick={handleAddSubject}>Add Subject</button> 
 
            <h5>Student Concerns</h5> 
            {concerns.length === 0 ? ( 
              <div className="alert alert-secondary">No concerns submitted.</div> 
            ) : ( 
              <ul className="list-group"> 
                {currentConcerns.map((c) => ( 
                  <li key={c.id} className="list-group-item d-flex justify-content-between align-items-start"> 
                    <div> 
                      <strong>{c.student_id} - {c.name}</strong><br /> 
                      {c.concern} 
                    </div> 
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteConcern(c.id)}>Delete</button> 
                  </li> 
                ))} 
              </ul> 
            )} 
            <div className="d-flex flex-column align-items-center mt-3"> 
              <div className="d-flex justify-content-center gap-2"> 
                <button className="btn btn-outline-primary btn-sm pagination-btn" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}> 
                  Previous 
                </button> 
                <button className="btn btn-outline-primary btn-sm pagination-btn" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}> 
                  Next 
                </button> 
              </div> 
              <span className="mt-2"> 
                Page {currentPage} of {totalPages} 
              </span> 
            </div> 
          </div> 
        </div> 
      </div> 
 
      <footer className="text-center py-3 border-top mt-4"> 
        &copy; 2025 University of Batangas - Professor Portal 
      </footer> 
    </div> 
  ); 
} 
 
export default ProfessorDashboard;
