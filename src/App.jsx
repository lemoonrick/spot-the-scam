import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import StartScreen from './StartScreen'; // Ensure you have this as a separate file or component
import ScamScreen from './ScamScreen';

export default function App() {
  const [results, setResults] = useState([]);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<StartScreen />} />
          {/* :id allows us to track history like /quiz/1, /quiz/2 */}
          <Route
            path="/quiz/:id"
            element={<ScamScreen results={results} setResults={setResults} />}
          />
        </Routes>
      </div>
    </Router>
  );
}
