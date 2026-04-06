import { useState, useEffect } from 'react';

interface CountdownProps {
  weddingDate: Date; // 婚礼日期
}

export default function Countdown({ weddingDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const weddingTime = weddingDate.getTime();
      const difference = weddingTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const totalDays = Math.floor((weddingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">婚礼倒计时</h2>
        <p className="text-white/80 mt-1">
          距离 {weddingDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-3xl font-bold">{timeLeft.days}</div>
          <div className="text-xs text-white/80 uppercase">天</div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-3xl font-bold">{formatNumber(timeLeft.hours)}</div>
          <div className="text-xs text-white/80 uppercase">时</div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-3xl font-bold">{formatNumber(timeLeft.minutes)}</div>
          <div className="text-xs text-white/80 uppercase">分</div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-3xl font-bold">{formatNumber(timeLeft.seconds)}</div>
          <div className="text-xs text-white/80 uppercase">秒</div>
        </div>
      </div>

      <div className="text-center text-sm text-white/90 bg-white/10 rounded-lg py-2 px-4">
        还有 <span className="font-bold text-lg">{totalDays}</span> 天
      </div>
    </div>
  );
}
