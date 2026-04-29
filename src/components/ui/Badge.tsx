export default function Badge({ status }: { status: string }) {
  const getBadgeStyle = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      archived: 'bg-gray-200 text-gray-600',
      active: 'bg-green-100 text-green-800',
      suppressed: 'bg-red-100 text-red-800',
      'suppressed complaint': 'bg-red-200 text-red-900',
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1').trim();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle(status)}`}>
      {displayStatus}
    </span>
  );
}
