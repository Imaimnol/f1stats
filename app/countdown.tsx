"use client";

import { useEffect, useState } from "react";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdown(targetTime: number): CountdownParts | null {
  const remaining = targetTime - Date.now();
  if (remaining <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function Countdown({ date }: { date: string }) {
  const targetTime = new Date(date).getTime();
  const [countdown, setCountdown] = useState<CountdownParts | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    function updateCountdown() {
      const nextCountdown = getCountdown(targetTime);
      setCountdown(nextCountdown);
      setHasStarted(nextCountdown === null);
    }

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  if (!Number.isFinite(targetTime)) {
    return null;
  }

  if (hasStarted) {
    return (
      <p className="text-lg font-bold text-red-200" role="timer">
        La carrera ya comenzó
      </p>
    );
  }

  const units = [
    { label: "Días", value: countdown?.days },
    { label: "Horas", value: countdown?.hours },
    { label: "Minutos", value: countdown?.minutes },
    { label: "Segundos", value: countdown?.seconds },
  ];

  return (
    <div
      aria-label="Cuenta regresiva para el inicio de la carrera"
      className="grid grid-cols-4 gap-2"
      role="timer"
    >
      {units.map((unit) => (
        <div
          className="rounded-xl border border-red-400/20 bg-red-500/[0.06] px-2 py-3 text-center"
          key={unit.label}
        >
          <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
            {String(unit.value ?? 0).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
            {unit.label}
          </p>
        </div>
      ))}
    </div>
  );
}
