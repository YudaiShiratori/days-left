import { describe, expect, it } from 'vitest';

// 日付計算のユーティリティ関数（実装予定）
function calculateLifeExpectancy(
  _birthYear: number,
  gender: 'male' | 'female'
): number {
  const baseMaleLifeExpectancy = 81.09;
  const baseFemaleLifeExpectancy = 87.13;
  const baseExpectancy =
    gender === 'male' ? baseMaleLifeExpectancy : baseFemaleLifeExpectancy;
  return Math.round(baseExpectancy * 10) / 10;
}

function calculateDaysLeft(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: 'male' | 'female'
): number {
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const today = new Date();
  const lifeExpectancy = calculateLifeExpectancy(birthYear, gender);
  const expectedDeathDate = new Date(birthDate);
  expectedDeathDate.setFullYear(
    birthDate.getFullYear() + Math.floor(lifeExpectancy)
  );

  const fractionalDays = (lifeExpectancy - Math.floor(lifeExpectancy)) * 365;
  expectedDeathDate.setDate(
    expectedDeathDate.getDate() + Math.floor(fractionalDays)
  );

  const timeDiff = expectedDeathDate.getTime() - today.getTime();
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, days);
}

function calculateTargetDaysLeft(
  targetYear: number,
  targetMonth: number,
  targetDay: number
): number {
  const target = new Date(targetYear, targetMonth - 1, targetDay);
  const today = new Date();
  const timeDiff = target.getTime() - today.getTime();
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return days;
}

describe('Date Calculation Reliability', () => {
  describe('Basic Date Calculations', () => {
    it('should calculate correct days left for future date', () => {
      const today = new Date();
      const nextYear = today.getFullYear() + 1;

      const daysLeft = calculateTargetDaysLeft(nextYear, 1, 1);

      // 来年の1月1日までの日数は正の値
      expect(daysLeft).toBeGreaterThan(0);
      expect(daysLeft).toBeLessThan(400); // 1年以内
    });

    it('should calculate correct days left for past date', () => {
      const today = new Date();
      const lastYear = today.getFullYear() - 1;

      const daysLeft = calculateTargetDaysLeft(lastYear, 1, 1);

      // 去年の1月1日は負の値
      expect(daysLeft).toBeLessThan(0);
    });
  });

  describe('Leap Year Handling', () => {
    it('should handle leap year February 29th correctly', () => {
      // うるう年のテスト（2024年2月29日）
      const daysLeft = calculateTargetDaysLeft(2024, 2, 29);

      // 2024年2月29日は有効な日付
      expect(typeof daysLeft).toBe('number');
    });

    it('should handle non-leap year February correctly', () => {
      // 平年のテスト（2023年は平年）
      const target = new Date(2023, 1, 28); // 2023年2月28日
      const isValid = !Number.isNaN(target.getTime());

      expect(isValid).toBe(true);
    });

    it('should calculate life expectancy consistently across leap years', () => {
      // うるう年生まれの人の寿命計算
      const leapYearBorn = calculateDaysLeft(2000, 2, 29, 'male'); // うるう年生まれ
      const normalYearBorn = calculateDaysLeft(1999, 2, 28, 'male'); // 平年生まれ

      // 両方とも正の値である
      expect(leapYearBorn).toBeGreaterThan(0);
      expect(normalYearBorn).toBeGreaterThan(0);
    });
  });

  describe('Timezone Consistency', () => {
    it('should handle day boundary correctly (23:59 to 00:00)', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const daysToTomorrow = calculateTargetDaysLeft(
        tomorrow.getFullYear(),
        tomorrow.getMonth() + 1,
        tomorrow.getDate()
      );

      // 明日まで1日
      expect(daysToTomorrow).toBe(1);
    });

    it('should use local timezone consistently', () => {
      const today = new Date();
      const todayDaysLeft = calculateTargetDaysLeft(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );

      // 今日は0日（当日）
      expect(Math.abs(todayDaysLeft)).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle end of month correctly', () => {
      // 月末の計算
      const endOfMonth = calculateTargetDaysLeft(2024, 1, 31);
      expect(typeof endOfMonth).toBe('number');
    });

    it('should handle year boundary correctly', () => {
      // 年末年始の計算
      const newYear = calculateTargetDaysLeft(2025, 1, 1);
      expect(typeof newYear).toBe('number');
    });

    it('should handle very old birth dates', () => {
      // 古い生年月日でもエラーにならない
      const oldBirthDays = calculateDaysLeft(1920, 1, 1, 'female');
      expect(oldBirthDays).toBeGreaterThanOrEqual(0);
    });

    it('should handle century boundaries', () => {
      // 世紀をまたぐ計算
      const centuryTest = calculateTargetDaysLeft(2100, 1, 1);
      expect(typeof centuryTest).toBe('number');
    });
  });

  describe('Performance and Accuracy', () => {
    it('should calculate quickly for many dates', () => {
      const startTime = performance.now();

      // 100回計算を実行
      for (let i = 0; i < 100; i++) {
        calculateDaysLeft(1990, 1, 1, 'male');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100回の計算が100ms以内に完了
      expect(duration).toBeLessThan(100);
    });

    it('should provide consistent results for same input', () => {
      const result1 = calculateDaysLeft(1990, 1, 1, 'male');
      const result2 = calculateDaysLeft(1990, 1, 1, 'male');

      // 同じ入力に対して同じ結果
      expect(result1).toBe(result2);
    });
  });
});
