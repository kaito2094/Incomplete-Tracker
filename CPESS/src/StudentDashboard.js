import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';

function StudentDashboard({ studentId, setAuth }) {
    const [studentData, setStudentData] = useState(null);
    const [taskName, setTaskName] = useState("");
    const [taskFile, setTaskFile] = useState(null);
    const [description, setDescription] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [unit, setUnit] = useState("");
    const [semester, setSemester] = useState("");
    const [schoolYear, setSchoolYear] = useState("");
    const [reason, setReason] = useState("");
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 4;

    const fetchStudentData = () => {
        fetch(`http://localhost:5000/api/student/${studentId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load student data");
                return res.json();
            })
            .then((data) => {
                setStudentData(data);
            })
            .catch((err) => {
                console.error(err);
                alert("Error loading student data.");
            });
    };

    useEffect(() => {
        fetchStudentData();
    }, [studentId]);

    const handleLogout = () => {
        setAuth(null);
    };

    const handleCancel = () => {
        setTaskName("");
        setTaskFile(null);
        setDescription("");
        setSubjectCode("");
        setSubjectName("");
        setUnit("");
        setSemester("");
        setSchoolYear("");
        setReason("");
        setFileInputKey(Date.now());
    };

    const handleSubmit = () => {
        // Validate all required fields
        const requiredFields = {
            'Task Name': taskName,
            'Subject Code': subjectCode,
            'Subject Name': subjectName,
            'Semester': semester,
            'School Year': schoolYear,
            'Unit': unit,
            'File': taskFile
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([field]) => field);

        if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        const formData = new FormData();
        formData.append("student_id", studentId);
        formData.append("task_name", taskName);
        formData.append("subject_code", subjectCode);
        formData.append("subject_name", subjectName);
        formData.append("semester", semester);
        formData.append("school_year", schoolYear);
        formData.append("file", taskFile);
        formData.append("description", description);
        formData.append("unit", unit);
        formData.append("reason", reason);

        fetch("http://localhost:5000/api/upload", {
            method: "POST",
            body: formData,
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to upload task");
                return data;
            })
            .then((data) => {
                alert("Task uploaded successfully!");
                
                // Create a new task object with the response data
                const newTask = {
                    subject_code: subjectCode,
                    subject_name: subjectName,
                    semester: semester,
                    school_year: schoolYear,
                    task_name: taskName,
                    status: "Incomplete", // Set initial status to Incomplete as per server
                    description: description,
                    unit: unit,
                    reason: reason
                };

                // Update the local state with the new task
                setStudentData(prevData => ({
                    ...prevData,
                    tasks: [...(prevData?.tasks || []), newTask]
                }));
                
                // Reset form
                handleCancel();
                
                // Refresh student data to get the latest tasks
                fetchStudentData();
            })
            .catch(err => {
                console.error("Upload error:", err);
                alert(err.message || "Error uploading task. Please try again.");
            });
    };

    if (!studentData) return <p className="text-center mt-5">Loading...</p>;

    const allTasks = studentData.tasks || [];
    const totalPages = Math.ceil(allTasks.length / rowsPerPage);
    const displayedTasks = allTasks.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

    return (
        <div className="student-dashboard-entire-body">
            <div className="student-navbar">
                <img src="/CPESS.png" alt="CPESS Logo" className="logo3" />
                <h1 className="student-dashboard-title">Student Dashboard</h1>
                <button className="student-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
            <div className="student-main-content-row">
                <div className="student-main-left">
                    <div className="student-main-header">Subject & Task</div>
                    <div className="student-main-box">
                        <div className="student-main-form-row">
                            <div className="student-main-form-col">
                                <div className="student-main-label-row">
                                    <span className="student-main-label">Student Name:</span>
                                    <span className="student-main-value">{studentData.name}</span>
                                </div>
                                <div className="student-main-label-row">
                                    <span className="student-main-label">Student Id:</span>
                                    <span className="student-main-value">{studentData.id}</span>
                                </div>
                                <div className="student-main-label">
                                    Subject Code:
                                    <input type="text" className="student-main-input11" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
                                </div>
                                <div className="student-main-label">
                                    Subject Name:
                                    <input type="text" className="student-main-input10" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                                </div>
                                <div className="student-main-label4">
                                    Unit
                                    <select className="student-main-input2" value={unit} onChange={(e) => setUnit(e.target.value)}>
                                        <option value="">Select</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                    </select>
                                </div>
                            </div>
                            <div className="student-main-form-col2">
                                <div className="student-main-label3">
                                    Semester:
                                    <select className="student-main-input" value={semester} onChange={(e) => setSemester(e.target.value)}>
                                        <option value="">Select</option>
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                </div>
                                <div className="student-main-label2">
                                    School year:
                                    <input type="text" className="student-main-input" value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="student-main-reason-row">
                            <div className="student-main-reason-label">REASON:</div>
                            <textarea className="student-main-reason-textarea" value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
                        </div>
                    </div>
                </div>
                <div className="student-main-right">
                    <div className="student-profile-header">Profile</div>
                    <div className="student-profile-box">
                        <div className="student-profile-label">NAME:</div>
                        <span className="student-main-value">{studentData.name}</span>
                        <div className="student-profile-label">Student ID:</div>
                        <span className="student-main-value">{studentData.id}</span>
                        <div className="student-profile-task-header">TASK TO COMPLETE</div>
                        <div className="student-profile-label">Task / Activity:</div>
                        <input type="text" className="student-profile-input" placeholder="Enter task/activity" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
                        <div className="student-profile-label">Description:</div>
                        <input type="text" className="student-profile-input" value={description} onChange={(e) => setDescription(e.target.value)} />
                        <div className="student-profile-label">Upload File:</div>
                        <input key={fileInputKey} type="file" className="student-profile-input" onChange={(e) => setTaskFile(e.target.files[0])} />
                        <div className="student-profile-buttons-row">
                            <button className="student-profile-btn" onClick={handleSubmit}>Submit</button>
                            <button className="student-profile-btn" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mt-5">
                <h3 className="mb-3">Task Summary</h3>
                <table className="table table-striped table-bordered">
                    <thead className="table-dark">
                        <tr>
                            <th>Student ID</th>
                            <th>Subject Code</th>
                            <th>Subject Name</th>
                            <th>Semester</th>
                            <th>School Year</th>
                            <th>Task / Activity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTasks.length === 0 ? (
                            <tr><td colSpan="7" className="text-center">No tasks found.</td></tr>
                        ) : (
                            displayedTasks.map((task, index) => (
                                <tr key={index}>
                                    <td>{studentData.id}</td>
                                    <td>{task.subject_code}</td>
                                    <td>{task.subject_name}</td>
                                    <td>{task.semester}</td>
                                    <td>{task.school_year}</td>
                                    <td>{task.task_name}</td>
                                    <td>{task.status}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="student-bottom-right-buttons d-flex align-items-center">
                <button className="student-nav-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))} disabled={currentPage === 0}>&lt;</button>
                <span className="mx-3">Page {currentPage + 1} of {totalPages}</span>
                <button className="student-nav-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))} disabled={currentPage >= totalPages - 1}>&gt;</button>
            </div>
            <div className="student-footer">© 2025 University of Batangas - Student Portal</div>
        </div>
    );
}

export default StudentDashboard;
