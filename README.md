# SD-ReactJS


# First Open XAMPP and start the Apache and MySQL
# Second Open http://localhost/phpmyadmin/
# Third Create a Database name it student_portal
# Fourth Add this Code to the SQL TAB
  CREATE TABLE students (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100),
  password VARCHAR(100)
  );
  
  CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20),
  subject_name VARCHAR(100),
  task_name VARCHAR(100),
  status VARCHAR(50),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );
  
   CREATE TABLE concern (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20),
  concern TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );
  
# Fifth run the node server.js (run this where your server.js is located) 
 -> make sure that it display Server running at http://localhost:5000
# Sixth run the ReactJS uisng npm run start ( run this where your src is located)


# inside where src is located install the Following:
npm install bootstrap

# inside where server.js is located install the Following:
npm init -y

npm install express cors body-parser

npm install axios

npm install mysql12
