import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../fir/pages/HomePage';
import ComplaintForm from '../fir/pages/ComplaintForm';
import TaskDetails from '../fir/TaskDetails';
import Dashboard from '../fir/Dashboard';
import AIAgent from '../fir/pages/AIAgent';
import Gen from '../fir/Gen';

interface Props {}

const SignedIn: React.FC<Props> = () => {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
                  <Route path="/file-complaint" element={<ComplaintForm />} />
                  <Route path="/track-complaint" element={<TaskDetails />} />
                  <Route path="/officer" element={<Dashboard />} />
                  <Route path="/gen" element={<Gen />} />
                  <Route path="/ai-agent" element={<AIAgent />} />
        </Routes>
      </Router>
  );
};

export default SignedIn;