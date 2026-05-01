import {
  CarrotIcon,
  CircleQuestionMarkIcon,
  CroissantIcon,
  CupSodaIcon,
  HamIcon,
  HeartPlusIcon,
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
      className: 'bg-accent-green-background',
      textClassName: 'text-accent-green-foreground',
    },
  },
  {
    label: 'Deli',
    value: 'deli',
    style: {
      icon: HamIcon,
      className: 'bg-accent-red-background',
      textClassName: 'text-accent-red-foreground',
    },
  },
  {
    label: 'Dairy',
    value: 'dairy',
    style: {
      icon: MilkIcon,
      className: 'bg-accent-gray-background',
      textClassName: 'text-accent-gray-foreground',
    },
  },
  {
    label: 'Bakery',
    value: 'bakery',
    style: {
      icon: CroissantIcon,
      className: 'bg-accent-orange-background',
      textClassName: 'text-accent-orange-foreground',
    },
  },
  {
    label: 'Frozen',
    value: 'frozen',
    style: {
      icon: SnowflakeIcon,
      className: 'bg-accent-blue-background',
      textClassName: 'text-white',
    },
  },
  {
    label: 'Beverages',
    value: 'beverages',
    style: {
      icon: CupSodaIcon,
      className: 'bg-accent-magenta-background',
      textClassName: 'text-accent-magenta-foreground',
    },
  },
  {
    label: 'Snacks',
    value: 'snacks',
    style: {
      icon: PopcornIcon,
      className: 'bg-accent-yellow-background',
      textClassName: 'text-accent-yellow-foreground',
    },
  },
  {
    label: 'Health & Beauty',
    value: 'health-beauty',
    style: {
      icon: HeartPlusIcon,
      className: 'bg-accent-red-background',
      textClassName: 'text-accent-red-foreground',
    },
  },
  {
    label: 'Household',
    value: 'household',
    style: {
      icon: HomeIcon,
      className: 'bg-accent-pink-background',
      textClassName: 'text-accent-pink-foreground',
    },
  },
  {
    label: 'Other',
    value: 'other',
    style: {
      icon: CircleQuestionMarkIcon,
      className: 'bg-accent-white-background',
      textClassName: 'text-accent-white-foreground',
    },
  },
] as const;
export type Category = (typeof categoryOptions)[number]['value'];
