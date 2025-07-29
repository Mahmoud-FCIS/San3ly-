
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DashboardStats {
  activeRequests: number;
  completedRequests: number;
  totalRevenue: number;
  averageRating: number;
}

export const getDashboardStats = async (uid: string): Promise<DashboardStats> => {
  try {
    console.log('🔄 جلب إحصائيات المستخدم:', uid);
    
    // جلب جميع طلبات المستخدم
    const requestsQuery = query(
      collection(db, 'manufacturingRequests'),
      where('uid', '==', uid)
    );
    
    const requestsSnapshot = await getDocs(requestsQuery);
    let activeRequests = 0;
    let completedRequests = 0;
    let totalRevenue = 0;
    
    requestsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'نشط') {
        activeRequests++;
      } else if (data.status === 'مكتمل') {
        completedRequests++;
        // حساب الإيرادات (يمكن تطويرها لاحقاً)
        if (data.budget) {
          const budget = parseFloat(data.budget.toString().replace(/[^\d.]/g, ''));
          if (!isNaN(budget)) {
            totalRevenue += budget;
          }
        }
      }
    });

    // جلب متوسط التقييم (يمكن إضافته لاحقاً)
    const averageRating = 4.8; // مؤقت

    const stats: DashboardStats = {
      activeRequests,
      completedRequests,
      totalRevenue,
      averageRating
    };

    console.log('✅ إحصائيات المستخدم:', stats);
    return stats;
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error);
    throw new Error(`خطأ في جلب الإحصائيات: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};
