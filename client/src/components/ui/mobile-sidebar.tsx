import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Close sidebar when location changes
  useEffect(() => {
    onClose();
  }, [location, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <i className="ri-robot-fill text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-semibold ml-2 text-gray-800">DoMyJob</h1>
            </div>
            <button className="text-gray-500" onClick={onClose}>
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Workspaces</h2>
              <div className="space-y-1">
                <Link href="/" className="flex items-center px-3 py-2 text-sm rounded-lg bg-primary-50 text-primary-700 font-medium">
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
                <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
                  <i className="ri-file-text-line mr-2"></i>
                  <span>Company Handbook</span>
                </a>
                <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
                  <i className="ri-folder-line mr-2"></i>
                  <span>Project Documentation</span>
                </a>
                <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
                  <i className="ri-mail-line mr-2"></i>
                  <span>Email Templates</span>
                </a>
                <a href="#" className="flex items-center px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
                  <i className="ri-code-line mr-2"></i>
                  <span>Codebase</span>
                </a>
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
      </div>
    </>
  );
}
