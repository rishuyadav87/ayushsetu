import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList
} from 'recharts';

// Colour each bar by readiness band so gaps are visible at a glance.
const barColor = (score, benchmark) => {
  if (score >= benchmark) return '#2D6A4F';       // meets benchmark
  if (score >= benchmark - 15) return '#F4A261';  // close to benchmark
  return '#E76F51';                               // gap
};

const truncate = (label, max = 16) =>
  typeof label === 'string' && label.length > max ? `${label.slice(0, max - 1)}…` : label;

/**
 * Skill score bar chart (replaces the old radar/spider chart).
 * data format: [{ subject: 'Clinical', score: 85, fullMark: 100 }]
 */
const SkillBarChart = ({ data = [], benchmark = 70, height = 320 }) => {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No skill scores yet
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="subject"
            tick={{ fill: '#4B5563', fontSize: 12 }}
            tickFormatter={(v) => truncate(v)}
            interval={0}
            angle={data.length > 4 ? -25 : 0}
            textAnchor={data.length > 4 ? 'end' : 'middle'}
          />
          <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} unit="%" width={48} />
          <Tooltip
            cursor={{ fill: 'rgba(45,106,79,0.06)' }}
            formatter={(value) => [`${value}%`, 'Skill Score']}
          />
          <ReferenceLine
            y={benchmark}
            stroke="#6B7280"
            strokeDasharray="4 4"
            label={{ value: `Benchmark ${benchmark}%`, position: 'insideTopRight', fill: '#6B7280', fontSize: 11 }}
          />
          <Bar dataKey="score" name="Skill Score" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={barColor(entry.score, benchmark)} />
            ))}
            <LabelList dataKey="score" position="top" formatter={(v) => `${v}%`} style={{ fill: '#374151', fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillBarChart;
