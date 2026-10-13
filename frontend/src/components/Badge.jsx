import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm' }) {
  const sizeClasses = size === 'xs' 
    ? 'px-1.5 py-0.5 text-[11px] font-medium' 
    : 'px-2.5 py-0.5 text-xs font-medium';

  const variantClasses = {
    // Severity & Priorities
    Critical: 'bg-red-50 text-red-700 border border-red-200/60',
    High: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    Moderate: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    Medium: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    Low: 'bg-slate-100 text-slate-700 border border-slate-200/60',

    // Statuses
    Pending: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    Assigned: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200/60',
    Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    Resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    Cancelled: 'bg-slate-100 text-slate-600 border border-slate-200/60',
    Closed: 'bg-slate-100 text-slate-600 border border-slate-200/60',
    Reported: 'bg-sky-50 text-sky-700 border border-sky-200/60',
    Verified: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    Ongoing: 'bg-rose-50 text-rose-700 border border-rose-200/60',

    // Team Status
    Available: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    Busy: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    'Off Duty': 'bg-slate-100 text-slate-600 border border-slate-200/60',

    // Roles
    Admin: 'bg-slate-900 text-white',
    Citizen: 'bg-slate-100 text-slate-800 border border-slate-200',

    default: 'bg-slate-100 text-slate-700 border border-slate-200'
  };

  const selectedClass = variantClasses[variant] || variantClasses.default;

  return (
    <span className={`inline-flex items-center rounded-md ${sizeClasses} ${selectedClass}`}>
      {children}
    </span>
  );
}
