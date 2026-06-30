
'use client';

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

function usePersistentState<T>(key: string, initialValue: T): [T, SetValue<T>, boolean] {
  const [isLoaded, setIsLoaded] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    let isMounted = true;
    storage.getItem(key).then(item => {
      if (!isMounted) return;
      try {
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error parsing localStorage key “${key}”:`, error);
      } finally {
        setIsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [key]);
  
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      setStoredValue((prevVal) => {
        const valueToStore = value instanceof Function ? value(prevVal) : value;
        storage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key]);

  return [storedValue, setValue, isLoaded];
}

export default usePersistentState;
