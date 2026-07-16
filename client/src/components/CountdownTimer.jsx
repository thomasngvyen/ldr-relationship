import { useState, useEffect } from 'react';
import './CountdownTimer.css';

/**
 * @param {Date | string} targetDate
 */
const calculateTimeLeft = (targetDate) => {
    const difference = Date.parse(targetDate.toString()) - Date.now();
    let timeLeft = null;

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000),
        };
    }
    return timeLeft;
};


/**
 * @param {Object} props
 * @param {Date | string} props.targetDate
 */
export default function CountdownTimer({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            const nextTime = calculateTimeLeft(targetDate);
            setTimeLeft(nextTime);

            if (!nextTime) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
        return <div className="timer-ended">🎉 Event has started!</div>;
    }

    return (
        <div className="countdown-timer">
            <div className="time-segment">
                <span className="time-value">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="time-label">Days</span>
            </div>
            <div className="time-segment">
                <span className="time-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="time-label">Hours</span>
            </div>
            <div className="time-segment">
                <span className="time-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="time-label">Minutes</span>
            </div>
            <div className="time-segment">
                <span className="time-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="time-label">Seconds</span>
            </div>
        </div>
    );
}