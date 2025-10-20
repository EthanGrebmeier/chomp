import {
  BoxIcon,
  CircleQuestionMarkIcon,
  CroissantIcon,
  CupSodaIcon,
  HamIcon,
  HeartIcon,
  HomeIcon,
  LeafIcon,
  MilkIcon,
  PopcornIcon,
  SnowflakeIcon,
} from 'lucide-react-native';

export const categoryOptions = [
  {
    label: 'Produce',
    value: 'produce',
    style: {
      icon: LeafIcon,
    },
  },
  {
    label: 'Deli',
    value: 'deli',
    style: {
      icon: HamIcon,
    },
  },
  {
    label: 'Dairy',
    value: 'dairy',
    style: {
      icon: MilkIcon,
    },
  },
  {
    label: 'Bakery',
    value: 'bakery',
    style: {
      icon: CroissantIcon,
    },
  },
  {
    label: 'Frozen',
    value: 'frozen',
    style: {
      icon: SnowflakeIcon,
    },
  },
  {
    label: 'Pantry',
    value: 'pantry',
    style: {
      icon: BoxIcon,
    },
  },
  {
    label: 'Beverages',
    value: 'beverages',
    style: {
      icon: CupSodaIcon,
    },
  },
  {
    label: 'Snacks',
    value: 'snacks',
    style: {
      icon: PopcornIcon,
    },
  },
  {
    label: 'Health & Beauty',
    value: 'health-beauty',
    style: {
      icon: HeartIcon,
    },
  },
  {
    label: 'Household',
    value: 'household',
    style: {
      icon: HomeIcon,
    },
  },
  {
    label: 'Other',
    value: 'other',
    style: {
      icon: CircleQuestionMarkIcon,
    },
  },
] as const;
export type Category = (typeof categoryOptions)[number]['value'];
