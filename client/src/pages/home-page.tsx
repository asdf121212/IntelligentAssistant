import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/ui/sidebar';
import { MobileSidebar } from '@/components/ui/mobile-sidebar';
import { ConversationArea } from '@/components/conversation';
import { RecentTasks } from '@/components/recent-tasks';
import { ActiveContexts } from '@/components/active-contexts';
import { QuickActions } from '@/components/quick-actions';
import { LearningProgress } from '@/components/learning-progress';
import { FileUpload } from '@/components/ui/file-upload';
import { AddContextModal } from '@/components/add-context-modal';
import { EmailModal } from '@/components/email-modal';
import EmailInbox from '@/components/email-inbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HomePage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("assistant");

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Mobile top navigation */}
      <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between md:hidden">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <i className="ri-robot-fill text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-semibold ml-2 text-gray-800">DoMyJob</h1>
        </div>
        <button 
          className="text-gray-500"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <i className="ri-menu-line text-xl"></i>
        </button>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 py-6">
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">Your AI Work Assistant</h1>
              <p className="mt-1 text-sm text-gray-600">DoMyJob learns about your tasks and helps you complete them efficiently.</p>
            </div>

            {/* Main Tab Navigation */}
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
                <TabsTrigger value="email">Email Integration</TabsTrigger>
              </TabsList>

              {/* Assistant Tab Content */}
              <TabsContent value="assistant" className="mt-0">
                {/* Quick Actions */}
                <QuickActions onTabChange={setActiveMainTab} />
                
                {/* Main workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  {/* Left column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Conversation Area */}
                    <ConversationArea />
                    
                    {/* Recent Tasks */}
                    <RecentTasks />
                  </div>
                  
                  {/* Right column */}
                  <div className="space-y-6">
                    {/* Active Contexts */}
                    <ActiveContexts />
                    
                    {/* Upload Document */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="border-b border-gray-200 p-4">
                        <h2 className="font-medium text-gray-800">Upload Document</h2>
                      </div>
                      
                      <div className="p-4">
                        <FileUpload />
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Files are processed securely and added to your contexts for future reference.
                        </p>
                      </div>
                    </div>
                    
                    {/* Learning Progress */}
                    <LearningProgress />
                  </div>
                </div>
              </TabsContent>
              
              {/* Email Tab Content */}
              <TabsContent value="email" className="mt-0">
                <EmailInbox />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <AddContextModal 
        isOpen={isAddContextModalOpen} 
        onClose={() => setIsAddContextModalOpen(false)} 
      />
      
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
}
