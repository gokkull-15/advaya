import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import ComplaintForm from './pages/ComplaintForm';
import './App.css';
import TaskDetails from './TaskDetails';
import Dashboard from './Dashboard';
import AIAgent from './pages/AIAgent'; // This should be your main AIAgent component
 

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/file-complaint" element={<ComplaintForm />} />
        <Route path="/track-complaint" element={<TaskDetails />} />
        <Route path="/officer" element={<Dashboard />} />
        <Route path="/ai-agent" element={<AIAgent />} />
      </Routes>
    </Router>
  );
}

export default App;