import { useState } from 'react';
import { EmailModal } from './email-modal';
import { AddContextModal } from './add-context-modal';
import { ScreenCaptureButton } from './ui/screen-capture-button';

interface QuickActionsProps {
  onTabChange?: (tab: string) => void;
}

export function QuickActions({ onTabChange }: QuickActionsProps = {}) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <button 
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          onClick={() => setIsEmailModalOpen(true)}
        >
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <i className="ri-mail-send-line text-xl text-blue-500"></i>
          </div>
          <h3 className="font-medium text-gray-800">Draft Email</h3>
          <p className="text-xs text-gray-500 mt-1">Generate professional emails</p>
        </button>
        
        <button 
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          onClick={() => onTabChange && onTabChange('email')}
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
            <i className="ri-mail-line text-xl text-indigo-500"></i>
          </div>
          <h3 className="font-medium text-gray-800">Email Inbox</h3>
          <p className="text-xs text-gray-500 mt-1">Manage incoming emails</p>
        </button>
        
        <button className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
            <i className="ri-file-text-line text-xl text-purple-500"></i>
          </div>
          <h3 className="font-medium text-gray-800">Summarize</h3>
          <p className="text-xs text-gray-500 mt-1">Condense long documents</p>
        </button>
        
        <button className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
            <i className="ri-lightbulb-line text-xl text-green-500"></i>
          </div>
          <h3 className="font-medium text-gray-800">Generate Solution</h3>
          <p className="text-xs text-gray-500 mt-1">Get recommendations</p>
        </button>
        
        <button 
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center"
          onClick={() => setIsAddContextModalOpen(true)}
        >
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
            <i className="ri-folder-add-line text-xl text-amber-500"></i>
          </div>
          <h3 className="font-medium text-gray-800">Add Context</h3>
          <p className="text-xs text-gray-500 mt-1">Upload new documents</p>
        </button>
      </div>

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
      />
      
      <AddContextModal 
        isOpen={isAddContextModalOpen} 
        onClose={() => setIsAddContextModalOpen(false)} 
      />
      
      {/* Screen Capture Button - Floating */}
      <div className="fixed bottom-8 right-8">
        <ScreenCaptureButton />
      </div>
    </>
  );
}
