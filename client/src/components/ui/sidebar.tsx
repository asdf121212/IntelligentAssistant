import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Context, Task } from '@shared/schema';

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Fetch contexts
  const { data: contexts } = useQuery<Context[]>({
    queryKey: ['/api/contexts'],
  });

  // Fetch tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  return (
    <div className="bg-white border-r border-gray-200 w-full md:w-64 flex-shrink-0 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <i className="ri-robot-fill text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-semibold ml-2 text-gray-800">DoMyJob</h1>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Workspaces</h2>
          <div className="space-y-1">
            <Link 
              href="/"
              className={`flex items-center px-3 py-2 text-sm rounded-lg ${
                location === '/' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <i className="ri-briefcase-4-line mr-2"></i>
              <span>Work</span>
            </Link>
            <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
              <i className="ri-book-2-line mr-2"></i>
              <span>Learning</span>
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
              <i className="ri-home-5-line mr-2"></i>
              <span>Personal</span>
            </a>
          </div>
        </div>
        
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Contexts</h2>
          <div className="space-y-1">
            {contexts?.slice(0, 5).map(context => (
              <a 
                key={context.id} 
                href="#" 
                className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <i className={`${context.type.includes('pdf') ? 'ri-file-pdf-line' : 'ri-file-text-line'} mr-2`}></i>
                <span className="truncate">{context.name}</span>
              </a>
            ))}
            {(!contexts || contexts.length === 0) && (
              <div className="text-sm text-gray-500 px-3 py-2">No contexts yet</div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Recent Tasks</h2>
          <div className="space-y-1">
            {tasks?.slice(0, 3).map(task => (
              <a 
                key={task.id} 
                href="#" 
                className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <i className="ri-task-line mr-2"></i>
                <span className="truncate">{task.title}</span>
              </a>
            ))}
            {(!tasks || tasks.length === 0) && (
              <div className="text-sm text-gray-500 px-3 py-2">No tasks yet</div>
            )}
          </div>
        </div>
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
            {user?.name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0 ml-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
          </div>
          <button 
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={() => logoutMutation.mutate()}
          >
            <i className="ri-logout-box-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
