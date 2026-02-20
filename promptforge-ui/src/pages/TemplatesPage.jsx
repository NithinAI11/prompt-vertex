// FILE: promptforge-ui/src/pages/TemplatesPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Typography, Card, Chip, Button, TextField, InputAdornment, ToggleButtonGroup, ToggleButton, CircularProgress } from '@mui/material';
import { getTemplates } from '../services/api';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TemplateCard from '../components/TemplateCard';
import TemplateModal from '../components/TemplateModal';

const TEMPLATE_CATEGORIES = [
  'All', 'Content Creation', 'Marketing', 'Education', 'Business', 'Technical', 'Creative'
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('uses');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    getTemplates()
      .then(data => {
        setTemplates(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filteredAndSortedTemplates = useMemo(() => {
    if (!templates) return [];
    return templates
      .filter(template => {
        const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
        const matchesSearch = (template.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (template.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'uses') return (b.uses || 0) - (a.uses || 0);
        return 0;
      });
  }, [templates, selectedCategory, searchQuery, sortBy]);

  const handleSortChange = (event, newSortBy) => {
    if (newSortby !== null) {
      setSortBy(newSortBy);
    }
  };

  const handleCardClick = (template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          <span className="gradient-text">Prompt Discovery</span>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore trending and effective prompts discovered from the web
        </Typography>
      </Box>

      {/* This is the complete Filter and Search UI Card */}
      <Card className="glass-card" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth placeholder="Search discovered prompts..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ToggleButtonGroup value={sortBy} exclusive onChange={handleSortChange}>
              <ToggleButton value="uses" aria-label="sort by popularity">
                <TrendingUpIcon sx={{ mr: 1 }}/> Popular
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              {TEMPLATE_CATEGORIES.map((category) => (
                <Chip key={category} label={category} onClick={() => setSelectedCategory(category)}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* This is the Content Display section */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredAndSortedTemplates.map((template, index) => (
              // This ensures a 2-column layout on medium screens and larger
              <Grid item xs={12} md={6} key={template.id}>
                <TemplateCard 
                  template={template} 
                  index={index}
                  onClick={handleCardClick} 
                />
              </Grid>
            ))}
          </Grid>

          {filteredAndSortedTemplates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No Prompts Found</Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search filters or wait for the discovery pipeline to find new prompts.
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* This is the Modal that appears on click */}
      <TemplateModal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        template={selectedTemplate} 
      />
    </Box>
  );
}