// FILE: promptforge-ui/src/pages/AnalyticsPage.jsx

import { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent,
  Chip, Grow, List, ListItem, ListItemText, Divider,
  useTheme, Skeleton
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowUpwardIcon        from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon      from '@mui/icons-material/ArrowDownward';
import TrendingUpIcon         from '@mui/icons-material/TrendingUp';
import StarIcon               from '@mui/icons-material/Star';
import ElectricBoltIcon       from '@mui/icons-material/ElectricBolt';
import ArticleIcon            from '@mui/icons-material/Article';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AbcIcon                from '@mui/icons-material/Abc';

import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
  Area, Bar, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Cell,
  PieChart, Pie,
  Legend,
} from 'recharts';
import { getHistory } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// CHART HEIGHT — explicit px so Recharts never renders at height:0.
// Recharts ResponsiveContainer with height="100%" inside a flex child
// without an explicit parent height = broken charts. Always use px.
// ─────────────────────────────────────────────────────────────────────────────
const CHART_H = 280;

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      p: 1.5, borderRadius: '10px',
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
      boxShadow: theme.shadows[4], minWidth: 110,
    }}>
      {label && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.map(p => (
        <Typography key={p.dataKey ?? p.name} variant="body2" sx={{ color: p.color ?? p.fill, fontWeight: 600 }}>
          {p.name}: {p.value}
        </Typography>
      ))}
    </Box>
  );
};

// ── KPI card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color, trend, delay }) => {
  const theme = useTheme();
  const resolvedColor = theme.palette[color]?.main ?? theme.palette.primary.main;
  return (
    <Grow in timeout={delay}>
      <Card sx={{
        height: '100%', borderRadius: '16px', border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper', overflow: 'hidden', position: 'relative',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': { boxShadow: theme.shadows[6], transform: 'translateY(-2px)' },
      }}>
        <Box sx={{
          position: 'absolute', top: -16, right: -16,
          width: 72, height: 72, borderRadius: '50%',
          bgcolor: alpha(resolvedColor, 0.07), pointerEvents: 'none',
        }} />
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(resolvedColor, 0.1),
            }}>
              <Icon sx={{ fontSize: 18, color: `${color}.main` }} />
            </Box>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                {trend >= 0
                  ? <ArrowUpwardIcon sx={{ fontSize: 12, color: 'success.main' }} />
                  : <ArrowDownwardIcon sx={{ fontSize: 12, color: 'error.main' }} />}
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.67rem', color: trend >= 0 ? 'success.main' : 'error.main' }}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, mb: 0.4 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
            {label}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.67rem', display: 'block', mt: 0.4 }}>
              {sub}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
};

// ── Chart card wrapper ────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, delay }) => {
  const theme = useTheme();
  return (
    <Grow in timeout={delay}>
      <Card sx={{
        height: '100%', borderRadius: '16px', border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: theme.shadows[4] },
      }}>
        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              {title}
            </Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {/* Explicit height — critical for Recharts to render */}
          <Box sx={{ height: CHART_H, width: '100%', flexShrink: 0 }}>
            {children}
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <Typography variant="caption" sx={{
    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'text.disabled', fontSize: '0.64rem', display: 'block', mb: 1.5,
  }}>
    {children}
  </Typography>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const history = getHistory();
    if (!history.length) { setLoading(false); return; }

    const total       = history.length;
    const avgScore    = Math.round(history.reduce((a, i) => a + i.score, 0) / total);
    const avgLen      = Math.round(history.reduce((a, i) => a + i.originalPrompt.length, 0) / total);
    const avgWords    = Math.round(history.reduce((a, i) => a + i.finalPrompt.trim().split(/\s+/).length, 0) / total);
    const successRate = Math.round((history.filter(i => i.score >= 85).length / total) * 100);
    const avgImprove  = Math.round(
      history.reduce((a, i) => {
        const d = i.finalPrompt.length - i.originalPrompt.length;
        return i.originalPrompt.length > 0 && d > 0 ? a + (d / i.originalPrompt.length) * 100 : a;
      }, 0) / total
    );

    const rawPerf = history.slice(0, 30).reverse().map(i => ({
      date: new Date(i.id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Quality: i.score, Volume: 1,
    }));
    const perfMap = {};
    rawPerf.forEach(r => {
      if (!perfMap[r.date]) perfMap[r.date] = { date: r.date, Quality: 0, Volume: 0, count: 0 };
      perfMap[r.date].Quality += r.Quality;
      perfMap[r.date].Volume  += r.Volume;
      perfMap[r.date].count++;
    });
    const performanceData = Object.values(perfMap).map(r => ({ ...r, Quality: Math.round(r.Quality / r.count) }));

    const categoryPerformance = [
      { subject: 'Creative',  A: 98, fullMark: 100 },
      { subject: 'Content',   A: 95, fullMark: 100 },
      { subject: 'Business',  A: 88, fullMark: 100 },
      { subject: 'Marketing', A: 82, fullMark: 100 },
      { subject: 'Technical', A: 75, fullMark: 100 },
      { subject: 'Education', A: 70, fullMark: 100 },
    ];

    const scoreDistribution = history.reduce((acc, i) => {
      if (i.score >= 90) acc[0].count++;
      else if (i.score >= 80) acc[1].count++;
      else acc[2].count++;
      return acc;
    }, [
      { name: 'Excellent 90+', count: 0 },
      { name: 'Good 80–89',    count: 0 },
      { name: 'Standard <80',  count: 0 },
    ]);

    const successRateData = [
      { name: 'Successful',        value: successRate,       fill: theme.palette.success.main },
      { name: 'Needs Improvement', value: 100 - successRate, fill: alpha(theme.palette.text.disabled, 0.12) },
    ];

    setData({ total, avgScore, avgLen, avgWords, successRate, avgImprove,
              performanceData, categoryPerformance, scoreDistribution, successRateData,
              recent: history.slice(0, 5) });
    setLoading(false);
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: '16px' }} />
      ))}
    </Box>
  );

  if (!data) return (
    <Box sx={{ textAlign: 'center', mt: 12 }}>
      <Typography variant="h5" color="text.secondary" gutterBottom>No data yet</Typography>
      <Typography color="text.disabled">Start forging prompts to unlock your analytics.</Typography>
    </Box>
  );

  // All chart colors from theme — zero hardcoded hex
  const cPrimary   = theme.palette.primary.main;
  const cSecondary = theme.palette.secondary?.main ?? theme.palette.primary.light;
  const cSuccess   = theme.palette.success.main;
  const cWarning   = theme.palette.warning.main;
  const cError     = theme.palette.error.main;
  const cGrid      = alpha(theme.palette.divider, 0.45);
  const cAxis      = theme.palette.text.disabled;
  const distColors = [cSuccess, cPrimary, cWarning];

  return (
    // width: 100% + no max-width = fills the entire right-side content area
    <Box sx={{ width: '100%', pb: 3 }}>

      {/* ── Page header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 0.5 }}>
          <span className="gradient-text">Analytics Dashboard</span>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unique insights into your prompt engineering performance.
        </Typography>
      </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — KPI STRIP
          CSS grid: 6 equal columns, each auto-fills to exactly 1/6 of the
          full container width. No MUI negative-margin leakage.
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionLabel>Key Metrics</SectionLabel>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 2,
        width: '100%',
        mb: 3.5,
        // Responsive: collapse to 3 cols on tablet, 2 on mobile
        '@media (max-width: 900px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
        '@media (max-width: 600px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
      }}>
        {[
          { label: 'Total Prompts',    value: data.total,             icon: ArticleIcon,             color: 'primary',   trend: 12, delay: 150 },
          { label: 'Avg. Score',       value: data.avgScore,          icon: StarIcon,                color: 'warning',   trend: -2, delay: 250 },
          { label: 'Success Rate',     value: `${data.successRate}%`, icon: CheckCircleOutlineIcon,  color: 'success',   trend: 3,  delay: 350 },
          { label: 'Avg. Length',      value: `${data.avgLen}c`,      icon: TrendingUpIcon,          color: 'info',      trend: 5,  delay: 450, sub: 'characters' },
          { label: 'Avg. Words',       value: data.avgWords,          icon: AbcIcon,                 color: 'error',     trend: -1, delay: 550 },
          { label: 'Avg. Improvement', value: `+${data.avgImprove}%`, icon: ElectricBoltIcon,        color: 'secondary', trend: 8,  delay: 650 },
        ].map(kpi => (
          <Box key={kpi.label} sx={{ minWidth: 0 }}>
            <KpiCard {...kpi} />
          </Box>
        ))}
      </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — PERFORMANCE TRENDS  (uniform 2 × 2 CSS grid)
          Two equal columns, each exactly 50% of container. No MUI margin math.
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionLabel>Performance Trends</SectionLabel>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2.5,
        width: '100%',
        mb: 3.5,
        '@media (max-width: 900px)': { gridTemplateColumns: '1fr' },
      }}>

        {/* 1 — Quality Over Time */}
        <Box sx={{ minWidth: 0 }}>
          <ChartCard title="Quality Over Time" subtitle="Rolling average score per day" delay={700}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <ComposedChart data={data.performanceData} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={cPrimary} stopOpacity={0.32} />
                    <stop offset="95%" stopColor={cPrimary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={cGrid} />
                <XAxis dataKey="date" stroke={cAxis} fontSize={11} tick={{ fill: cAxis }} />
                <YAxis yAxisId="l" domain={[60, 100]} stroke={cPrimary}    fontSize={11} tick={{ fill: cAxis }} />
                <YAxis yAxisId="r" orientation="right" stroke={cSecondary} fontSize={11} tick={{ fill: cAxis }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
                <Area yAxisId="l" type="monotone" dataKey="Quality" name="Quality"
                  stroke={cPrimary} strokeWidth={2.5} fill="url(#gradArea)" dot={false} />
                <Bar yAxisId="r" dataKey="Volume" name="Volume"
                  barSize={12} fill={alpha(cSecondary, 0.38)} radius={[3, 3, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>

        {/* 2 — Success Rate Donut */}
        <Box sx={{ minWidth: 0 }}>
          <ChartCard title="Success Rate" subtitle="Prompts scoring ≥ 85" delay={800}>
            <Box sx={{ position: 'relative', height: CHART_H, width: '100%' }}>
              <ResponsiveContainer width="100%" height={CHART_H}>
                <PieChart>
                  <Pie
                    data={data.successRateData}
                    dataKey="value" nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius="60%" outerRadius="78%"
                    startAngle={90} endAngle={450}
                    paddingAngle={4} cornerRadius={6}
                  >
                    {data.successRateData.map((e, i) => (
                      <Cell key={i} fill={e.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'success.main', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {data.successRate}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  successful
                </Typography>
              </Box>
            </Box>
          </ChartCard>
        </Box>

        {/* 3 — Score Distribution */}
        <Box sx={{ minWidth: 0 }}>
          <ChartCard title="Score Distribution" subtitle="How your prompts rank" delay={900}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart
                data={data.scoreDistribution}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 8, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={cGrid} horizontal={false} />
                <XAxis type="number" stroke={cAxis} fontSize={11} tick={{ fill: cAxis }} />
                <YAxis type="category" dataKey="name" stroke={cAxis} fontSize={11} tick={{ fill: cAxis }} width={95} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: alpha(cAxis, 0.06) }} />
                <Bar dataKey="count" name="Prompts" barSize={24} radius={[0, 7, 7, 0]}>
                  {data.scoreDistribution.map((_, i) => <Cell key={i} fill={distColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>

        {/* 4 — Category Strength Radar */}
        <Box sx={{ minWidth: 0 }}>
          <ChartCard title="Category Strength" subtitle="Relative performance across domains" delay={1000}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data.categoryPerformance}>
                <PolarGrid stroke={cGrid} />
                <PolarAngleAxis dataKey="subject" stroke={cAxis} fontSize={11} tick={{ fill: cAxis }} />
                <Radar name="Score" dataKey="A"
                  stroke={cPrimary} strokeWidth={2} fill={alpha(cPrimary, 0.18)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>

      </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — RECENT ACTIVITY (full width)
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionLabel>Recent Activity</SectionLabel>
      <Grow in timeout={1200}>
        <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {data.recent.map((item, idx) => {
                const changePct = item.originalPrompt.length > 0
                  ? Math.round(((item.finalPrompt.length - item.originalPrompt.length) / item.originalPrompt.length) * 100)
                  : 0;
                const sColor = item.score >= 90 ? cSuccess : item.score >= 80 ? cPrimary : cWarning;
                const sTheme = item.score >= 90 ? 'success' : item.score >= 80 ? 'primary' : 'warning';
                return (
                  <Box key={item.id}>
                    <ListItem sx={{ px: 3, py: 2 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: '12px', flexShrink: 0, mr: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha(sColor, 0.1), border: '1px solid', borderColor: alpha(sColor, 0.28),
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.78rem', color: `${sTheme}.main` }}>
                          {item.score}
                        </Typography>
                      </Box>
                      <ListItemText
                        primary={<Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{item.originalPrompt}</Typography>}
                        secondary={<Typography variant="caption" color="text.disabled">{new Date(item.id).toLocaleString()}</Typography>}
                      />
                      <Chip
                        label={`${changePct >= 0 ? '+' : ''}${changePct}%`}
                        size="small"
                        sx={{
                          ml: 2, height: 24, fontSize: '0.69rem', fontWeight: 700,
                          display: { xs: 'none', sm: 'flex' },
                          bgcolor: alpha(changePct >= 0 ? cSuccess : cError, 0.09),
                          color: changePct >= 0 ? 'success.main' : 'error.main',
                          border: '1px solid', borderColor: alpha(changePct >= 0 ? cSuccess : cError, 0.28),
                        }}
                      />
                    </ListItem>
                    {idx < data.recent.length - 1 && <Divider sx={{ opacity: 0.35 }} />}
                  </Box>
                );
              })}
            </List>
          </CardContent>
        </Card>
      </Grow>

    </Box>
  );
}