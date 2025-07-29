
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, User } from "lucide-react";
import { getUserRatings, Rating } from "@/services/ratingService";
import { getUserProfile } from "@/services/userService";

interface ViewRatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUid: string;
  targetName: string;
}

const ViewRatingsModal = ({ isOpen, onClose, targetUid, targetName }: ViewRatingsModalProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [raterNames, setRaterNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isOpen && targetUid) {
      loadRatings();
    }
  }, [isOpen, targetUid]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const userRatings = await getUserRatings(targetUid);
      setRatings(userRatings);
      
      // جلب أسماء المقيمين
      const names: {[key: string]: string} = {};
      for (const rating of userRatings) {
        if (!names[rating.raterUid]) {
          try {
            const profile = await getUserProfile(rating.raterUid);
            names[rating.raterUid] = profile?.fullName || 'مستخدم';
          } catch (error) {
            names[rating.raterUid] = 'مستخدم';
          }
        }
      }
      setRaterNames(names);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تقييمات العملاء - {targetName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل التقييمات...</p>
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد تقييمات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">{raterNames[rating.raterUid] || 'مستخدم'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rating.rating 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {rating.comment && (
                    <p className="text-gray-700 mb-2">{rating.comment}</p>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    {formatDate(rating.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewRatingsModal;
