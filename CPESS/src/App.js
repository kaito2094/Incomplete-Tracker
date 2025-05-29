import React, { useState } from "react";
import StudentDashboard from "./StudentDashboard";
import ProfessorDashboard from "./ProfessorDashboard";
import Login from "./Login";

function App() {
  const [auth, setAuth] = useState(null);

  return (
    <div>
      {!auth ? (
        <Login setAuth={setAuth} />
      ) : auth.role === "student" ? (
        <StudentDashboard studentId={auth.id} setAuth={setAuth} />
      ) : (
        <ProfessorDashboard setAuth={setAuth} />
      )}
    </div>
  );
}

export default App;
