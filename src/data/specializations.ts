
import { 
  Wrench, Hammer, Cog, Zap, Car, Home, Shirt, 
  Coffee, Package, Paintbrush, Scissors, Camera,
  Cpu, Smartphone, Watch, Diamond, Gem, Crown,
  Truck, Plane, Ship, Building, Factory, HardHat,
  Laptop, Monitor, Printer, Headphones, Gamepad2,
  Utensils, ChefHat, Wine, Wheat, Apple, Fish,
  Pill, Stethoscope, Syringe, Heart, Eye, Brain,
  Palette, Brush, Image, Music, Mic, Guitar,
  TreePine, Flower, Leaf, Recycle, Sun, Wind,
  BookOpen, PenTool, Calculator, Microscope, TestTube,
  Dumbbell, Trophy, Target, Zap as Lightning, Bike,
  Baby, Heart as Love, Gamepad, Puzzle, Box
} from "lucide-react";

export const specializations = [
  // الصناعات المعدنية
  { id: 'metal_fabrication', nameAr: 'معدني', nameEn: 'Metal Fabrication', icon: Hammer },
  { id: 'machining', nameAr: 'التشغيل الآلي', nameEn: 'Machining', icon: Cog },
  { id: 'welding', nameAr: 'اللحام', nameEn: 'Welding', icon: Zap },
  { id: 'casting', nameAr: 'السباكة', nameEn: 'Casting', icon: Factory },
  { id: 'forging', nameAr: 'الطرق والتشكيل', nameEn: 'Forging', icon: Wrench },

  // الصناعات البلاستيكية
  { id: 'plastic_injection', nameAr: 'بلاستيك', nameEn: 'Plastic Injection', icon: Package },
  { id: 'plastic_extrusion', nameAr: 'بثق البلاستيك', nameEn: 'Plastic Extrusion', icon: Factory },
  { id: 'blow_molding', nameAr: 'النفخ والتشكيل', nameEn: 'Blow Molding', icon: Package },

  // الصناعات الخشبية
  { id: 'furniture', nameAr: 'خشبي', nameEn: 'Furniture', icon: Home },
  { id: 'carpentry', nameAr: 'النجارة', nameEn: 'Carpentry', icon: Hammer },
  { id: 'wood_crafts', nameAr: 'الحرف الخشبية', nameEn: 'Wood Crafts', icon: TreePine },

  // الصناعات النسيجية
  { id: 'clothing', nameAr: 'نسيج', nameEn: 'Clothing', icon: Shirt },
  { id: 'textiles', nameAr: 'المنسوجات', nameEn: 'Textiles', icon: Scissors },
  { id: 'embroidery', nameAr: 'التطريز', nameEn: 'Embroidery', icon: Paintbrush },

  // الطباعة ثلاثية الأبعاد
  { id: '3d_printing', nameAr: 'طباعة ثلاثية الأبعاد', nameEn: '3D Printing', icon: Printer },
  { id: 'prototyping', nameAr: 'النماذج الأولية', nameEn: 'Prototyping', icon: Cpu },

  // صناعات أخرى
  { id: 'glass', nameAr: 'زجاج', nameEn: 'Glass', icon: Diamond },
  { id: 'ceramics', nameAr: 'سيراميك', nameEn: 'Ceramics', icon: Coffee },
  { id: 'rubber', nameAr: 'مطاط', nameEn: 'Rubber', icon: Package },
  
  // أخرى
  { id: 'other', nameAr: 'أخرى', nameEn: 'Other', icon: Cog }
];

export const getSpecializationById = (id: string) => {
  return specializations.find(spec => spec.id === id);
};

export const getSpecializationsByIds = (ids: string[]) => {
  return ids.map(id => getSpecializationById(id)).filter(Boolean);
};
