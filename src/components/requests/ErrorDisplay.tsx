
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorDisplayProps {
  error: string;
  canCreateRequests: boolean;
  onRefresh: () => void;
}

const ErrorDisplay = ({ error, canCreateRequests, onRefresh }: ErrorDisplayProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md mx-4">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل الطلبات</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={onRefresh} size="sm">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
            {canCreateRequests && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate('/new-request')}
              >
                <Plus className="w-4 h-4 ml-2" />
                طلب جديد
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDisplay;
