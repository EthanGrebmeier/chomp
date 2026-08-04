import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CategoriesScreen } from '@/features/categories/components/categories-screen';
import { SavedItemsScreen } from '@/features/saved-items/components/saved-items-screen';
import { StoresScreen } from '@/features/stores/components/stores-screen';
import { useTheme } from '@/hooks/use-theme';

import { AccountSettingsScreen } from './account-settings-screen';
import { SettingsMenu } from './settings-menu';
import { type SettingsSubmenu, type SettingsView } from './settings-types';

const PANEL_FADE_DURATION_MS = 220;
const ROOT_DETENT = 0.5;

export function SettingsSheet() {
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  const presentFrameRef = useRef<number | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const isNavigatingAwayRef = useRef(false);
  const [activeView, setActiveView] = useState<SettingsView>('root');
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    presentFrameRef.current = requestAnimationFrame(() => {
      sheetRef.current?.present(0);
    });

    return () => {
      if (presentFrameRef.current !== null) {
        cancelAnimationFrame(presentFrameRef.current);
      }
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, []);

  const handleSelect = (view: SettingsSubmenu) => {
    setHasNavigated(true);
    setActiveView(view);
    sheetRef.current?.resize(1);
  };

  const handleBack = () => {
    setHasNavigated(true);
    setActiveView('root');

    resizeFrameRef.current = requestAnimationFrame(() => {
      sheetRef.current?.resize(0);
    });
  };

  const handleCreateAccount = async () => {
    isNavigatingAwayRef.current = true;
    await sheetRef.current?.dismiss();
    router.dismissTo('/(auth)/sign-in');
  };

  const handleDismiss = () => {
    setActiveView('root');
    setHasNavigated(false);

    if (!isNavigatingAwayRef.current) {
      router.back();
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'saved-items':
        return <SavedItemsScreen onBack={handleBack} />;
      case 'stores':
        return <StoresScreen onBack={handleBack} />;
      case 'categories':
        return <CategoriesScreen onBack={handleBack} />;
      case 'account':
        return <AccountSettingsScreen onBack={handleBack} />;
      case 'root':
        return (
          <View className="pt-6">
            <SettingsMenu
              onSelect={handleSelect}
              onCreateAccount={handleCreateAccount}
            />
          </View>
        );
    }
  };

  const isRootView = activeView === 'root';

  return (
    <TrueSheet
      ref={sheetRef}
      name="settings-sheet"
      detents={[ROOT_DETENT, 1]}
      backgroundColor={theme.background}
      dimmedDetentIndex={0}
      grabber
      scrollable
      onDidDismiss={handleDismiss}
    >
      <View className="flex-1 bg-background">
        <Animated.View
          key={activeView}
          className={isRootView ? undefined : 'flex-1'}
          entering={
            hasNavigated ? FadeIn.duration(PANEL_FADE_DURATION_MS) : undefined
          }
          exiting={FadeOut.duration(PANEL_FADE_DURATION_MS)}
        >
          {renderActiveView()}
        </Animated.View>
      </View>
    </TrueSheet>
  );
}
