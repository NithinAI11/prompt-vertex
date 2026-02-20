// FILE: promptforge-ui/src/pages/SettingsPage.jsx

import { useState, useContext } from 'react';
import {
  Box, Typography, TextField, Button, Switch, FormControlLabel,
  Snackbar, Alert, Divider, Tooltip, IconButton, InputAdornment,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  CircularProgress, useTheme, Fade, Collapse,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import KeyIcon             from '@mui/icons-material/Key';
import BrushIcon           from '@mui/icons-material/Brush';
import SdStorageIcon       from '@mui/icons-material/SdStorage';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import CancelIcon          from '@mui/icons-material/Cancel';
import Visibility          from '@mui/icons-material/Visibility';
import VisibilityOff       from '@mui/icons-material/VisibilityOff';
import PersonIcon          from '@mui/icons-material/Person';
import ColorLensIcon       from '@mui/icons-material/ColorLens';
import BubbleChartIcon     from '@mui/icons-material/BubbleChart';
import SaveIcon            from '@mui/icons-material/Save';
import DeleteForeverIcon   from '@mui/icons-material/DeleteForever';
import FileDownloadIcon    from '@mui/icons-material/FileDownload';
import ChevronRightIcon    from '@mui/icons-material/ChevronRight';

import { SettingsContext } from '../context/SettingsContext';
import { ThemeContext }    from '../context/ThemeContext';
import { clearHistory, getHistory } from '../services/api';
import { useNavigate }     from 'react-router-dom';

// ── Color swatch ──────────────────────────────────────────────────────────────
const ColorSwatch = ({ color, value, selected, onClick }) => (
  <Box
    onClick={() => onClick(value)}
    sx={{
      width: 36, height: 36, borderRadius: '50%', bgcolor: color,
      cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: selected ? '2px solid white' : '2px solid transparent',
      boxShadow: selected ? `0 0 0 2.5px ${color}` : `0 0 0 1px rgba(0,0,0,0.12)`,
      transition: 'all 0.18s ease',
      '&:hover': { transform: 'scale(1.12)' },
    }}
  >
    {selected && <CheckCircleIcon sx={{ color: 'white', fontSize: 17 }} />}
  </Box>
);

// ── API key field ─────────────────────────────────────────────────────────────
const ApiKeyField = ({ name, label, value, tooltip, onChange, required }) => {
  const [show, setShow] = useState(false);
  const theme = useTheme();
  const isSet = !!value?.length;

  return (
    <Tooltip title={tooltip} placement="top-start" arrow>
      <TextField
        fullWidth
        variant="outlined"
        label={label}
        name={name}
        type={show ? 'text' : 'password'}
        value={value || ''}
        onChange={onChange}
        size="small"
        helperText={isSet ? 'Key is configured and ready.' : 'Not yet set.'}
        FormHelperTextProps={{ sx: { color: isSet ? 'success.main' : 'text.disabled', ml: 0 } }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            bgcolor: alpha(theme.palette.background.default, 0.5),
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <KeyIcon sx={{ fontSize: 18, color: isSet ? 'primary.main' : 'action.disabled' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isSet
                ? <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main', mr: 0.5 }} />
                : required
                  ? <CancelIcon sx={{ fontSize: 18, color: 'error.light', mr: 0.5 }} />
                  : null}
              <IconButton onClick={() => setShow(s => !s)} edge="end" size="small">
                {show ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Tooltip>
  );
};

// ── Settings sidebar item ─────────────────────────────────────────────────────
const SettingsNavItem = ({ icon: Icon, label, desc, active, onClick }) => {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2, py: 1.75,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        bgcolor: active
          ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.13 : 0.07)
          : 'transparent',
        color: active ? 'text.primary' : 'text.secondary',
        '&:hover': {
          bgcolor: active
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.action.hover, 0.6),
        },
      }}
    >
      <Box sx={{
        width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: active ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.text.disabled, 0.07),
        border: '1px solid',
        borderColor: active ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.6),
        transition: 'all 0.18s ease',
      }}>
        <Icon sx={{ fontSize: 17, color: active ? 'primary.main' : 'text.secondary' }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: active ? 700 : 500, fontSize: '0.875rem', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>{desc}</Typography>
      </Box>
      {active && <ChevronRightIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.6 }} />}
    </Box>
  );
};

// ── Section heading inside content panel ─────────────────────────────────────
const PanelSection = ({ title, children }) => (
  <Box>
    <Typography variant="caption" sx={{
      fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
      color: 'text.disabled', fontSize: '0.63rem', display: 'block', mb: 1.5,
    }}>
      {title}
    </Typography>
    {children}
  </Box>
);

// ── Sections metadata ─────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'appearance', icon: BrushIcon,      label: 'Appearance',     desc: 'Theme, accent & profile'  },
  { id: 'apikeys',    icon: KeyIcon,         label: 'API Keys',       desc: 'Provider credentials'     },
  { id: 'data',       icon: SdStorageIcon,   label: 'Data',           desc: 'History & export'         },
];

export default function SettingsPage() {
  const { settings, isLoading, updateSettings, saveSettingsToServer } = useContext(SettingsContext);
  const { mode, toggleTheme, accent, setAccent }                       = useContext(ThemeContext);
  const theme    = useTheme();
  const navigate = useNavigate();

  const [active,            setActive]            = useState('appearance');
  const [snackbarOpen,      setSnackbarOpen]      = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    updateSettings({ [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async () => {
    await saveSettingsToServer();
    setSnackbarOpen(true);
  };

  const handleClearHistory = () => {
    clearHistory();
    setConfirmDialogOpen(false);
    navigate(0);
  };

  const handleExportHistory = () => {
    const history = getHistory();
    const uri     = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const a       = document.createElement('a');
    a.setAttribute('href', uri);
    a.setAttribute('download', `promptforge_history_${new Date().toISOString().split('T')[0]}.json`);
    a.click();
  };

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  );

  // ── Content panels ──────────────────────────────────────────────────────────
  const appearancePanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PanelSection title="Accent Color">
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {[
            { color: '#f43f5e', value: 'red'      },
            { color: '#0ea5e9', value: 'blue'     },
            { color: '#8b5cf6', value: 'lavender' },
            { color: '#f59e0b', value: 'yellow'   },
            { color: '#059669', value: 'green'    },
          ].map(s => (
            <ColorSwatch key={s.value} color={s.color} value={s.value} selected={accent === s.value} onClick={setAccent} />
          ))}
        </Box>
      </PanelSection>

      <Divider />

      <PanelSection title="Profile">
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={settings.username || ''}
          onChange={handleChange}
          size="small"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18 }} /></InputAdornment>,
          }}
        />
      </PanelSection>

      <Divider />

      <PanelSection title="Interface">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={<Switch checked={mode === 'dark'} onChange={toggleTheme} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ColorLensIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">Dark Mode</Typography>
              </Box>
            }
          />
          <FormControlLabel
            control={<Switch name="enableParticles" checked={settings.enableParticles || false} onChange={handleChange} size="small" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BubbleChartIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">Floating Particles</Typography>
              </Box>
            }
          />
        </Box>
      </PanelSection>
    </Box>
  );

  const apiKeysPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PanelSection title="Primary Provider — Required">
        <ApiKeyField
          name="geminiApiKey" label="Gemini API Key"
          value={settings.geminiApiKey} required
          tooltip="Required for all core prompt generation features."
          onChange={handleChange}
        />
      </PanelSection>

      <Divider />

      <PanelSection title="Council Providers — Optional">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ApiKeyField name="perplexityApiKey" label="Perplexity"        value={settings.perplexityApiKey} tooltip="Enables the Perplexity Council review." onChange={handleChange} />
          <ApiKeyField name="openaiApiKey"     label="OpenAI"            value={settings.openaiApiKey}     tooltip="Enables GPT models in Cross-Provider Council." onChange={handleChange} />
          <ApiKeyField name="anthropicApiKey"  label="Anthropic (Claude)" value={settings.anthropicApiKey}  tooltip="Enables Claude models in Cross-Provider Council." onChange={handleChange} />
          <ApiKeyField name="grokApiKey"       label="Grok (xAI)"        value={settings.grokApiKey}       tooltip="Enables Grok models in Cross-Provider Council." onChange={handleChange} />
        </Box>
      </PanelSection>

      <Divider />

      <PanelSection title="Discovery Pipeline — Optional">
        <ApiKeyField name="tavilyApiKey" label="Tavily" value={settings.tavilyApiKey} tooltip="Required for the automated prompt discovery pipeline." onChange={handleChange} />
      </PanelSection>
    </Box>
  );

  const dataPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PanelSection title="Prompt History">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          Your prompt history is stored locally in this browser. You can export it as JSON for backup, or permanently delete all records.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportHistory}
            sx={{ borderRadius: '10px' }}
          >
            Export as JSON
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setConfirmDialogOpen(true)}
            sx={{ borderRadius: '10px' }}
          >
            Clear All History
          </Button>
        </Box>
      </PanelSection>
    </Box>
  );

  const panels = { appearance: appearancePanel, apikeys: apiKeysPanel, data: dataPanel };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexShrink: 0 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 0.5 }}>
            <span className="gradient-text">Application Settings</span>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize your Vertex Studio experience.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          sx={{ borderRadius: '12px', px: 3, py: 1.25, flexShrink: 0 }}
        >
          Save Settings
        </Button>
      </Box>

      {/* ── Two-column layout ── */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 3, overflow: 'hidden' }}>

        {/* Left: category nav */}
        <Box sx={{
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '18px',
          p: 1.5,
          alignSelf: 'flex-start', // don't stretch to full height
        }}>
          <Typography variant="caption" sx={{
            fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
            color: 'text.disabled', fontSize: '0.62rem', px: 2, py: 1, display: 'block',
          }}>
            Categories
          </Typography>
          {SECTIONS.map(s => (
            <SettingsNavItem
              key={s.id}
              icon={s.icon}
              label={s.label}
              desc={s.desc}
              active={active === s.id}
              onClick={() => setActive(s.id)}
            />
          ))}
        </Box>

        {/* Right: content panel */}
        <Box sx={{
          flex: 1,
          minWidth: 0,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '18px',
          overflowY: 'auto',
        }}>
          {SECTIONS.map(s => (
            <Fade key={s.id} in={active === s.id} timeout={200} unmountOnExit mountOnEnter>
              <Box sx={{ p: 4 }}>
                {/* Panel header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
                  <Box sx={{
                    width: 38, height: 38, borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.25),
                  }}>
                    <s.icon sx={{ fontSize: 18, color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                      {s.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3.5, opacity: 0.5 }} />

                {active === s.id && panels[s.id]}
              </Box>
            </Fade>
          ))}
        </Box>
      </Box>

      {/* ── Dialogs & toasts ── */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Clear all history?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete your entire prompt history from this browser. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearHistory} color="error" variant="contained">Confirm & Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}