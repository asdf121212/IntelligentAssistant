import { useQuery } from '@tanstack/react-query';
import { Task } from '@shared/schema';
import { format, formatDistanceToNow } from 'date-fns';

export function RecentTasks() {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  const formatTaskDate = (dateString: Date) => {
    const date = new Date(dateString);
    const isToday = new Date().toDateString() === date.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="font-medium text-gray-800">Recent Tasks</h2>
        <button className="text-sm text-primary-600 hover:text-primary-700">View All</button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading tasks...</div>
        ) : tasks && tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{task.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {formatTaskDate(task.createdAt)}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(task.status)}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No tasks yet</div>
        )}
      </div>
    </div>
  );
}
