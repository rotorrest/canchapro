"use client";

import { useState, useEffect } from "react";

const sports = ["padel", "tenis", "voley", "basquet", "futbol", "squash"];

export default function RotatingHero() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % sports.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-sm text-gray-400 mt-3">
      Hecho para clubes de{" "}
      <span
        className={`inline-block font-medium text-brand-600 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        {sports[index]}
      </span>
      , y muchos deportes mas.
    </p>
  );
}
