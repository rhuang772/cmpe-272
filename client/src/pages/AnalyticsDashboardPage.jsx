import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { Link as RouterLink } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MapContainer, TileLayer } from 'react-leaflet';
import HeatmapLayer from '../components/HeatmapLayer';
import { fetchAnalytics } from '../api/planes';

const POLL_MS = 10_000;

const PIE_COLORS = [
  '#64b5f6', '#4dd0e1', '#81c784', '#ffd54f', '#ff8a65',
  '#ba68c8', '#e57373', '#4db6ac', '#aed581', '#ffb74d',
  '#9575cd', '#f06292', '#7986cb', '#a1887f', '#90a4ae',
];

function StatCard({ label, value, sub }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        flex: '1 1 0',
        minWidth: 140,
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" fontWeight={700} color="primary">
        {value != null ? value.toLocaleString() : '—'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
      {sub != null && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

function ChartPanel({ title, height = 300, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height }}>
        {children}
      </Box>
    </Paper>
  );
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const poll = async () => {
      try {
        const result = await fetchAnalytics();
        if (!mountedRef.current) return;
        setData(result);
        setError(null);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(e instanceof Error ? e.message : 'Failed to fetch analytics');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading analytics...</Typography>
      </Container>
    );
  }

  const topCountries = data?.countryBreakdown?.slice(0, 15) ?? [];
  const filteredCategories = data?.categoryBreakdown ?? [];
  const categoryTotal = filteredCategories.reduce((sum, c) => sum + c.count, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button component={RouterLink} to="/" variant="text" size="small">
          &larr; Home
        </Button>
        <Typography variant="h4" fontWeight={700}>
          Live Flight Analytics
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary cards */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard label="Airborne" value={data?.totalAirborne} />
        <StatCard label="Ascending" value={data?.ascending} />
        <StatCard label="Cruising" value={data?.cruising} />
        <StatCard label="Descending" value={data?.descending} />
        <StatCard label="On Ground" value={data?.totalOnGround} />
      </Box>

      {/* Heatmap */}
      <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ p: 2, pb: 0 }}
        >
          Geographic Density Heatmap
        </Typography>
        <Box sx={{ height: 420, position: 'relative' }}>
          <MapContainer
            center={[30, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {data?.heatmapPoints && (
              <HeatmapLayer points={data.heatmapPoints} />
            )}
          </MapContainer>

          {/* Heatmap legend */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(0,0,0,0.65)',
              borderRadius: 1,
              px: 1.5,
              py: 0.75,
            }}
          >
            <Typography variant="caption" color="#fff" fontWeight={600}>
              # of Planes:
            </Typography>
            <Typography variant="caption" color="#fff" fontWeight={600}>
              0
            </Typography>
            <Box
              sx={{
                width: 180,
                height: 12,
                borderRadius: 0.5,
                background:
                  'linear-gradient(to right, #064e8a, #1a8cff, #4dd0e1, #ffd54f, #ff6f00)',
              }}
            />
            <Typography variant="caption" color="#fff" fontWeight={600}>
              {data?.heatmapMax ?? 0}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Charts grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Country bar chart */}
        <ChartPanel title="Top 15 Countries" height={380}>
          <ResponsiveContainer>
            <BarChart
              data={topCountries}
              layout="vertical"
              margin={{ left: 80, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" />
              <YAxis
                type="category"
                dataKey="country"
                stroke="#888"
                width={75}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12181f',
                  border: '1px solid #333',
                }}
              />
              <Bar dataKey="count" fill="#64b5f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Category pie chart */}
        <ChartPanel title="Aircraft Category Breakdown" height={380}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={filteredCategories}
                dataKey="count"
                nameKey="category"
                cx="35%"
                cy="50%"
                outerRadius={120}
                label={false}
                labelLine={false}
              >
                {filteredCategories.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12181f',
                  border: '1px solid #333',
                }}
                formatter={(value, name) => {
                  const pct =
                    categoryTotal > 0
                      ? ((value / categoryTotal) * 100).toFixed(1)
                      : '0';
                  return [`${value.toLocaleString()} (${pct}%)`, name];
                }}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: 12, lineHeight: '20px' }}
                formatter={(value, entry) => {
                  const count = entry?.payload?.count ?? 0;
                  const pct =
                    categoryTotal > 0
                      ? ((count / categoryTotal) * 100).toFixed(1)
                      : '0';
                  return `${value} — ${pct}%`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Altitude histogram */}
        <ChartPanel title="Altitude Distribution" height={300}>
          <ResponsiveContainer>
            <BarChart
              data={data?.altitudeHistogram ?? []}
              margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="bucket" stroke="#888" tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12181f',
                  border: '1px solid #333',
                }}
              />
              <Bar dataKey="count" fill="#4dd0e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Speed histogram */}
        <ChartPanel title="Speed Distribution" height={300}>
          <ResponsiveContainer>
            <BarChart
              data={data?.speedHistogram ?? []}
              margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="bucket" stroke="#888" tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12181f',
                  border: '1px solid #333',
                }}
              />
              <Bar dataKey="count" fill="#81c784" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </Box>
    </Container>
  );
}
