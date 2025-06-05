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
 
  // Pagination states for subjects (1 per page)   
  const [currentSubjectPage, setCurrentSubjectPage] = useState(1);   
  const subjectsPerPage = 1;   
 
  // Pagination state for tasks per subject   
  const [currentTaskPages, setCurrentTaskPages] = useState({});   
  const tasksPerPage = 1; // Set to 1 for pagination 
 
  const [selectedSubject, setSelectedSubject] = useState(""); 
  const [filteredStudents, setFilteredStudents] = useState([]); 
  const [loading, setLoading] = useState(false); 
 
  // Pagination for table rows   
  const [tableRows, setTableRows] = useState([]); 
  const [tableCurrentPage, setTableCurrentPage] = useState(1); 
  const tableRowsPerPage = 4; // Ensure 4 rows per page 
 
  const indexOfLastRow = tableCurrentPage * tableRowsPerPage; 
  const indexOfFirstRow = indexOfLastRow - tableRowsPerPage; 
  const currentTableRows = tableRows.slice(indexOfFirstRow, indexOfLastRow); 
  const totalTablePages = Math.ceil(tableRows.length / tableRowsPerPage); 
 
 
  useEffect(() => {   
    fetch("http://localhost:5000/api/students")   
      .then((res) => res.json())   
      .then(setStudents)   
      .catch(() => alert("Failed to fetch students"));   
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
 
  useEffect(() => { 
    if (!selectedSubject) return; 
 
    setLoading(true); 
    fetch(`http://localhost:5000/api/students-bysubject/${encodeURIComponent(selectedSubject)}`) 
      .then((res) => res.json()) 
      .then((data) => { 
        setFilteredStudents(data); 
        setLoading(false); 
      }) 
      .catch((err) => { 
        console.error("Error fetching students:", err); 
        setLoading(false); 
      }); 
  }, [selectedSubject]); 
 
  useEffect(() => { 
  // Flatten students data to rows for the table 
  const rows = []; 
 
  students.forEach((student) => { 
    const studentId = student.id; 
    const semester = student.semester || "1st Semester"; 
    const schoolYear = student.schoolYear || "2023-2024"; 
 
    if (student.subjects) { 
      Object.entries(student.subjects).forEach(([subjectName, tasks]) => { 
        // tasks can be empty array or undefined 
        if (tasks && tasks.length > 0) { 
          tasks.forEach((task) => { 
            rows.push({
  id: task.id, // ✅ Make sure this is included
  studentId,
  subjectCode: subjectName,
  subjectName: subjectName,
  semester,
  schoolYear,
  taskName: task.name || "N/A",
  fileName: task.fileName || "N/A",
  status: task.status || "Pending",
});
          }); 
        } else { 
          // No tasks for this subject, add one row with empty task fields 
          rows.push({ 
            studentId, 
            subjectCode: subjectName, 
            subjectName: subjectName, 
            semester, 
            schoolYear, 
            taskName: "N/A", 
            fileName: "N/A", 
            studentName: student.name, 
            status: "Pending", // Default status 
          }); 
        } 
      }); 
    } else { 
      // No subjects, add one row per student with empty subject/task fields? 
      rows.push({ 
        studentId, 
        subjectCode: "N/A", 
        subjectName: "N/A", 
        semester, 
        schoolYear, 
        taskName: "N/A", 
        fileName: "N/A", 
        studentName: student.name, 
        status: "Pending", // Default status 
      }); 
    } 
  }); 
 
  setTableRows(rows); 
  setTableCurrentPage(1); // Reset to first page when data changes 
}, [students]); 
 
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
      // Additional logic can go here if needed 
    } 
  }; 
 
  const handleSubjectSelect = async (subject) => { 
    if (!subject) { 
      setFilteredStudents([]); 
      setTableRows([]); 
      setLoading(false); 
      return; 
    } 
     
    setSelectedSubject(subject); 
    setLoading(true); 
 
    try { 
      // Step 1: Fetch all student IDs and names 
      const studentListRes = await fetch("http://localhost:5000/api/students"); 
      const studentList = await studentListRes.json(); 
 
      // Step 2: Fetch detailed data for each student 
      const detailedStudents = await Promise.all( 
        studentList.map(async (student) => { 
          try { 
            const res = await fetch(`http://localhost:5000/api/student/${student.id}`); 
            return res.json(); 
          } catch (error) { 
            console.error(`Error fetching data for student ${student.id}:`, error); 
            return { ...student, subjects: {} }; // Return basic student info with empty subjects 
          } 
        }) 
      ); 
 
      // Step 3: Filter students who have the selected subject 
      const matching = detailedStudents 
        .filter((student) => student.subjects && student.subjects[subject]) 
        .map((student) => ({ 
          ...student, 
          subjectData: { 
            code: subject, // Replace with real code if available 
            name: subject, 
            unit: student.subjects[subject]?.unit || "N/A", 
            tasks: Array.isArray(student.subjects[subject]) ? student.subjects[subject] : [], 
          }, 
        })); 
 
      setFilteredStudents(matching); 
      setCurrentSubjectPage(1); 
       
      // Step 4: Update table rows with filtered students 
      const newTableRows = []; 
      matching.forEach(student => { 
        const studentId = student.id; 
        const studentName = student.name; 
        const semester = student.semester || "1st Semester"; 
        const schoolYear = student.schoolYear || "2023-2024"; 
         
        if (student.subjectData.tasks && student.subjectData.tasks.length > 0) { 
          // Add a row for each task 
          student.subjectData.tasks.forEach(task => { 
            newTableRows.push({ 
              studentId, 
              studentName, 
              subjectCode: student.subjectData.code, 
              subjectName: student.subjectData.name, 
              semester, 
              schoolYear, 
              taskName: task.name || "N/A", 
              fileName: task.fileName || "N/A", 
              status: task.status || "Pending" 
            }); 
          }); 
        } else { 
          // Add one row with no tasks 
          newTableRows.push({ 
            studentId, 
            studentName, 
            subjectCode: student.subjectData.code, 
            subjectName: student.subjectData.name, 
            semester, 
            schoolYear, 
            taskName: "N/A", 
            fileName: "N/A", 
            status: "Pending" 
          }); 
        } 
      }); 
       
      setTableRows(newTableRows); 
      setTableCurrentPage(1); // Reset to first page 
    } catch (error) { 
      console.error("Error loading students:", error); 
      setFilteredStudents([]); 
      setTableRows([]); 
    } finally { 
      setLoading(false); 
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
 
  // Subjects pagination logic 
  const subjectsArray = Object.entries(formData.subjects);   
  const totalSubjectPages = Math.ceil(subjectsArray.length / subjectsPerPage);   
  const currentSubjectIndex = currentSubjectPage - 1;   
  const currentSubject = subjectsArray[currentSubjectIndex]; // [subject, tasks] or undefined if none 
   
  // Function to handle subject pagination 
  const handleSubjectPagination = (direction) => { 
    if (direction === 'prev') { 
      setCurrentSubjectPage(prev => Math.max(prev - 1, 1)); 
    } else { 
      setCurrentSubjectPage(prev => Math.min(prev + 1, totalSubjectPages)); 
    } 
  }; 
 
  // Task Pagination Logic per subject   
  const handleTaskPagination = (subject) => {  
    if (!subject || !formData.subjects || !formData.subjects[subject]) return []; 
    const currentTaskPage = currentTaskPages[subject] || 1; 
    const indexOfLastTask = currentTaskPage;  
    const indexOfFirstTask = indexOfLastTask - 1;  
    return formData.subjects[subject].slice(indexOfFirstTask, indexOfLastTask); 
  }; 
 
  return (   
    <div className="prof-entire-body">   
      <div className="prof-header">   
        <div className="prof-navbar">   
          <img src="/CPESS.png" alt="CPESS Logo" className="logo3" />   
          <h1>Professor Dashboard</h1>   
          <button className="prof-button-logout" onClick={handleLogout}>   
            Logout   
          </button>   
        </div>   
      </div>   
 
      <div className="prof-main-row">   
        <div className="prof-left-container">   
          <div className="prof-main-header">Subject & Task</div>   
          <div className="prof-main-box">   
            {filteredStudents.length === 0 ? (   
              <p>No students found for this subject.</p>   
            ) : (   
              filteredStudents.map((student, index) => (   
                <div key={index}>   
                  <div className="field-row-container">   
                    <div className="field-row">   
                      <span className="label">Student Name:</span>   
                      <span className="value">{student.name}</span>   
                    </div>   
                    <div className="field-row">   
                      <span className="label">Semester:</span>   
                      <span className="value">{student.semester || "N/A"}</span>   
                    </div>   
                  </div>   
 
                  <div className="field-row-container">   
                    <div className="field-row">   
                      <span className="label">Student ID:</span>   
                      <span className="value">{student.id}</span>   
                    </div>   
                    <div className="field-row">   
                      <span className="label">School Year:</span>   
                      <span className="value">{student.schoolYear || "N/A"}</span>   
                    </div>   
                  </div>   
 
                  <div className="field-row">   
                    <span className="label">Subject Code:</span>   
                    <span className="value">{student.subjectData?.code || "N/A"}</span>   
                  </div>   
                  <div className="field-row">   
                    <span className="label">Subject Name:</span>   
                    <span className="value">{student.subjectData?.name}</span>   
                  </div>   
                  <div className="field-row">   
                    <span className="label">Unit:</span>   
                    <span className="value">{student.subjectData?.unit}</span>   
                  </div>   
                   <div className="field-row">   
                    <span className="label">Task/Activity name: </span>   
                    <span className="value">{student.subjectData?.taskName}</span>   
                  </div>   
                  <div className="field-row">   
                    <span className="label">Filename: </span>   
                    <span className="value">{student.subjectData?.fileName}</span>   
                  </div>   
 
                  {student.subjectData?.tasks?.length > 0 && ( 
                    <div> 
                      <div className="field-row"> 
                        <span className="label">Task/Activity Name:</span> 
                        <span className="value">{handleTaskPagination(student.subjectData?.code)?.[0]?.name || "N/A"}</span> 
                      </div> 
                      <div className="field-row"> 
                        <span className="label">File Name:</span> 
                        <span className="value">{handleTaskPagination(student.subjectData?.code)?.[0]?.fileName || "N/A"}</span> 
                      </div> 
                      <div className="pagination-buttons"> 
                        <button 
                          className="prof-nav-btn task-nav-btn" 
                          onClick={() => { 
                            setCurrentTaskPages((prev) => ({ 
                              ...prev, 
                              [student.subjectData?.code]: Math.max((prev[student.subjectData?.code] || 1) - 1, 1), 
                            })); 
                          }} 
                          disabled={(currentTaskPages[student.subjectData?.code] || 1) <= 1} 
                        > 
                          &lt; 
                        </button> 
                        <span className="page-info"> 
                          Task {currentTaskPages[student.subjectData?.code] || 1} of {student.subjectData?.tasks?.length || 1} 
                        </span> 
                        <button 
                          className="prof-nav-btn task-nav-btn" 
                          onClick={() => { 
                            setCurrentTaskPages((prev) => ({ 
                              ...prev, 
                              [student.subjectData?.code]: Math.min((prev[student.subjectData?.code] || 1) + 1, student.subjectData?.tasks?.length || 1), 
                            })); 
                          }} 
                          disabled={(currentTaskPages[student.subjectData?.code] || 1) >= (student.subjectData?.tasks?.length || 1)} 
                        > 
                          &gt; 
                        </button> 
                      </div> 
                    </div> 
                  )} 
                  <hr />   
                </div>   
              ))   
            )}   
          </div>   
        </div>   
 
        <div className="prof-right-container">   
          <div className="prof-profile-header">Subjects</div>   
          <div className="prof-profile-box">   
            <div>   
              <select   
                className="prof-horizontal-dropdown"   
                onChange={(e) => handleSubjectSelect(e.target.value)}   
                defaultValue=""   
              >   
                <option value="">Select Subject</option>   
                <option value="Software Design">Software Design</option>   
                <option value="FeedBack">FeedBack</option>   
                <option value="Microprocessor">Microprocessor</option>   
                <option value="Operating System">Operating System</option>   
                <option value="Cisco 2">Cisco 2</option>   
                <option value="Mixed Signals">Mixed Signals</option>   
                <option value="Practice and Design">Practice and Design</option>   
              </select> 
               
              <div className="status-legend"> 
                <h4>Status Legend:</h4> 
                <div className="status-item"> 
                  <span className="status-dot completed"></span> 
                  <span><strong>Completed</strong> - activity or task was already checked/graded by the professor</span> 
                </div> 
                <div className="status-item"> 
                  <span className="status-dot incomplete"></span> 
                  <span><strong>Incomplete</strong> - there's a problem or remaining part of the activity was missing</span> 
                </div> 
                <div className="status-item"> 
                  <span className="status-dot pending"></span> 
                  <span><strong>Pending</strong> - waiting to be reviewed by the professor</span> 
                </div> 
              </div> 
            </div>   
          </div>   
        </div>   
      </div>   
 
      <table className="prof-dashboard-table"> 
        <thead> 
          <tr> 
            <th>Student ID</th> 
            <th>Student Name</th> 
            <th>Subject Code</th> 
            <th>Subject Name</th> 
            <th style={{ minWidth: "120px" }}>Semester</th> 
            <th style={{ minWidth: "120px" }}>School Year</th> 
            <th>Task/Activity Name: </th> 
            <th>File Name</th> 
            <th style={{ width: "200px" }}>Action</th> 
          </tr> 
        </thead> 
        <tbody> 
          {loading ? ( 
            <tr> 
              <td colSpan="9" style={{ textAlign: "center" }}> 
                <div className="loading-spinner">Loading...</div> 
              </td> 
            </tr> 
          ) : currentTableRows.length === 0 ? ( 
            <tr> 
              <td colSpan="9" style={{ textAlign: "center" }}> 
                No data found. Please select a subject from the dropdown. 
              </td> 
            </tr> 
          ) : ( 
            currentTableRows.map((row, idx) => ( 
              <tr key={idx}> 
                <td>{row.studentId}</td> 
                <td>{row.studentName}</td> 
                <td>{row.subjectCode}</td> 
                <td>{row.subjectName}</td> 
                <td>{row.semester}</td> 
                <td>{row.schoolYear}</td> 
                <td>{row.taskName}</td> 
                <td>{row.fileName}</td> 
                <td className="action-cell"> 
                  <select  
                    className={`status-dropdown ${row.status === "Completed" ? "statuscompleted" : row.status === "Incomplete" ? "status-incomplete" : "statuspending"}`} 
                    value={row.status || "Pending"} 
                    onChange={(e) => { 
                      const newStatus = e.target.value; 
                      // Update the row status 
                      const updatedRows = [...tableRows]; 
                      updatedRows[indexOfFirstRow + idx].status = newStatus; 
                      setTableRows(updatedRows); 
                       
                      // Send status update to server 
                      fetch(`http://localhost:5000/api/tasks/${row.id}/status`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: newStatus }),
})
                      .then(response => { 
                        if (!response.ok) { 
                          throw new Error('Failed to update task status'); 
                        } 
                        return response.json(); 
                      }) 
                      .then(data => { 
                        console.log('Status updated successfully:', data); 
                      }) 
                      .catch(error => { 
                        console.error('Error updating status:', error); 
                        alert('Failed to update task status. Please try again.'); 
                         
                        // Revert the status change in UI if server update fails 
                        const revertedRows = [...tableRows]; 
                        revertedRows[indexOfFirstRow + idx].status = row.status; 
                        setTableRows(revertedRows); 
                      }); 
                    }} 
                  > 
                    <option value="Pending" style={{fontSize: '16px'}}>Pending</option> 
                    <option value="Completed" style={{fontSize: '16px'}}>Completed</option> 
                    <option value="Incomplete" style={{fontSize: '16px'}}>Incomplete</option> 
                  </select> 
                </td> 
              </tr> 
            )) 
          )} 
        </tbody> 
      </table> 
 
      <div className="prof-pagination-container"> 
        <div className="prof-pagination"> 
          <button 
            className="prof-nav-btn" 
            onClick={() => setTableCurrentPage((p) => Math.max(p - 1, 1))} 
            disabled={tableCurrentPage === 1} 
          > 
            &lt; 
          </button> 
          <span className="page-info"> 
            Page {tableCurrentPage} of {totalTablePages} 
          </span> 
          <button 
            className="prof-nav-btn" 
            onClick={() => setTableCurrentPage((p) => Math.min(p + 1, totalTablePages))} 
            disabled={tableCurrentPage === totalTablePages} 
          > 
            &gt; 
          </button> 
        </div> 
        <div className="page-size-info">Showing {Math.min(tableRowsPerPage, currentTableRows.length)} of {tableRows.length} entries</div> 
      </div> 
 
      <div className="prof-footer">   
        <p>© 2025 CPESS Student Portal. All rights reserved.</p>   
      </div>   
    </div>   
  );   
}   
 
export default ProfessorDashboard;

