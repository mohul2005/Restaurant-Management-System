import { useEffect, useState, useMemo } from 'react';

interface FoodItem {
  id: number;
  icon: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
}

const FOOD_ICONS = [
  'ri-cake-line',
  'ri-cake-2-line',
  'ri-goblet-line',
  'ri-cup-line',
  'ri-bowl-line',
  'ri-restaurant-2-line',
  'ri-knife-line',
];

function generateFoodItems(count: number): FoodItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    icon: FOOD_ICONS[i % FOOD_ICONS.length],
    x: (i * 7 + 3) % 100,
    y: (i * 13 + 5) % 90,
    size: 14 + (i * 3) % 16,
    duration: 7 + (i * 2) % 8,
    delay: (i * 1.7) % 6,
    rotate: ((i % 5) - 2) * 15,
  }));
}

export default function FloatingFood() {
  const items = useMemo(() => generateFoodItems(14), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes float-food-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes float-food-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-24px); }
        }
        @keyframes float-food-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `}</style>
      {items.map((item) => {
        const animName = `float-food-${(item.id % 3) + 1}`;
        return (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              animation: `${animName} ${item.duration}s ease-in-out ${item.delay}s infinite`,
            }}
          >
            <div
              style={{
                fontSize: `${item.size}px`,
                transform: `rotate(${item.rotate}deg)`,
                opacity: 0.1,
                color: 'var(--foreground-500)',
              }}
            >
              <i className={item.icon}></i>
            </div>
          </div>
        );
      })}
    </div>
  );
}