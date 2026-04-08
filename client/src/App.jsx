import { Navigate, Route, Routes } from 'react-router-dom';
import FlightMapTestPage from './pages/FlightMapTestPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/flight-map" element={<FlightMapTestPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
