import logo from './logo.svg';
import './App.css';
import LoginPage from './components/pages/LoginPage';
import AttendanceList from './components/pages/TeacherAttendance';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiginUpPage from './components/pages/SignupPage';
import TeacherReportPage from './components/pages/TeacherReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Define the LoginPage as the root route */}
        <Route path="/" element={<LoginPage />} />

        {/* Define SignUpPage route */}
        <Route path="/signup" element={<SiginUpPage />} />

        {/* Define AttendanceList route */}
        <Route path="/AttendanceList" element={<AttendanceList />} />

          {/* Define AttendanceList route */}
          <Route path="/TeacherReportPage" element={<TeacherReportPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
