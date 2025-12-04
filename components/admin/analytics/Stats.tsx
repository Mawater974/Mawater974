'use client';

interface StatsProps {
  stats: {
    pageViews: number;
    uniqueVisitors: number;
    totalContacts: number;
    conversionRate: number;
    gaAvailability: number;
    activeUsers: number;
  };
  loading: boolean;
}

export default function Stats({ stats, loading }: StatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Page Views',
      value: stats.pageViews.toLocaleString(),
      change: '+5.25%',
      changeType: 'increase',
    },
    {
      title: 'Unique Visitors',
      value: stats.uniqueVisitors.toLocaleString(),
      change: '+2.15%',
      changeType: 'increase',
    },
    {
      title: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      change: '+12.5%',
      changeType: 'increase',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(2)}%`,
      change: '+1.2%',
      changeType: 'increase',
    },
    {
      title: 'GA Availability',
      value: `${stats.gaAvailability.toFixed(1)}%`,
      change: '+0.5%',
      changeType: 'increase',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toString(),
      change: 'Live',
      changeType: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <h3 className="text-sm font-medium text-gray-500">{item.title}</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold text-gray-900">{item.value}</p>
            <p
              className={`ml-2 flex items-baseline text-sm font-semibold ${
                item.changeType === 'increase'
                  ? 'text-green-600'
                  : item.changeType === 'decrease'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {item.changeType === 'increase' && (
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
              {item.changeType === 'decrease' && (
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              {item.change}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
