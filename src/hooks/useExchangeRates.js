import { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

export default function useExchangeRates() {
  const [rates, setRates] = useState([]);
  useEffect(() => {
    let active = true;
    apiRequest('/api/exchange-rates').then(result => {
      if (active && result.success) setRates(result.data?.data || []);
    });
    return () => { active = false; };
  }, []);
  return rates;
}
