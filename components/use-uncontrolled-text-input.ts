import { useCallback, useRef, useState } from 'react';
import { TextInput } from 'react-native';

type TextInputRef = React.RefObject<TextInput | null>;

export const useUncontrolledTextInput = (initialValue = '') => {
  const valueRef = useRef(initialValue);
  const [defaultValue, setDefaultValue] = useState(initialValue);
  const [inputKey, setInputKey] = useState(0);

  const handleChangeText = useCallback((text: string) => {
    valueRef.current = text;
  }, []);

  const getValue = useCallback(() => valueRef.current, []);

  const reset = useCallback((value = '') => {
    valueRef.current = value;
    setDefaultValue(value);
    setInputKey(key => key + 1);
  }, []);

  const setValue = useCallback((value: string, inputRef?: TextInputRef) => {
    valueRef.current = value;
    // On the new architecture (Fabric) `setNativeProps({ text: '' })` is a
    // no-op, so clearing in place must go through TextInput's supported
    // imperative `clear()` method. Without this the field keeps its old text
    // after a continuous-add submit even though the value ref was reset.
    if (value === '') {
      inputRef?.current?.clear();
    } else {
      inputRef?.current?.setNativeProps({ text: value });
    }
  }, []);

  return {
    inputKey,
    defaultValue,
    valueRef,
    handleChangeText,
    getValue,
    reset,
    setValue,
  };
};
