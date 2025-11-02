import {
  BoxIcon,
  CarrotIcon,
  CircleQuestionMarkIcon,
  CroissantIcon,
  CupSodaIcon,
  HamIcon,
  HeartIcon,
  HomeIcon,
  MilkIcon,
  PopcornIcon,
  SnowflakeIcon,
} from 'lucide-react-native';

export const categoryOptions = [
  {
    label: 'Produce',
    value: 'produce',
    style: {
      icon: CarrotIcon,
      className: 'border-accent-green-foreground bg-accent-green-background',
      textClassName: 'text-accent-green-foreground',
    },
  },
  {
    label: 'Deli',
    value: 'deli',
    style: {
      icon: HamIcon,
      className: 'border-accent-orange-foreground bg-accent-orange-background',
      textClassName: 'text-accent-orange-foreground',
    },
  },
  {
    label: 'Dairy',
    value: 'dairy',
    style: {
      icon: MilkIcon,
      className: 'border-accent-pink-foreground bg-accent-pink-background',
      textClassName: 'text-accent-pink-foreground',
    },
  },
  {
    label: 'Bakery',
    value: 'bakery',
    style: {
      icon: CroissantIcon,
      className: 'border-accent-yellow-foreground bg-accent-yellow-background',
      textClassName: 'text-accent-yellow-foreground',
    },
  },
  {
    label: 'Frozen',
    value: 'frozen',
    style: {
      icon: SnowflakeIcon,
      className: 'border-accent-blue-foreground bg-accent-blue-background',
      textClassName: 'text-accent-blue-foreground',
    },
  },
  {
    label: 'Pantry',
    value: 'pantry',
    style: {
      icon: BoxIcon,
      className: 'border-accent-orange-foreground bg-accent-orange-background',
      textClassName: 'text-accent-orange-foreground',
    },
  },
  {
    label: 'Beverages',
    value: 'beverages',
    style: {
      icon: CupSodaIcon,
      className: 'border-accent-purple-foreground bg-accent-purple-background',
      textClassName: 'text-accent-purple-foreground',
    },
  },
  {
    label: 'Snacks',
    value: 'snacks',
    style: {
      icon: PopcornIcon,
      className: 'border-accent-red-foreground bg-accent-red-background',
      textClassName: 'text-accent-red-foreground',
    },
  },
  {
    label: 'Health & Beauty',
    value: 'health-beauty',
    style: {
      icon: HeartIcon,
      className: 'border-accent-pink-foreground bg-accent-pink-background',
      textClassName: 'text-accent-pink-foreground',
    },
  },
  {
    label: 'Household',
    value: 'household',
    style: {
      icon: HomeIcon,
      className: 'border-accent-brown-foreground bg-accent-brown-background',
      textClassName: 'text-accent-brown-foreground',
    },
  },
  {
    label: 'Other',
    value: 'other',
    style: {
      icon: CircleQuestionMarkIcon,
      className: 'border-accent-yellow-foreground bg-accent-yellow-background',
      textClassName: 'text-accent-yellow-foreground',
    },
  },
] as const;
export type Category = (typeof categoryOptions)[number]['value'];
