import React, { useState } from "react";
import './LoginForm.css';

function Login({ setAuth }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();

    fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid credentials");
        return res.json();
      })
      .then((data) => {
        setAuth(data);
      })
      .catch((err) => alert(err.message));
  };

  // Register handler
  const handleRegister = (e) => {
    e.preventDefault();

    fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, password }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.message); });
        }
        return res.json();
      })
      .then(() => {
        alert("Registration successful! Please log in.");
        setId("");
        setName("");
        setPassword("");
        setIsRegistering(false);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="Entire">
      <header className="navbar">
        <img src="/UBLOGO.png" alt="UB Logo" className="logo2" />
        <h1 className="ubTitle">UNIVERSITY OF BATANGAS</h1>
      </header>

      <div className="main-layout">
        <div className="left-box">
          <a href="https://ub.edu.ph/ubbc/about/" className="card-link">
            <div className="card-shadow">PVMGO</div>
          </a>
          <a href="https://ub.edu.ph" className="card-link">
            <div className="card-shadow">SCHOOL</div>
          </a>
          <a href="https://ub.edu.ph/ubbc/engineering/" className="card-link">
            <div className="card-shadow">INFORMATION</div>
          </a>
        </div>

        <div className={`card login-container ${isRegistering ? "expanded" : ""}`}>
          <img src="/CPESS.png" alt="CPESS Logo" className="logo" />

          {isRegistering ? (
            // Registration form
            <form onSubmit={handleRegister}>
              <div className="studentID">
                <label>Student ID:</label><br />
                <input
                  type="text"
                  name ="id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  placeholder="1600307"
                />
              </div>
              <div className="name">
                <label>Name:</label><br />
                <input
                  type="text"
                  name = "name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Full Name"
                />
              </div>
              <div className="password">
                <label>Password:</label><br />
                <input
                  type="password"
                  name = "password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                />
              </div>
              <button type="submit">Register</button>
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => setIsRegistering(false)}>
                  Log In
                </button>
              </p>
            </form>
          ) : (
            // Login form
            <form onSubmit={handleLogin}>
              <div className="studentID">
                <label>Student ID:</label><br />
                <input
                  type="text"
                  name = "id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  placeholder="1600307"
                />
              </div>
              <div className="password">
                <label>Password:</label><br />
                <input
                  type="password"
                  name = "password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                />
              </div>
              <button type="submit">Login</button>
              <p className="register-text">
  No Account?
  <button type="button" onClick={() => setIsRegistering(true)}>
    Register here
  </button>
</p>
            </form>
          )}
        </div>

        <div className="card right-box">
          <div className="inbox1">
            <h3>Vision</h3>
            <p>
              The Computer Engineering Department envisions to be recognized as
              one of the leading providers of competitive IT professionals in
              various IT related industries both locally and internationally. It
              commits itself in delivering quality education, and thus, strives
              to become a center of excellence.
            </p>
          </div>
          <div className="inbox2">
            <h3>Mission</h3>
            <p>
              The Computer Engineering department is committed in preparing its
              graduates for professional computer engineering careers which
              includes leading roles in the design, analysis and application of
              computing structures that involve hardware and software. The
              graduates must have a strong foundation in their education in
              order to participate in a global, technological, and
              research-driven environment.
            </p>
          </div>
        </div>
      </div>

      <div className="LoginForm-footer">
        © 2025 CPESS Student Portal. All rights reserved.
      </div>
    </div>
  );
}

export default Login;
