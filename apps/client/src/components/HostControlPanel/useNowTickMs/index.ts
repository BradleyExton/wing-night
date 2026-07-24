import { useEffect, useState } from "react";

export const useNowTickMs = (): number => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, []);

  return now;
};
