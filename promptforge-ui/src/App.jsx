// FILE: promptforge-ui/src/App.jsx
import { Box, Container } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ForgePage from './pages/ForgePage';
import HistoryPage from './pages/HistoryPage';
import TemplatesPage from './pages/TemplatesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          height: '100vh', 
          overflowY: 'auto',
          width: 'calc(100vw - 280px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* The key change is setting maxWidth={false} to allow content to fill the space */}
        <Container maxWidth={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 0, sm: '0 !important'} }}>
          <Routes>
            <Route path="/" element={<ForgePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default App;