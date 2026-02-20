import { useState, useEffect } from 'react';
import { Box, Typography, Card, Button, List, ListItem, Divider, Chip } from '@mui/material';
import { getHistory } from '../services/api';
import { useNavigate } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleViewPrompt = (item) => {
    // Pass both prompts and a type flag so ForgePage knows what to do
    navigate('/', { 
      state: { 
        type: 'history_playback',
        original: item.originalPrompt,
        forged: item.finalPrompt 
      } 
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          <span className="gradient-text">Prompt History</span>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and reuse your previously forged prompts
        </Typography>
      </Box>
      
      <Card className="glass-card">
        <List disablePadding>
          {history.length > 0 ? (
            history.map((item, index) => (
              <Box key={item.id}>
                <ListItem sx={{ p: 3, display: {xs: 'block', md: 'flex'}, gap: 2, alignItems: 'center' }}>
                  <Box sx={{ flex: 1, mb: {xs: 2, md: 0} }}>
                    <Typography variant="caption" color="text.secondary">{item.date}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, my: 1, color: 'text.primary' }}>
                      {item.originalPrompt.length > 120 ? item.originalPrompt.substring(0, 120) + '...' : item.originalPrompt}
                    </Typography>
                    <Chip 
                      label={`Score: ${item.score}`} 
                      icon={<StarIcon />} 
                      size="small"
                      sx={{ bgcolor: 'rgba(254, 202, 87, 0.1)', color: '#feca57', '& .MuiChip-icon': { color: '#feca57' } }}
                    />
                  </Box>
                  <Button 
                    variant="outlined" 
                    onClick={() => handleViewPrompt(item)}
                    startIcon={<VisibilityIcon />}
                    sx={{ borderRadius: '10px' }}
                  >
                    View Result
                  </Button>
                </ListItem>
                {index < history.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />}
              </Box>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary">No history yet.</Typography>
              <Typography variant="body2" color="text.secondary">Forge a prompt to see it here!</Typography>
            </Box>
          )}
        </List>
      </Card>
    </Box>
  );
}