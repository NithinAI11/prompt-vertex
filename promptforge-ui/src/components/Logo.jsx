import { Box } from '@mui/material';

const Logo = () => {
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* The Vertex Shape (Triangle Node Network) */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vertexGrad" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Connection Lines */}
        <path d="M20 5 L35 32 L5 32 Z" stroke="url(#vertexGrad)" strokeWidth="2" fill="none" opacity="0.5" />
        
        {/* Nodes (Vertices) */}
        <circle cx="20" cy="5" r="3.5" fill="url(#vertexGrad)" filter="url(#glow)" />
        <circle cx="35" cy="32" r="3.5" fill="url(#vertexGrad)" />
        <circle cx="5" cy="32" r="3.5" fill="url(#vertexGrad)" />
        
        {/* Center Node (The "Prompt") */}
        <circle cx="20" cy="22" r="2" fill="#fff" />
        <path d="M20 5 L20 22 M35 32 L20 22 M5 32 L20 22" stroke="url(#vertexGrad)" strokeWidth="1.5" opacity="0.8" />
      </svg>
    </Box>
  );
};

export default Logo;