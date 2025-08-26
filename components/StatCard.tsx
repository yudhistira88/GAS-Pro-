import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactElement<React.SVGAttributes<SVGSVGElement> & { size?: string | number }>;
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  subtitle?: React.ReactNode;
}

const StatCard = ({ icon, title, value, change, changeType, subtitle }: StatCardProps) => {
  return (
    <div className="bg-card text-card-foreground p-5 rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex items-start justify-between h-full">
      <div className="flex flex-col h-full flex-1">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <div className="text-xs text-muted-foreground mt-2">{subtitle}</div>}
        </div>
        {change && (
          <p className={`text-xs mt-2 flex items-center font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-500'}`}>
            {changeType === 'increase' ? <ArrowUp size={14} className="mr-1"/> : <ArrowDown size={14} className="mr-1"/>}
            {change}
          </p>
        )}
      </div>
      <div className="bg-primary/10 text-primary p-3 rounded-lg ml-4">
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
  );
};

export default StatCard;