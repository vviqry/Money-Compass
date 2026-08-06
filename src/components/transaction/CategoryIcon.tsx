import {
  ShoppingBag,
  Link,
  Cookie,
  Gift,
  Laptop,
  Recycle,
  MoreHorizontal,
  UtensilsCrossed,
  Coffee,
  Candy,
  Zap,
  Wifi,
  Globe,
  Car,
  Briefcase,
  Monitor,
  Heart,
  type LucideProps,
} from 'lucide-react';
import type { ReactElement } from 'react';

const iconMap: Record<string, (props: LucideProps) => ReactElement> = {
  'Shopee Seller': (props) => <ShoppingBag {...props} />,
  'Shopee Affiliate': (props) => <Link {...props} />,
  'Happy Snack House': (props) => <Cookie {...props} />,
  Gift: (props) => <Gift {...props} />,
  Freelance: (props) => <Laptop {...props} />,
  'Sell Used Items': (props) => <Recycle {...props} />,
  Food: (props) => <UtensilsCrossed {...props} />,
  Coffee: (props) => <Coffee {...props} />,
  Snack: (props) => <Candy {...props} />,
  Electricity: (props) => <Zap {...props} />,
  Wifi: (props) => <Wifi {...props} />,
  Internet: (props) => <Globe {...props} />,
  Transportation: (props) => <Car {...props} />,
  'Business Capital': (props) => <Briefcase {...props} />,
  'Digital Product': (props) => <Monitor {...props} />,
  Donation: (props) => <Heart {...props} />,
  Other: (props) => <MoreHorizontal {...props} />,
};

export function getCategoryIcon(categoryName: string, className: string = 'w-5 h-5') {
  const iconFn = iconMap[categoryName] || iconMap['Other'];
  return iconFn({ className });
}
