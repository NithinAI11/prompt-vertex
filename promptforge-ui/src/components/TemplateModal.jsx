// FILE: promptforge-ui/src/components/TemplateModal.jsx
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Modal, Box, Typography, Chip, Button, IconButton, Snackbar, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useState } from 'react';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '800px',
  bgcolor: 'background.paper',
  border: '1px solid rgba(102, 126, 234, 0.3)',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
};

export default function TemplateModal({ open, onClose, template }) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  if (!template) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(template.template);
    setSnackbarOpen(true);
  };

  const handleUseInForge = () => {
    navigate('/', { state: { template: template.template } });
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        closeAfterTransition
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                {template.title}
              </Typography>
              <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Box>

            {/* Metadata */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <Chip icon={<CategoryIcon />} label={template.category} />
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <TrendingUpIcon sx={{ fontSize: 18, mr: 0.5 }} />
                <Typography variant="body2">{(template.uses || 0).toLocaleString()} uses</Typography>
              </Box>
            </Box>

            {/* Prompt Content */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography
                component="pre"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.95rem' }}
              >
                {template.template}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" startIcon={<FileCopyIcon />} onClick={handleCopy}>
                Copy Prompt
              </Button>
              <Button variant="contained" startIcon={<AutoFixHighIcon />} onClick={handleUseInForge}>
                Use in Forge
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Prompt copied to clipboard!"
      />
    </>
  );
}

TemplateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  template: PropTypes.object,
};