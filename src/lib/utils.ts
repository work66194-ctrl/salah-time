import { format, parse, isAfter, differenceInSeconds } from 'date-fns';

export interface NextPrayerInfo {
    name: string;
    time: string;
    type: 'Adhan' | 'Jamat';
    secondsRemaining: number;
}

// Helper to convert typical 'HH:mm' time strings to today's Date object
export function getUpcomingPrayer(
    prayerTimes: { name: string; adhan: string; iqamah: string }[],
    currentTime: Date
): NextPrayerInfo | null {
    const currentStr = format(currentTime, 'HH:mm');

    for (const p of prayerTimes) {
        if (!p.adhan || !p.iqamah) continue;

        // Check Adhan
        if (currentStr < p.adhan) {
            const adhanDate = parse(p.adhan, 'HH:mm', currentTime);
            return {
                name: p.name,
                time: p.adhan,
                type: 'Adhan',
                secondsRemaining: differenceInSeconds(adhanDate, currentTime),
            };
        }

        // Check Iqamah
        if (currentStr < p.iqamah) {
            const iqamahDate = parse(p.iqamah, 'HH:mm', currentTime);
            return {
                name: p.name,
                time: p.iqamah,
                type: 'Jamat',
                secondsRemaining: differenceInSeconds(iqamahDate, currentTime),
            };
        }
    }

    // If all prayers today have passed, return tomorrow's Fajr
    const firstPrayer = prayerTimes[0];
    if (firstPrayer && firstPrayer.adhan) {
        const tomorrowFajrDate = parse(firstPrayer.adhan, 'HH:mm', new Date(currentTime.getTime() + 86400000));
        return {
            name: firstPrayer.name,
            time: firstPrayer.adhan,
            type: 'Adhan',
            secondsRemaining: differenceInSeconds(tomorrowFajrDate, currentTime),
        };
    }

    return null;
}

export function formatTimeRemaining(totalSeconds: number): string {
    if (totalSeconds <= 0) return "00:00:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function format12Hour(time24: string): string {
    if (!time24) return '--:--';
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${m} ${ampm}`;
}
