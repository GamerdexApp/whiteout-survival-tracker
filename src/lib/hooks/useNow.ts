import { useEffect, useState } from "react";

/**
 * The current time in milliseconds, refreshed on an interval. A countdown reads this instead of
 * keeping its own timer, so every countdown on the page ticks together.
 */
export const useNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
