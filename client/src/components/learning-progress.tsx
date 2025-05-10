import { useQuery } from '@tanstack/react-query';
import { LearningProgress as LearningProgressType } from '@shared/schema';
import { Progress } from '@/components/ui/progress';

export function LearningProgress() {
  const { data: learningProgress, isLoading } = useQuery<LearningProgressType[]>({
    queryKey: ['/api/learning-progress'],
  });

  const getColorClass = (category: string) => {
    switch (category) {
      case 'Email Drafting':
        return 'bg-green-500';
      case 'Documentation Analysis':
        return 'bg-blue-500';
      case 'Code Understanding':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <h2 className="font-medium text-gray-800">Learning Progress</h2>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">Loading progress...</div>
        ) : learningProgress && learningProgress.length > 0 ? (
          <div className="space-y-4">
            {learningProgress.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-700">{item.category}</h3>
                  <span className="text-xs text-gray-500">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className={`h-2 w-full ${getColorClass(item.category)}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-medium text-gray-700">Email Drafting</h3>
                <span className="text-xs text-gray-500">0%</span>
              </div>
              <Progress value={0} className="h-2 w-full bg-green-500" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-medium text-gray-700">Documentation Analysis</h3>
                <span className="text-xs text-gray-500">0%</span>
              </div>
              <Progress value={0} className="h-2 w-full bg-blue-500" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-medium text-gray-700">Code Understanding</h3>
                <span className="text-xs text-gray-500">0%</span>
              </div>
              <Progress value={0} className="h-2 w-full bg-amber-500" />
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-4">
          DoMyJob is learning your preferences and work patterns to better assist you over time.
        </p>
      </div>
    </div>
  );
}
