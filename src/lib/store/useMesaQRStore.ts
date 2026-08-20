'use client';

import { useState, useEffect } from 'react';
import { db } from './db';

export function useMesaQRStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to DB events and force re-render
    const unsubscribe = db.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  return db;
}
