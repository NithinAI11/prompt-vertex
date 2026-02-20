import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Box, Typography, Button, Alert, Card, CardContent, Paper,
  TextareaAutosize, Collapse, Chip, Slider, Grid, FormControlLabel,
  Switch, Tooltip, Divider, SvgIcon, ToggleButtonGroup, ToggleButton,
  useTheme, Avatar, IconButton, Fade, CircularProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TuneIcon from '@mui/icons-material/Tune';
import ArticleIcon from '@mui/icons-material/Article';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ScienceIcon from '@mui/icons-material/Science'; 
import GroupIcon from '@mui/icons-material/Group';
import GavelIcon from '@mui/icons-material/Gavel';
import CloseIcon from '@mui/icons-material/Close';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import WorkflowVisualizer from '../components/WorkflowVisualizer';
import PromptOutput from '../components/PromptOutput';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveToHistory, getPromptSuggestions } from '../services/api';
import { SettingsContext } from '../context/SettingsContext';

// ===== Icons for Providers =====
const PerplexityIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" /></SvgIcon>
);
const OpenAIIcon = (props) => (<SvgIcon {...props}><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1195 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4078-.667zM20.483 5.0631a4.4708 4.4708 0 0 1 .5346 3.0137l-.142-.0852-4.783-2.7582a.7712.7712 0 0 0-.7806 0L9.4692 8.6019V6.2695a.0804.0804 0 0 1 .0332-.0615l4.9478-2.8556a4.485 4.485 0 0 1 6.0328 1.7107zM12.0035 11.9619l-3.0231-1.7454 3.1039-1.791 3.0655 1.7692-3.1463 1.7672z" fill="currentColor"/></SvgIcon>);
const AnthropicIcon = (props) => (<SvgIcon {...props}><path d="M16.55 19.33H19L13.11 3.63h-2.22L5 19.33h2.44l1.56-4.44h6l1.55 4.44zm-5.44-11.4l2.11 5.56H10l1.11-5.56z" fill="currentColor"/></SvgIcon>);
const GrokIcon = (props) => (<SvgIcon {...props}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z" fill="currentColor"/></SvgIcon>);

// ===== Styled Components =====
const StyledTextarea = styled(TextareaAutosize)(({ theme }) => ({
  width: '100%',
  background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.6) : '#ffffff',
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: '16px',
  padding: '20px',
  color: theme.palette.text.primary,
  fontFamily: '"Plus Jakarta Sans", monospace',
  fontSize: '1.05rem',
  lineHeight: 1.6,
  resize: 'none',
  transition: 'all 0.3s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
  '&::placeholder': { color: theme.palette.text.secondary, opacity: 0.6 },
}));

const VertexCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : '#ffffff',
  backdropFilter: 'blur(10px)',
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: '24px',
  overflow: 'hidden', 
  display: 'flex',
  flexDirection: 'column',
}));

// Council Option Card (for animations)
const CouncilCard = ({ active, children, color = 'primary' }) => {
    const theme = useTheme();
    const activeColor = color === 'primary' ? theme.palette.primary.main : theme.palette.secondary.main;
    
    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 2, 
                border: '1px solid', 
                borderColor: active ? activeColor : theme.palette.divider,
                borderRadius: '12px',
                bgcolor: active ? alpha(activeColor, 0.05) : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: active ? 'scale(1.01)' : 'scale(1)',
                boxShadow: active ? `0 4px 12px ${alpha(activeColor, 0.1)}` : 'none',
                mb: 2 
            }}
        >
            {children}
        </Paper>
    );
};

// ===== Model Council Configuration =====
const COUNCIL_MODELS = {
  perplexity: { name: 'Perplexity', key: 'perplexityApiKey', models: ['sonar-reasoning', 'sonar-pro'], icon: <PerplexityIcon /> },
  openai: { name: 'OpenAI', key: 'openaiApiKey', models: ['gpt-4o', 'o3-mini'], icon: <OpenAIIcon /> },
  anthropic: { name: 'Anthropic', key: 'anthropicApiKey', models: ['claude-3.5-sonnet'], icon: <AnthropicIcon /> },
  grok: { name: 'Grok', key: 'grokApiKey', models: ['grok-4'], icon: <GrokIcon /> },
};

export default function ForgePage() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Auto');
  const [agentData, setAgentData] = useState({});
  const [finalPrompt, setFinalPrompt] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1.0);
  const [topK, setTopK] = useState(40);
  const [useCouncil, setUseCouncil] = useState(false);
  const [useCrossProviderCouncil, setUseCrossProviderCouncil] = useState(false);
  const [currentView, setCurrentView] = useState('workflow');

  const { settings } = useContext(SettingsContext);
  const theme = useTheme();
  const eventSourceRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine availability
  const isPerplexityCouncilAvailable = settings && settings.perplexityApiKey;
  const activeCrossProviderCount = Object.values(COUNCIL_MODELS).filter(p => settings && settings[p.key]).length;
  const isCrossProviderCouncilAvailable = activeCrossProviderCount >= 2;
  const activeProviders = Object.values(COUNCIL_MODELS).filter(p => settings && settings[p.key]);

  // ===== UPDATED: Effect for History/Template Loading =====
  useEffect(() => {
    if (location.state) {
      if (location.state.type === 'history_playback') {
        // Scenario 1: Viewing History
        // Set inputs
        setPrompt(location.state.original);
        // Set outputs
        setFinalPrompt(location.state.forged);
        // Force status to complete to show Right Panel
        setStatus('complete');
        // Force view to output tab
        setCurrentView('output');
        // Hide suggestions since we have data
        setShowSuggestions(false);
      } else if (location.state.template) {
        // Scenario 2: Using Template
        setPrompt(location.state.template);
        setShowSuggestions(false);
        // Reset status for a fresh run
        setStatus('idle');
        setFinalPrompt('');
      }
      
      // Clear navigation state so refresh doesn't re-trigger
      if (location.state.type || location.state.template) {
          navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, navigate]);

  useEffect(() => {
    getPromptSuggestions(prompt).then(setSuggestions);
  }, [prompt]);

  const handleForge = () => {
    if (!prompt || status === 'streaming' || !settings) return;
    if (!settings.geminiApiKey) { setError("Gemini API Key missing. Add in Settings."); return; }
    
    setStatus('streaming');
    setError('');
    setAgentData({});
    setFinalPrompt('');
    setShowSuggestions(false);
    setCurrentView('workflow');

    const params = new URLSearchParams({
      prompt, tone, temperature, top_p: topP, top_k: topK,
      use_council: useCouncil, use_cross_provider_council: useCrossProviderCouncil
    });
    const url = `http://localhost:8001/forge-stream?${params.toString()}`;
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.error) {
        setError(`Stream Error: ${parsed.error}`);
        eventSourceRef.current.close();
        setStatus('idle');
        return;
      }
      setAgentData(prev => ({ ...prev, [parsed.node]: parsed }));
      if (parsed.data?.final_prompt) {
        setFinalPrompt(parsed.data.final_prompt);
        saveToHistory(prompt, parsed.data.final_prompt, Math.floor(Math.random() * 10) + 90);
        setStatus('complete');
        setCurrentView('output');
        eventSourceRef.current.close();
      }
    };
    eventSourceRef.current.onerror = () => { setError("Connection Error."); setStatus('idle'); if(eventSourceRef.current) eventSourceRef.current.close(); };
  };

  const isLoading = status === 'streaming';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 1 }}>
            <span className="gradient-text">Vertex Studio</span>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            Orchestrate a multi-agent workflow to research, deconstruct, and perfect your prompt.
          </Typography>
        </Box>
        <Chip icon={<ScienceIcon />} label="Research Agent Active" color="primary" variant="outlined" sx={{ borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
      </Box>

      {/* Main Split Interface */}
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden', borderRadius: 6 }}>
        <PanelGroup direction="horizontal" style={{ height: '100%' }}>
          
          {/* LEFT PANEL: INPUT & CONFIGURATION */}
          <Panel defaultSize={45} minSize={30}>
            {/*
              KEY FIX ARCHITECTURE:
              The left panel is a flex column:
                1. VertexCard fills the height as a flex column
                2. CardContent is the scrollable middle zone (flexGrow: 1, overflowY: auto, minHeight: 0)
                3. The Action Bar is a fixed-height footer that never scrolls
              
              Inside CardContent, all sections stack naturally — no absolute/overlap issues.
              When config expands or zoom changes, CardContent simply scrolls internally.
              Sections never bleed over each other because they're in normal document flow
              inside a properly bounded scroll container.
            */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pr: 2 }}>
              <VertexCard sx={{ flexGrow: 1, minHeight: 0 }}>
                
                {/* SCROLLABLE CONTENT AREA — the only scroll container on the left */}
                <Box
                  sx={{
                    flexGrow: 1,
                    minHeight: 0,           // critical: prevents flex child from overflowing parent
                    overflowY: 'auto',      // scroll happens HERE, not on the card
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      // Let content grow naturally — no fixed height, no overflow tricks here
                      // The outer Box handles scrolling
                      flexShrink: 0,      // CardContent shrinks to fit content, doesn't stretch to fill
                    }}
                  >
                    
                    {/* --- Section 1: Input --- */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                          1. Input Vertex
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          endIcon={showAdvanced ? <CloseIcon /> : <TuneIcon />}
                          sx={{ 
                              color: showAdvanced ? 'primary.main' : 'text.secondary',
                              bgcolor: showAdvanced ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                              borderRadius: '8px',
                              px: 2
                          }}
                        >
                          {showAdvanced ? 'Close Config' : 'Configuration'}
                        </Button>
                      </Box>
                      <StyledTextarea
                        minRows={6}
                        placeholder="Describe your objective. The Research Agent will ground it in truth..."
                        value={prompt}
                        onChange={(e) => { setPrompt(e.target.value); setShowSuggestions(!e.target.value); }}
                        disabled={isLoading}
                      />
                    </Box>

                    {/* Suggestions (Pills) */}
                    <Collapse in={showSuggestions && !prompt}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Quick Starts</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {suggestions.map(s => (
                            <Chip key={s.id} label={s.text.split('{')[0]} onClick={() => setPrompt(s.text)} clickable sx={{ borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid transparent', '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) } }} />
                          ))}
                        </Box>
                      </Box>
                    </Collapse>

                    {/* --- Advanced Configuration Panel (Expandable) --- */}
                    <Collapse in={showAdvanced} unmountOnExit>
                      <Fade in={showAdvanced}>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GavelIcon fontSize="small" /> Council & Quality Logic
                          </Typography>
                          
                          {/* Perplexity Council */}
                          {isPerplexityCouncilAvailable && (
                            <CouncilCard active={useCouncil} color="primary">
                              <FormControlLabel
                                control={<Switch checked={useCouncil} onChange={(e) => setUseCouncil(e.target.checked)} disabled={isLoading} color="primary" />}
                                label={<Typography variant="body2" fontWeight={600} color={useCouncil ? 'primary.main' : 'text.primary'}>Perplexity Verification Council</Typography>}
                                sx={{ width: '100%', mr: 0, m: 0 }}
                              />
                              <Collapse in={useCouncil}>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1, pl: 1 }}>
                                  • Engages <strong>Sonar Reasoning</strong> models to fact-check constraints. <br/>
                                  • Acts as a "Devil's Advocate" against hallucination.
                                </Typography>
                              </Collapse>
                            </CouncilCard>
                          )}

                          {/* Cross Provider Council */}
                          {isCrossProviderCouncilAvailable && (
                            <CouncilCard active={useCrossProviderCouncil} color="secondary">
                              <FormControlLabel
                                control={<Switch checked={useCrossProviderCouncil} onChange={(e) => setUseCrossProviderCouncil(e.target.checked)} disabled={isLoading} color="secondary" />}
                                label={<Typography variant="body2" fontWeight={600} color={useCrossProviderCouncil ? 'secondary.main' : 'text.primary'}>Cross-Provider Consensus</Typography>}
                                sx={{ width: '100%', mr: 0, m: 0 }}
                              />
                              <Collapse in={useCrossProviderCouncil}>
                                <Box sx={{ mt: 1.5, pl: 1 }}>
                                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                                    Aggregates critiques from industry leaders:
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {activeProviders.map(p => (
                                      <Chip key={p.name} icon={p.icon} label={p.name} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Box>
                              </Collapse>
                            </CouncilCard>
                          )}

                          <Divider sx={{ my: 2 }} />
                          
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Model Creativity (Temperature)</Typography>
                            <Box sx={{ px: 1 }}>
                              <Slider value={temperature} onChange={(e, v) => setTemperature(v)} min={0} max={1} step={0.1} marks valueLabelDisplay="auto" sx={{ color: 'primary.main', '& .MuiSlider-thumb': { boxShadow: '0 0 0 5px rgba(255,255,255,0.5)' } }} />
                            </Box>
                          </Box>
                        </Paper>
                      </Fade>
                    </Collapse>

                    {/* --- Section 2: Tone Selection --- */}
                    <Box>
                      <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, mb: 2 }}>2. Output Tone</Typography>
                      <Grid container spacing={2}>
                        {['Auto', 'Professional', 'Simple & Clear', 'Creative'].map((t) => (
                          <Grid item xs={6} md={3} key={t}>
                            <Button
                              fullWidth
                              variant={tone === t ? 'contained' : 'outlined'}
                              onClick={() => setTone(t)}
                              disabled={isLoading}
                              sx={{ 
                                height: '100%',
                                borderRadius: '12px',
                                borderColor: tone === t ? 'transparent' : theme.palette.divider,
                                bgcolor: tone === t ? 'primary.main' : 'transparent',
                                color: tone === t ? 'white' : 'text.secondary',
                                boxShadow: tone === t ? `0 8px 20px -5px ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    bgcolor: tone === t ? 'primary.dark' : alpha(theme.palette.primary.main, 0.05)
                                }
                              }}
                            >
                              {t}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    {/* Bottom padding so last element isn't flush against action bar shadow */}
                    <Box sx={{ height: 8 }} />

                  </CardContent>
                </Box>
                
                {/* ACTION BAR — fixed at bottom, never scrolls, always visible */}
                <Box
                  sx={{
                    flexShrink: 0,          // never compresses
                    p: 3,
                    borderTop: '1px solid',
                    borderColor: theme.palette.divider,
                    bgcolor: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    // Subtle shadow so user knows content scrolls behind it
                    boxShadow: `0 -4px 20px ${alpha(theme.palette.common.black, 0.06)}`,
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleForge}
                    disabled={!prompt.trim() || isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit"/> : <AutoFixHighIcon />}
                    sx={{ 
                      py: 2, 
                      fontSize: '1.1rem',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 10px 30px -5px ${alpha(theme.palette.primary.main, 0.4)}`
                    }}
                  >
                    {isLoading ? 'Processing Vertex Workflow...' : 'Initialize Forge Sequence'}
                  </Button>
                </Box>

              </VertexCard>
            </Box>
          </Panel>

          <PanelResizeHandle style={{ width: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'col-resize' }}>
            <Box sx={{ width: '4px', height: '60px', borderRadius: '4px', bgcolor: theme.palette.divider }} />
          </PanelResizeHandle>

          {/* RIGHT PANEL: VISUALIZATION & OUTPUT */}
          <Panel defaultSize={55} minSize={30}>
            <Box sx={{ height: '100%', pl: 2 }}>
               <VertexCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : undefined }}>
                 {status === 'complete' && (
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: theme.palette.divider, flexShrink: 0 }}>
                      <ToggleButtonGroup
                        value={currentView}
                        exclusive
                        onChange={(e, v) => { if (v) setCurrentView(v); }}
                        size="small"
                        fullWidth
                        sx={{ bgcolor: theme.palette.background.paper }}
                      >
                        <ToggleButton value="output" sx={{ py: 1.5 }}><ArticleIcon sx={{ mr: 1 }} />Final Artifact</ToggleButton>
                        <ToggleButton value="workflow" sx={{ py: 1.5 }}><AccountTreeIcon sx={{ mr: 1 }} />Agent Trace</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  )}

                  <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 4, position: 'relative' }}>
                    {status === 'idle' ? (
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.4 }}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'action.hover', mb: 2 }}>
                          <GroupIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                        </Avatar>
                        <Typography variant="h6">Workflow Idle</Typography>
                        <Typography variant="body2">Awaiting Initialization...</Typography>
                      </Box>
                    ) : (
                      currentView === 'output' && status === 'complete'
                        ? <PromptOutput originalPrompt={prompt} finalPrompt={finalPrompt} />
                        : <WorkflowVisualizer agentData={agentData} isLoading={isLoading} />
                    )}
                  </Box>
               </VertexCard>
            </Box>
          </Panel>

        </PanelGroup>
      </Box>
      
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 4 }}>{error}</Alert>}
    </Box>
  );
}