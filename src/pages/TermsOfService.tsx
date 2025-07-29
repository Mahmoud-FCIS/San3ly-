
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">شروط الاستخدام</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <div className="space-y-6 text-right">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. القبول بالشروط</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                باستخدامك لمنصة San3ly، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. وصف الخدمة</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                San3ly هي منصة إلكترونية تهدف إلى ربط المصانع والعملاء لتسهيل عمليات التصنيع والإنتاج. نحن نوفر بيئة آمنة وموثوقة للتواصل وإبرام الصفقات.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. حقوق والتزامات المستخدمين</h2>
              <ul className="list-disc pr-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>يجب تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                <li>المحافظة على سرية بيانات الحساب وكلمة المرور</li>
                <li>عدم استخدام المنصة لأغراض غير قانونية أو ضارة</li>
                <li>احترام حقوق الملكية الفكرية للآخرين</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. السياسة المالية</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                تتم جميع المعاملات المالية من خلال بوابات دفع آمنة ومعتمدة. المنصة تحتفظ بالحق في فرض رسوم على الخدمات المقدمة حسب التعريفة المعلنة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. المسؤولية</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                San3ly تعمل كوسيط بين المصانع والعملاء. نحن غير مسئولين عن جودة المنتجات أو الخدمات المقدمة من قبل المصانع، ولكننا نسعى لضمان أعلى معايير الجودة من خلال نظام التقييمات.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. إنهاء الخدمة</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                يحق لـ San3ly إنهاء أو تعليق حساب أي مستخدم في حالة مخالفة هذه الشروط أو استخدام المنصة بطريقة غير صحيحة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. تعديل الشروط</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                تحتفظ San3ly بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. الاتصال</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                لأي استفسارات حول هذه الشروط، يرجى التواصل معنا عبر البريد الإلكتروني: legal@san3ly.com
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
