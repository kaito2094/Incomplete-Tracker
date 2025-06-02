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

  // Pagination states for subjects (1 per page)  
  const [currentSubjectPage, setCurrentSubjectPage] = useState(1);  
  const subjectsPerPage = 1;  

  // Pagination state for tasks per subject  
  const [currentTaskPages, setCurrentTaskPages] = useState({});  
  const tasksPerPage = 5;  

  const [notifications, setNotifications] = useState([]);
  const [expandedNotifId, setExpandedNotifId] = useState(null);
  

const addNotification = (message) => {
  setNotifications((prev) => [
    ...prev,
    { id: Date.now(), message, read: false },
  ]);
};

  useEffect(() => {  
    fetch("http://localhost:5000/api/students")  
      .then((res) => res.json())  
      .then(setStudents)  
      .catch(() => alert("Failed to fetch students"));  

    fetch("http://localhost:5000/api/concerns")  
      .then((res) => res.json())  
      .then((data) => {
        const concernsWithRead = data.map((c) => ({
          ...c,
          read: false,
          studentName: c.name,
          studentId: c.student_id,
        }));
        setConcerns(concernsWithRead);
      })
      .catch(() => alert("Failed to load concerns"));  
  }, []);  

  useEffect(() => {  
    if (selectedStudentId) {  
      fetch(`http://localhost:5000/api/student/${selectedStudentId}`)  
        .then((res) => res.json())  
        .then((data) => {  
          setFormData({ ...data, password: data.id });  
          setNewTasks({});  
          setCurrentSubjectPage(1); // Reset subject page when student changes
          setCurrentTaskPages({}); // Reset task pages for all subjects
        })  
        .catch((err) => alert(err.message));  

        
    } else {  
      setFormData({ id: "", name: "", password: "", subjects: {} });  
      setNewTasks({});  
      setCurrentSubjectPage(1);
      setCurrentTaskPages({});
    }  
  }, [selectedStudentId]);  

  // Fetch upload notifications from server
useEffect(() => {
  fetch("http://localhost:5000/api/notifications")
    .then((res) => res.json())
    .then((data) => {
      const formatted = data.map((notif) => ({
        ...notif,
        read: notif.read === 1 || notif.read === true, // convert to boolean
      }));
      setNotifications(formatted);
    })
    .catch(() => alert("Failed to load task upload notifications"));
}, []);

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
    setCurrentTaskPages((prev) => {
      const newPages = { ...prev };
      delete newPages[subject];
      return newPages;
    });

    // Adjust currentSubjectPage if needed
    const totalSubjectsAfterRemoval = Object.keys(updatedSubjects).length;
    if (currentSubjectPage > totalSubjectsAfterRemoval) {
      setCurrentSubjectPage(Math.max(totalSubjectsAfterRemoval, 1));
    }
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

  // Detect if the task was marked "Completed"
  if (field === "status" && value === "Completed") {
    const taskName = updatedTasks[index].name;
    addNotification(`${formData.name} completed task "${taskName}" in subject "${subject}"`);
  }
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

  const handleMarkAsDone = (id) => {
    setConcerns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, read: true } : c
      )
    );
  };

  // Concerns pagination  
  const [currentPage, setCurrentPage] = useState(1);  
  const itemsPerPage = 1;  

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentConcerns = concerns.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(concerns.length / itemsPerPage); 

  // Subjects pagination logic
  const subjectsArray = Object.entries(formData.subjects);  
  const totalSubjectPages = Math.ceil(subjectsArray.length / subjectsPerPage);  
  const currentSubjectIndex = currentSubjectPage - 1;  
  const currentSubject = subjectsArray[currentSubjectIndex]; // [subject, tasks] or undefined if none

  // Task Pagination Logic per subject  
  const handleTaskPagination = (subject) => { 
    if (!formData.subjects[subject]) return [];
    const currentTaskPage = currentTaskPages[subject] || 1;
    const indexOfLastTask = currentTaskPage * tasksPerPage; 
    const indexOfFirstTask = indexOfLastTask - tasksPerPage; 
    return formData.subjects[subject].slice(indexOfFirstTask, indexOfLastTask); 
  }; 

  const totalTaskPages = (subject) => { 
    if (!formData.subjects[subject]) return 1;
    return Math.max(1, Math.ceil(formData.subjects[subject].length / tasksPerPage)); 
  }; 

  return (  
    <div className="container-fluid p-0">  
      {/* Navigation bar */}  
      <div className="navbar-custom d-flex justify-content-between align-items-center p-3">
  <div className="d-flex align-items-center gap-3">
    <img src="CPESS.png" alt="Logo" style={{ height: 60 }} />
    <h2 className="text-white m-0">Professor Dashboard</h2>
  </div>

  <div className="d-flex align-items-center gap-3">
    {/* Notifications section */}
<div className="notification-section">
  {notifications.length === 0 ? (
    <span className="text-light">No new notifications</span>
  ) : (
    notifications.map((notif) => (
      <div key={notif.id} style={{ position: "relative", marginBottom: "10px" }}>
        <div
          className={`alert d-flex justify-content-between align-items-center p-2 ${
            notif.read ? "alert-secondary" : "alert-primary"
          }`}
          style={{ cursor: "pointer", minWidth: "250px" }}
          onClick={() =>
            setExpandedNotifId(expandedNotifId === notif.id ? null : notif.id)
          }
        >
          <span style={{ flex: 1 }}>{notif.message}</span>
          {!notif.read && (
            <button
              className="btn btn-sm btn-outline-light ms-2"
              onClick={(e) => {
                e.stopPropagation(); // prevent expanding when marking as read
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === notif.id ? { ...n, read: true } : n
                  )
                );
              }}
            >
              Mark Read
            </button>
          )}
        </div>

        {/* Pop-out box below the notification */}
        {expandedNotifId === notif.id && (
          <div className="card shadow p-3" style={{ position: "absolute", top: "100%", zIndex: 10, backgroundColor: "white", minWidth: "250px", maxWidth: "300px" }}>
            <div className="d-flex justify-content-between align-items-start">
              <p className="mb-2">{notif.message}</p>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => setExpandedNotifId(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    ))
  )}
</div>

    {/* Logout button */}
    <button className="btn btn-light btn-sm btn-logout-small" onClick={handleLogout}>
      Logout
    </button>
  </div>
</div>

      {/* Dashboard columns with swapped Add Student and Add Subject */}  
      <div className="dashboard-row px-4 py-4">  
        {/* Left Column: Add Student */}  
        <div className="dashboard-column dashboard-left card p-3">  
          <h4>Add Student</h4>  
          <select  
            className="form-select mb-3"  
            value={selectedStudentId}  
            onChange={(e) => setSelectedStudentId(e.target.value)}  
          >  
            <option value="">Select Student</option>  
            {students.map((student) => (  
              <option key={student.id} value={student.id}>  
                {student.name} ({student.id})  
              </option>  
            ))}  
          </select>  

          <input  
            className="form-control mb-2"  
            placeholder="Student ID"  
            value={formData.id}  
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}  
          />  
          <input  
            className="form-control mb-2"  
            placeholder="Student Name"  
            value={formData.name}  
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}  
          />  
          <input  
            className="form-control mb-3"  
            placeholder="Password (must match ID)"  
            type="password"  
            value={formData.password}  
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}  
          />  

          <button className="btn btn-primary me-2" onClick={handleSave}>  
            Save  
          </button>  
          <button className="btn btn-danger" onClick={handleDelete}>  
            Delete  
          </button>  
        </div>  

        {/* Center Column: Subjects & Tasks (1 subject per page) */}  
        <div className="dashboard-column dashboard-center card p-3">  
          <h4>Subjects & Tasks</h4>  

          {subjectsArray.length === 0 ? (  
            <p className="text-muted">No subjects added.</p>  
          ) : (  
            <>  
              {currentSubject && (  
                <div key={currentSubject[0]} className="mb-3">  
                  <h5 className="text-center">{currentSubject[0]}</h5>

                  {handleTaskPagination(currentSubject[0]).map((task, idx) => (  
                    <div  
                      key={idx}  
                      className="task-card"  
                    >  
                      <input  
                       className="form-control me-2 task-name-input" 
                        value={task.name}  
                        onChange={(e) =>  
                          handleTaskEdit(  
                            currentSubject[0],  
                            idx + ((currentTaskPages[currentSubject[0]] || 1) - 1) * tasksPerPage,  
                            "name",  
                            e.target.value  
                          )  
                        }  
                      />  
                      <select  
                         className="form-select me-2 task-status-select"
                        value={task.status}  
                        onChange={(e) =>  
                          handleTaskEdit(  
                            currentSubject[0],  
                            idx + ((currentTaskPages[currentSubject[0]] || 1) - 1) * tasksPerPage,  
                            "status",  
                            e.target.value  
                          )  
                        }  
                      >  
                        <option value="">Select Status</option>  
                        <option value="Completed">Completed</option>  
                        <option value="Ongoing">Ongoing</option>  
                        <option value="Pending">Pending</option>  
                      </select>  
                      <button  
                        className="btn btn-danger btn-sm task-delete-btn"  
                        onClick={() =>  
                          handleRemoveTask(  
                            currentSubject[0],  
                            idx + ((currentTaskPages[currentSubject[0]] || 1) - 1) * tasksPerPage  
                          )  
                        }  
                      >  
                        Delete  
                      </button>  
                    </div>  
                  ))}  

                  {/* Task pagination */}  
                  {totalTaskPages(currentSubject[0]) > 1 && (  
                    <div className="d-flex justify-content-center gap-1 mt-1">  
                      <button  
                        className="btn btn-outline-secondary btn-sm"  
                        disabled={(currentTaskPages[currentSubject[0]] || 1) === 1}  
                        onClick={() =>  
                          setCurrentTaskPages((prev) => ({  
                            ...prev,  
                            [currentSubject[0]]: Math.max((prev[currentSubject[0]] || 1) - 1, 1),  
                          }))  
                        }  
                      >  
                        &lt;  
                      </button>  
                      <span className="align-self-center">  
                        Page {(currentTaskPages[currentSubject[0]] || 1)} of {totalTaskPages(currentSubject[0])}  
                      </span>  
                      <button  
                        className="btn btn-outline-secondary btn-sm"  
                        disabled={(currentTaskPages[currentSubject[0]] || 1) === totalTaskPages(currentSubject[0])}  
                        onClick={() =>  
                          setCurrentTaskPages((prev) => ({  
                            ...prev,  
                            [currentSubject[0]]: Math.min((prev[currentSubject[0]] || 1) + 1, totalTaskPages(currentSubject[0])),  
                          }))  
                        }  
                      >  
                        &gt;  
                      </button>  
                    </div>  
                  )}  

                  {/* Add new task input */}  
                  <div className="d-flex mt-2 gap-2">  
                    <input  
                      className="form-control"  
                      placeholder="New Task Name"  
                      value={(newTasks[currentSubject[0]]?.name) || ""}  
                      onChange={(e) => handleNewTaskChange(currentSubject[0], "name", e.target.value)}  
                    />  
                    <select  
                      className="form-select"  
                      value={(newTasks[currentSubject[0]]?.status) || ""}  
                      onChange={(e) => handleNewTaskChange(currentSubject[0], "status", e.target.value)}  
                    >  
                      <option value="">Select Status</option>  
                      <option value="Completed">Completed</option>  
                      <option value="Ongoing">Ongoing</option>  
                      <option value="Pending">Pending</option>  
                    </select>  
                    <button className="btn btn-primary" onClick={() => handleAddTask(currentSubject[0])}>  
                      Add Task  
                    </button>  
                  </div>  
                </div>  
              )}  

              {/* Subject pagination controls */}  
              {subjectsArray.length > subjectsPerPage && (  
                <div className="d-flex justify-content-center gap-1 mt-3">  
                  <button  
                    className="btn btn-outline-secondary pagination-btn-center" 
                    onClick={() => setCurrentSubjectPage((prev) => Math.max(prev - 1, 1))}  
                    disabled={currentSubjectPage === 1}  
                  >  
                    &lt;  
                  </button>  
                  <span className="align-self-center1">  
                    Subject Page {currentSubjectPage} of {totalSubjectPages}  
                  </span>  
                  <button  
                    className="btn btn-outline-secondary pagination-btn-center" 
                    onClick={() => setCurrentSubjectPage((prev) => Math.min(prev + 1, totalSubjectPages))}  
                    disabled={currentSubjectPage === totalSubjectPages}  
                  >  
                    &gt;  
                  </button>  
                </div>  
              )}  
            </>  
          )}  

          
        </div>  

<div className="dashboard-column dashboard-right card p-3">
      {/* Add Subject Section */}
      <div className="mb-4">
        <h5>Add Subject</h5>
        <input
          className="form-control mb-2 custom-width"
  placeholder="New Subject Name"
  value={newSubject}
  onChange={(e) => setNewSubject(e.target.value)}
/>
<button className="btn btn-primary custom-width" onClick={handleAddSubject}>
  Add Subject
</button>
      </div>

  {/* Student Concerns Section */}
  <h4>Student Concerns</h4>
  {concerns.length === 0 ? (
    <p className="text-muted">No concerns submitted.</p>
  ) : (
    <>
  {currentConcerns.map((concern) => (
  <div
    key={concern.id}
    className={`card p-3 mb-2 ${concern.read ? "bg-light" : ""}`}
  >
    <p><strong>Student:</strong> {concern.studentName} ({concern.studentId})</p>
    
    {/* Make the concern text bold if not read */}
    <p style={{ fontWeight: concern.read ? "normal" : "bold" }}>
      <strong>Concern:</strong> {concern.concern}
    </p>

    <div className="d-flex justify-content-end gap-2">
      {!concern.read && (
        <button
          className="btn btn-success btn-sm"
          onClick={() => handleMarkAsDone(concern.id)}
        >
          Mark as Done
        </button>
      )}
      <button
        className="btn btn-danger btn-sm"
        onClick={() => handleDeleteConcern(concern.id)}
      >
        Delete
      </button>
    </div>
  </div>
))}
      {/* Concerns Pagination Controls */}
      {concerns.length > itemsPerPage && (
        <div className="d-flex justify-content-center gap-1 mt-3">
          <button
            className="btn btn-outline-secondary btn-sm pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          <span className="align-self-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
           className="btn btn-outline-secondary btn-sm pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </>
  )}
</div>  
      </div>  
    </div>  
  );  
}  

export default ProfessorDashboard;
