'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface EventsOverTimeProps {
  data: any[];
  loading: boolean;
}

export default function EventsOverTime({ data, loading }: EventsOverTimeProps) {
  if (loading) {
    return <div className="animate-pulse h-[400px] bg-gray-100 rounded-lg"></div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Events Over Time</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="pageViews"
              stroke="#BE1E2D"
              name="Page Views"
            />
            <Line
              type="monotone"
              dataKey="carViews"
              stroke="#1E3A8A"
              name="Car Views"
            />
            <Line
              type="monotone"
              dataKey="contacts"
              stroke="#047857"
              name="Contacts"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
