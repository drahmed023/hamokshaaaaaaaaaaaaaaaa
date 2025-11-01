import { useState, useEffect } from 'react';

const STORAGE_KEY = 'userPhoneNumber';

export const usePhoneNumber = () => {
  const [phoneNumber, setPhoneNumberState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch (error) {
      console.error('Failed to read phone number from localStorage', error);
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, phoneNumber);
    } catch (error) {
      console.error('Failed to save phone number to localStorage', error);
    }
  }, [phoneNumber]);

  const setPhoneNumber = (newNumber: string) => {
    setPhoneNumberState(newNumber);
  };

  return { phoneNumber, setPhoneNumber };
};
