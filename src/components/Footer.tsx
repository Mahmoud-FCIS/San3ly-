
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

const Footer = () => {
  const socialLinks = [
    { icon: Facebook, label: "Facebook", url: "#", color: "hover:text-blue-600" },
    { icon: Twitter, label: "Twitter", url: "#", color: "hover:text-sky-500" },
    { icon: Instagram, label: "Instagram", url: "#", color: "hover:text-pink-600" },
    { icon: Linkedin, label: "LinkedIn", url: "#", color: "hover:text-blue-700" },
    { icon: Youtube, label: "YouTube", url: "#", color: "hover:text-red-600" }
  ];

  const quickLinks = [
    { label: "الرئيسية", url: "/" },
    { label: "عن San3ly", url: "/about" },
    { label: "الطلبات", url: "/requests" },
    { label: "المصانع", url: "/factories" },
    { label: "تواصل معنا", url: "/contact" }
  ];

  const supportLinks = [
    { label: "مركز المساعدة", url: "#" },
    { label: "الأسئلة الشائعة", url: "#" },
    { label: "شروط الاستخدام", url: "#" },
    { label: "سياسة الخصوصية", url: "#" },
    { label: "سياسة الاسترداد", url: "#" }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <h2 className="text-xl font-bold">San3ly</h2>
              </div>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                منصة رائدة تربط بين المصانع والعملاء لتحقيق أفضل حلول التصنيع في المنطقة.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-green-500" />
                  <span className="text-gray-300">info@san3ly.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-green-500" />
                  <span className="text-gray-300">+970 2 123 4567</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span className="text-gray-300">رام الله، فلسطين</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6">روابط سريعة</h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      className="text-gray-300 hover:text-green-500 transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-6">الدعم</h3>
              <ul className="space-y-3">
                {supportLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      className="text-gray-300 hover:text-green-500 transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <h3 className="text-lg font-semibold mb-6">تابعنا</h3>
              <p className="text-gray-300 text-sm mb-4">
                ابق على اطلاع بآخر الأخبار والتحديثات
              </p>
              
              {/* Social Media Icons */}
              <div className="flex gap-3 mb-6">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="icon"
                      className={`bg-gray-800 border-gray-700 text-gray-300 ${social.color} hover:bg-gray-700 transition-colors`}
                      asChild
                    >
                      <a href={social.url} aria-label={social.label}>
                        <Icon className="w-4 h-4" />
                      </a>
                    </Button>
                  );
                })}
              </div>

              {/* Newsletter */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    النشرة الإخبارية
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">
                    اشترك لتصلك آخر الأخبار
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="بريدك الإلكتروني"
                      className="flex-1 px-3 py-2 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                    />
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
                      اشتراك
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            © 2024 San3ly. جميع الحقوق محفوظة.
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>v1.0.0</span>
            <span>•</span>
            <span>صنع بـ ❤️ في فلسطين</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
