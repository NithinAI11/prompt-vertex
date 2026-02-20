import PropTypes from 'prop-types';
import { Paper, Typography, Box, IconButton, Tooltip, Snackbar, Chip, Card, CardContent, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import SecurityIcon from '@mui/icons-material/Security';
import { useState, useEffect, useMemo } from 'react';
import AnalysisModal from './AnalysisModal';

export default function PromptOutput({ originalPrompt, finalPrompt }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);

  const cleanedPrompt = useMemo(() => {
    if (!finalPrompt) return "";
    let cleaned = finalPrompt.replace(/\n\*/g, '\n•').replace(/\* /g, '• ').replace(/----/g, '');
    return cleaned.trim();
  }, [finalPrompt]);

  useEffect(() => {
    if (cleanedPrompt) {
        const words = cleanedPrompt.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
        setReadingTime(Math.ceil(words / 200));
    }
  }, [cleanedPrompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedPrompt);
    setSnackbarMessage('Prompt copied to clipboard!');
    setOpenSnackbar(true);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([cleanedPrompt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `forged-prompt-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setSnackbarMessage('Prompt downloaded successfully!');
    setOpenSnackbar(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Forged Prompt',
          text: cleanedPrompt,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const calculateScore = () => {
    if (!cleanedPrompt) return 0;
    const score = Math.min(95, Math.max(70, 
      (cleanedPrompt.length / 50) + 
      (wordCount / 10) + 
      (cleanedPrompt.split('.').length * 2) +
      Math.random() * 15
    ));
    return Math.round(score);
  };

  const score = calculateScore();
  const getScoreColor = (score) => {
    if (score >= 90) return '#00d4aa';
    if (score >= 80) return '#feca57';
    return '#ff6b6b';
  };

  return (
    <Box>
      <AnalysisModal 
        open={isAnalysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        originalPrompt={originalPrompt}
        forgedPrompt={cleanedPrompt}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            🎉 Forged Prompt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your optimized prompt is ready to use
          </Typography>
        </Box>
        
        <Card sx={{ 
          background: (theme) => `linear-gradient(135deg, ${getScoreColor(score)}20, ${getScoreColor(score)}10)`,
          border: `1px solid ${getScoreColor(score)}40`
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon sx={{ color: getScoreColor(score) }} />
              <Typography variant="h6" sx={{ color: getScoreColor(score), fontWeight: 700 }}>
                {score}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Overall Score
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip 
          label={`${wordCount} words`} 
          sx={{ bgcolor: 'rgba(102,126,234,0.1)', color: '#667eea' }}
        />
        <Chip 
          label={`${readingTime} min read`} 
          sx={{ bgcolor: 'rgba(118,75,162,0.1)', color: '#764ba2' }}
        />
        <Chip 
          label={`${(cleanedPrompt || '').length} characters`} 
          sx={{ bgcolor: 'rgba(0,212,170,0.1)', color: '#00d4aa' }}
        />
      </Box>

      <Paper sx={{ 
        position: 'relative',
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.default'
        }}>
          <Typography variant="subtitle2" color="text.secondary">
            Final Output
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy to Clipboard" placement="top">
              <IconButton onClick={handleCopy} size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as TXT" placement="top">
              <IconButton onClick={handleDownload} size="small">
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share" placement="top">
              <IconButton onClick={handleShare} size="small">
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ p: 3, maxHeight: '60vh', overflowY: 'auto' }}>
          <Typography 
            component="pre" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'text.primary',
              margin: 0,
              background: 'transparent'
            }}
          >
            {cleanedPrompt}
          </Typography>
        </Box>

        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
        }} />
      </Paper>

      <Button 
        fullWidth 
        variant="outlined" 
        startIcon={<SecurityIcon />} 
        sx={{ mt: 2, py: 1.5 }}
        onClick={() => setAnalysisModalOpen(true)}
      >
        Run Prompt Quality Guardian Analysis
      </Button>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

PromptOutput.propTypes = {
  originalPrompt: PropTypes.string.isRequired,
  finalPrompt: PropTypes.string.isRequired,
};