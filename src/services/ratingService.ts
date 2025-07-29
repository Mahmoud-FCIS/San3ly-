
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Rating {
  id?: string;
  ratingId: string;
  targetUid: string; // المستخدم المُقيم
  raterUid: string; // المستخدم المُقيِم
  rating: number; // من 1 إلى 5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRatingStats {
  averageRating: number;
  totalRatings: number;
  ratingsBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

const generateRatingId = (): string => {
  return 'RATING_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const createRating = async (
  targetUid: string,
  raterUid: string,
  rating: number,
  comment: string
): Promise<string> => {
  try {
    console.log('🔄 إنشاء تقييم جديد:', {
      targetUid,
      raterUid,
      rating,
      comment
    });

    const ratingId = generateRatingId();
    
    const ratingData: Omit<Rating, 'id'> = {
      ratingId,
      targetUid,
      raterUid,
      rating,
      comment,
      createdAt: Timestamp.now().toDate(),
      updatedAt: Timestamp.now().toDate()
    };

    const docRef = await addDoc(collection(db, 'ratings'), ratingData);
    console.log('✅ تم إنشاء التقييم بنجاح:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ خطأ في إنشاء التقييم:', error);
    throw new Error(`فشل في إنشاء التقييم: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getUserRatings = async (targetUid: string): Promise<Rating[]> => {
  try {
    console.log('🔍 البحث عن تقييمات المستخدم:', targetUid);
    
    const q = query(
      collection(db, 'ratings'),
      where('targetUid', '==', targetUid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const ratings: Rating[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
        
        ratings.push({
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        } as Rating);
      } catch (docError) {
        console.error('❌ خطأ في معالجة التقييم:', doc.id, docError);
      }
    });
    
    console.log(`✅ تم العثور على ${ratings.length} تقييم للمستخدم`);
    return ratings;
  } catch (error) {
    console.error('❌ خطأ في استرجاع التقييمات:', error);
    throw new Error(`خطأ في استرجاع التقييمات: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getUserRatingStats = async (targetUid: string): Promise<UserRatingStats> => {
  try {
    const ratings = await getUserRatings(targetUid);
    
    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingsBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;

    const ratingsBreakdown = ratings.reduce((breakdown, rating) => {
      breakdown[rating.rating as keyof typeof breakdown]++;
      return breakdown;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
      ratingsBreakdown
    };
  } catch (error) {
    console.error('❌ خطأ في حساب إحصائيات التقييم:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingsBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};
