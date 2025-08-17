import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const StatCard = ({ icon, title, value, change, changeType }: StatCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-start justify-between transition-all hover:shadow-lg hover:-translate-y-1 dark:border dark:border-gray-700">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
        {change && (
          <p className={`text-xs mt-2 flex items-center ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </p>
        )}
      </div>
      <div className="bg-honda-red/10 text-honda-red p-3 rounded-full">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;