// FILE: promptforge-ui/src/components/TemplateCard.jsx
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Chip, Grow } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function TemplateCard({ template, onClick, index }) {
  const animationTimeout = 150 * (index % 10);

  return (
    <Grow in={true} timeout={animationTimeout}>
      <Card
        onClick={() => onClick(template)}
        sx={{
          height: '220px', 
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden', // Hide the parts of the graphic that go outside the card
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)',
            // --- FIX: Target the hover state for the internal animation ---
            '& .hover-arrow': {
              transform: 'translateX(5px)',
            },
            '& .background-graphic': {
              opacity: 1,
              transform: 'scale(1.5)',
            },
          },
        }}
      >
        {/* --- FIX: Add the animated background graphic --- */}
        <Box
          className="background-graphic"
          sx={{
            position: 'absolute',
            top: -50,
            right: -80,
            width: 200,
            height: 200,
            background: (theme) => `radial-gradient(circle, ${theme.palette.primary.main}15, transparent 70%)`,
            borderRadius: '50%',
            opacity: 0,
            transform: 'scale(0)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            zIndex: 0,
          }}
        />

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, zIndex: 1 }}>
          <Box>
            <Chip
              icon={<CategoryIcon />}
              label={template.category}
              size="small"
              sx={{ bgcolor: 'rgba(102,126,234,0.1)', color: '#667eea', mb: 2 }}
            />
            <Typography 
              variant="h6" 
              component="h3" 
              sx={{ 
                fontWeight: 600,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {template.title}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
              View Prompt
            </Typography>
            <ArrowForwardIcon 
              className="hover-arrow" 
              sx={{ color: 'primary.main', transition: 'transform 0.3s ease' }} 
            />
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
}

TemplateCard.propTypes = {
  template: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};