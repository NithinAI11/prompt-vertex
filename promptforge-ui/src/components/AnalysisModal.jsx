import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Box, Typography, Card, CardContent, Grid, CircularProgress, Divider, Chip, Fade, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GppBadIcon from '@mui/icons-material/GppBad';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { getDetailedAnalysis } from '../services/api';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '1200px',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
};

const AnalysisCard = ({ title, score, strengths, weaknesses, improvements }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Typography variant="h3" color="primary" sx={{ mb: 2 }}>{score}/100</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Strengths:</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{strengths}</Typography>
            {weaknesses && (
                <>
                    <Typography variant="subtitle2" gutterBottom>Weaknesses:</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{weaknesses}</Typography>
                </>
            )}
            {improvements && (
                <>
                    <Typography variant="subtitle2" gutterBottom>Key Improvements:</Typography>
                    {improvements.map((item, index) => (
                        <Chip key={index} icon={<CheckCircleIcon />} label={item} size="small" sx={{ m: 0.5 }} color="success" variant="outlined" />
                    ))}
                </>
            )}
        </CardContent>
    </Card>
);

AnalysisCard.propTypes = {
  title: PropTypes.string.isRequired,
  score: PropTypes.number,
  strengths: PropTypes.string,
  weaknesses: PropTypes.string,
  improvements: PropTypes.arrayOf(PropTypes.string),
};

export default function AnalysisModal({ open, onClose, originalPrompt, forgedPrompt }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchAnalysis = async () => {
        setIsLoading(true);
        const result = await getDetailedAnalysis(originalPrompt, forgedPrompt);
        setAnalysis(result);
        setIsLoading(false);
      };
      fetchAnalysis();
    }
  }, [open, originalPrompt, forgedPrompt]);

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
        <Fade in={open}>
            <Box sx={modalStyle}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Prompt Quality Guardian Report</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
                {!isLoading && analysis && (
                    <Box sx={{ overflowY: 'auto' }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <AnalysisCard 
                                    title="Original Prompt" 
                                    score={analysis.original_prompt_analysis.score}
                                    strengths={analysis.original_prompt_analysis.strengths}
                                    weaknesses={analysis.original_prompt_analysis.weaknesses}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AnalysisCard 
                                    title="Forged Prompt" 
                                    score={analysis.forged_prompt_analysis.score}
                                    strengths={analysis.forged_prompt_analysis.strengths}
                                    improvements={analysis.forged_prompt_analysis.key_improvements}
                                />
                            </Grid>
                        </Grid>
                        <Card sx={{ mt: 3, bgcolor: 'action.hover' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Overall Verdict</Typography>
                                <Typography color="text.secondary">{analysis.overall_verdict}</Typography>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Box>
        </Fade>
    </Modal>
  );
}

AnalysisModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  originalPrompt: PropTypes.string.isRequired,
  forgedPrompt: PropTypes.string.isRequired,
};