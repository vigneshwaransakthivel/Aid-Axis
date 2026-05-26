import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Nutrition from './pages/Nutrition';
import Medications from './pages/Medications';
import BloodDonor from './pages/BloodDonor';
import HealthLocker from './pages/HealthLocker';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="medications" element={<Medications />} />
          <Route path="blood-donor" element={<BloodDonor />} />
          <Route path="health-locker" element={<HealthLocker />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
