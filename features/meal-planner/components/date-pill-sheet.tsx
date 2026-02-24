import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react-native';
import { useRef } from 'react';

import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { cn } from '../../../lib/utils';

type DatePillSheetProps = {
  date?: string;
  onSelect: (date: string) => void;
  canGoBack?: boolean;
};

export const DatePillSheet = ({
  date,
  onSelect,
  canGoBack = true,
}: DatePillSheetProps) => {
  const sheetRef = useRef<CalendarSheetRef>(null);

  const openSheet = () => {
    sheetRef.current?.present();
  };

  const handleSelect = (selectedDate: Date) => {
    onSelect(format(selectedDate, 'yyyy-MM-dd'));
    sheetRef.current?.dismiss();
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      // Handle both 'yyyy-MM-dd' and 'yyyy-MM-ddT00:00:00' formats
      // Parse as local date to avoid timezone shifts
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      return format(parsedDate, 'MMM d');
    } catch {
      return 'Date';
    }
  };

  return (
    <>
      <HapticPressable onPress={openSheet} hapticType="light">
        <Pill
          className={cn(!date && 'border-dashed')}
          icon={
            <Icon
              className="text-muted-foreground"
              as={CalendarIcon}
              size={16}
            />
          }
          hasValue={!!date}
        >
          {date ? formatDisplayDate(date) : 'Date'}
        </Pill>
      </HapticPressable>

      <CalendarSheet
        ref={sheetRef}
        onChange={handleSelect}
        headerTitle="Select Date"
        name="date-pill-sheet"
        selectedDate={
          date
            ? (() => {
                // Parse date string as local date to avoid timezone shifts
                const [datePart] = date.split('T');
                const [year, month, day] = datePart.split('-').map(Number);
                return new Date(year, month - 1, day);
              })()
            : undefined
        }
      />
    </>
  );
};
