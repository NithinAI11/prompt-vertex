import { NavLink, useLocation } from 'react-router-dom';
import {
  Box, Typography, Divider, useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import HistoryIcon from '@mui/icons-material/History';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useState, useEffect } from 'react';
import { getHistory } from '../services/api';
import Logo from './Logo';

const navItems = [
  { text: 'Vertex Studio',  subtext: 'Prompt Engineering',    icon: AutoFixHighIcon,  path: '/',          badge: null   },
  { text: 'History Log',    subtext: 'Past Sessions',          icon: HistoryIcon,      path: '/history',   badge: 'count'},
  { text: 'Discovery',      subtext: 'Templates & Starters',   icon: AccountTreeIcon,  path: '/templates', badge: 'NEW'  },
  { text: 'Intelligence',   subtext: 'Performance Analytics',  icon: AnalyticsIcon,    path: '/analytics', badge: null   },
  { text: 'System',         subtext: 'Configuration',          icon: SettingsIcon,     path: '/settings',  badge: null   },
];

// Three-segment mini-bar – pure decoration, no hardcoded colors
const MiniBar = ({ active }) => {
  const theme = useTheme();
  const base = active ? theme.palette.primary.main : theme.palette.text.disabled;
  return (
    <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {[18, 10, 6].map((w, i) => (
        <Box key={i} sx={{
          height: 3, width: w, borderRadius: 2,
          bgcolor: active ? alpha(base, i === 0 ? 1 : i === 1 ? 0.45 : 0.2) : alpha(base, 0.18),
          transition: 'all 0.3s ease',
        }} />
      ))}
    </Box>
  );
};

const NavStation = ({ item, isActive, historyCount }) => {
  const theme = useTheme();
  const Icon = item.icon;
  const badgeLabel =
    item.badge === 'count' ? (historyCount > 0 ? String(historyCount) : null) : item.badge;

  return (
    <NavLink to={item.path} style={{ textDecoration: 'none' }}>
      <Box sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1.75,
        borderRadius: '14px',
        cursor: 'pointer',
        transition: 'background 0.22s ease, transform 0.15s ease',
        bgcolor: isActive ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.07) : 'transparent',
        '&:hover': {
          bgcolor: isActive
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.action.hover, 0.55),
          '& .subtext-label': { opacity: 1, transform: 'translateX(0)' },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0, top: '22%', height: '56%', width: 3,
          borderRadius: '0 3px 3px 0',
          bgcolor: 'primary.main',
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'scaleY(1)' : 'scaleY(0.3)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}>
        {/* Icon tile */}
        <Box sx={{
          width: 38, height: 38,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.text.disabled, 0.07),
          border: '1px solid',
          borderColor: isActive ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.7),
          transition: 'all 0.22s ease',
        }}>
          <Icon sx={{ fontSize: 18, color: isActive ? 'primary.main' : 'text.secondary', transition: 'color 0.22s ease' }} />
        </Box>

        {/* Labels */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'text.primary' : 'text.secondary',
              fontSize: '0.875rem',
              lineHeight: 1.2,
              transition: 'all 0.22s ease',
            }}>
              {item.text}
            </Typography>

            {badgeLabel && (
              <Box sx={{
                px: 0.9, py: 0.2,
                borderRadius: '6px',
                bgcolor: item.badge === 'NEW'
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.1),
                border: '1px solid',
                borderColor: item.badge === 'NEW'
                  ? alpha(theme.palette.success.main, 0.3)
                  : alpha(theme.palette.primary.main, 0.25),
              }}>
                <Typography variant="caption" sx={{
                  fontSize: '0.63rem', fontWeight: 800,
                  color: item.badge === 'NEW' ? 'success.main' : 'primary.main',
                  letterSpacing: '0.04em',
                }}>
                  {badgeLabel}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MiniBar active={isActive} />
            <Typography
              className="subtext-label"
              variant="caption"
              sx={{
                fontSize: '0.68rem',
                color: 'text.disabled',
                opacity: isActive ? 0.75 : 0,
                transform: isActive ? 'translateX(0)' : 'translateX(-5px)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {item.subtext}
            </Typography>
          </Box>
        </Box>
      </Box>
    </NavLink>
  );
};

export default function Sidebar() {
  const location = useLocation();
  const theme = useTheme();
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    setHistoryCount(getHistory().length);
  }, [location.pathname]);

  const primaryNav = navItems.slice(0, 4);
  const utilityNav  = navItems.slice(4);

  return (
    <Box sx={{
      width: 272,
      flexShrink: 0,
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}>

      {/* ── Brand ── */}
      <Box sx={{ px: 3, pt: 3.5, pb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Logo />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.15, fontSize: '1.05rem' }}>
              Prompt<span style={{ color: theme.palette.primary.main }}>Vertex</span>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.25 }}>
              <FiberManualRecordIcon sx={{ fontSize: 7, color: 'success.main' }} />
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Core v5.2 · Stable
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Counter card ── */}
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Box sx={{
          px: 2.5, py: 2,
          borderRadius: '14px',
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.09 : 0.05),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.18),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box>
            <Typography variant="caption" sx={{
              color: 'text.secondary', fontWeight: 600,
              fontSize: '0.66rem', letterSpacing: '0.09em', textTransform: 'uppercase',
            }}>
              Prompts Engineered
            </Typography>
            <Typography variant="h4" sx={{
              fontWeight: 800, color: 'primary.main',
              lineHeight: 1.1, mt: 0.25, letterSpacing: '-0.03em',
            }}>
              {historyCount.toLocaleString()}
            </Typography>
          </Box>

          {/* Tiny sparkline bars */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
            {[30, 55, 40, 78, 60, 100].map((h, i) => (
              <Box key={i} sx={{
                width: 4,
                height: `${(h / 100) * 26}px`,
                borderRadius: '2px',
                bgcolor: 'primary.main',
                opacity: 0.2 + i * 0.13,
              }} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Section label ── */}
      <Box sx={{ px: 3, pb: 1 }}>
        <Typography variant="caption" sx={{
          color: 'text.disabled', fontSize: '0.62rem',
          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Workspace
        </Typography>
      </Box>

      {/* ── Primary nav ── */}
      <Box sx={{ flex: 1, px: 1.5, display: 'flex', flexDirection: 'column', gap: 0.25, overflowY: 'auto', pb: 1 }}>
        {primaryNav.map(item => (
          <NavStation key={item.text} item={item} isActive={location.pathname === item.path} historyCount={historyCount} />
        ))}
      </Box>

      {/* ── Utility nav ── */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        <Divider sx={{ mb: 1.5, opacity: 0.45 }} />
        {utilityNav.map(item => (
          <NavStation key={item.text} item={item} isActive={location.pathname === item.path} historyCount={historyCount} />
        ))}
      </Box>

    </Box>
  );
}