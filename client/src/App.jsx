import { Navigate, Route, Routes } from 'react-router-dom';
import FlightMapTestPage from './pages/FlightMapTestPage';
import HomePage from './pages/HomePage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/flight-map" element={<FlightMapTestPage />} />
      <Route path="/analytics" element={<AnalyticsDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
