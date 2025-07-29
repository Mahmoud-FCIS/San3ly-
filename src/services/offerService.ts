
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ManufacturingOffer {
  id?: string;
  offerId: string;
  requestId: string;
  manufacturerUid: string;
  manufacturerName?: string;
  manufacturerSpecialization?: string;
  quantity: string;
  price: string;
  material: string;
  deliveryTime: string;
  weight: string;
  notes?: string;
  acceptance: 'جديد' | 'مقبول' | 'مرفوض';
  createdAt: Date;
  updatedAt: Date;
}

const generateOfferId = (): string => {
  return 'OFFER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const createOffer = async (
  requestId: string, 
  manufacturerUid: string, 
  offerData: {
    quantity: string;
    price: string;
    material: string;
    deliveryTime: string;
    weight: string;
    notes?: string;
  }
): Promise<string> => {
  try {
    console.log('🔄 إنشاء عرض جديد:', {
      requestId,
      manufacturerUid,
      offerData
    });
    
    const offerId = generateOfferId();
    
    const offer: Omit<ManufacturingOffer, 'id'> = {
      offerId,
      requestId,
      manufacturerUid,
      quantity: offerData.quantity,
      price: offerData.price,
      material: offerData.material,
      deliveryTime: offerData.deliveryTime,
      weight: offerData.weight,
      notes: offerData.notes || '',
      acceptance: 'جديد',
      createdAt: Timestamp.now().toDate(),
      updatedAt: Timestamp.now().toDate()
    };

    const docRef = await addDoc(collection(db, 'manufacturingOffers'), offer);
    console.log('✅ تم إنشاء العرض بنجاح:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ خطأ في إنشاء العرض:', error);
    throw new Error(`فشل في إنشاء العرض: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const getOffersByRequestId = async (requestId: string): Promise<ManufacturingOffer[]> => {
  try {
    console.log('🔍 البحث عن العروض للطلب:', requestId);
    
    const q = query(
      collection(db, 'manufacturingOffers'),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const offers: ManufacturingOffer[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
        
        offers.push({
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        } as ManufacturingOffer);
      } catch (docError) {
        console.error('❌ خطأ في معالجة العرض:', doc.id, docError);
      }
    });
    
    console.log(`✅ تم العثور على ${offers.length} عرض للطلب`);
    return offers;
  } catch (error) {
    console.error('❌ خطأ في استرجاع العروض:', error);
    throw new Error(`خطأ في استرجاع العروض: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};

export const updateOfferAcceptance = async (offerId: string, acceptance: 'مقبول' | 'مرفوض'): Promise<void> => {
  try {
    console.log('🔄 تحديث حالة العرض:', offerId, acceptance);
    
    const q = query(
      collection(db, 'manufacturingOffers'),
      where('offerId', '==', offerId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'manufacturingOffers', querySnapshot.docs[0].id);
      await updateDoc(docRef, {
        acceptance: acceptance,
        updatedAt: Timestamp.now().toDate()
      });
      console.log('✅ تم تحديث حالة العرض بنجاح');
    } else {
      throw new Error('العرض غير موجود');
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة العرض:', error);
    throw new Error(`خطأ في تحديث حالة العرض: ${(error as any)?.message || 'خطأ غير معروف'}`);
  }
};
