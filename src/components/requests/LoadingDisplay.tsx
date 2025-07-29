
import { Loader2 } from "lucide-react";

const LoadingDisplay = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>جاري تحميل الطلبات...</span>
      </div>
    </div>
  );
};

export default LoadingDisplay;
