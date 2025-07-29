
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, Plus } from "lucide-react";
import { getUserRatingStats, UserRatingStats } from "@/services/ratingService";
import RatingModal from "./RatingModal";
import ViewRatingsModal from "./ViewRatingsModal";

interface UserRatingDisplayProps {
  targetUid: string;
  targetName: string;
  showAddRating?: boolean;
  compact?: boolean;
}

const UserRatingDisplay = ({ 
  targetUid, 
  targetName, 
  showAddRating = false, 
  compact = false 
}: UserRatingDisplayProps) => {
  const [stats, setStats] = useState<UserRatingStats>({
    averageRating: 0,
    totalRatings: 0,
    ratingsBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    if (targetUid) {
      loadStats();
    }
  }, [targetUid]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const userStats = await getUserRatingStats(targetUid);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading rating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <span className="text-sm text-gray-400">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${
                star <= Math.round(stats.averageRating) 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
        </span>
        <span className="text-xs text-gray-500">
          ({stats.totalRatings})
        </span>
      </div>

      {stats.totalRatings > 0 && (
        <Button
          onClick={() => setShowViewModal(true)}
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-blue-600 hover:text-blue-700"
        >
          <MessageCircle className="w-4 h-4 ml-1" />
          التقييمات
        </Button>
      )}

      {showAddRating && (
        <Button
          onClick={() => setShowRatingModal(true)}
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-green-600 hover:text-green-700"
        >
          <Plus className="w-4 h-4 ml-1" />
          تقييم
        </Button>
      )}

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        targetUid={targetUid}
        targetName={targetName}
        onRatingCreated={loadStats}
      />

      <ViewRatingsModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        targetUid={targetUid}
        targetName={targetName}
      />
    </div>
  );
};

export default UserRatingDisplay;
