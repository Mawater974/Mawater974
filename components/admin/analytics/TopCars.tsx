'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TopCarsProps {
  data: any[];
  loading: boolean;
}

export default function TopCars({ data, loading }: TopCarsProps) {
  if (loading) {
    return <div className="animate-pulse h-[400px] bg-gray-100 rounded-lg"></div>;
  }

  const formattedData = data.map(car => ({
    name: car.name.length > 20 ? car.name.substring(0, 20) + '...' : car.name,
    views: car.views_count || 0,
    contacts: car.contact_count || 0,
    shares: car.share_count || 0,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Top Performing Cars</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" fill="#BE1E2D" name="Views" />
            <Bar dataKey="contacts" fill="#1E3A8A" name="Contacts" />
            <Bar dataKey="shares" fill="#047857" name="Shares" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
