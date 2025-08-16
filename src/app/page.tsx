'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { InstallPwaButton } from '~/components/install-pwa-button';

interface TargetDate {
  id: string;
  year: number;
  month: number;
  day: number;
  label: string;
}

interface LegacyTargetDate {
  year: number;
  month: number;
  day: number;
  label: string;
}

interface TempTargetDate {
  id: string;
  year: string;
  month: string;
  day: string;
  label: string;
}

interface ErrorState {
  birthDate?: string;
  targets?: Record<string, string>;
}

interface UserSettings {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: 'male' | 'female';
  targets: TargetDate[];
}

// 設定データの変換処理
function convertLegacySettings(parsed: unknown): UserSettings | null {
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const parsedObj = parsed as Record<string, unknown>;
  // 旧形式のデータを新形式に変換
  if (parsedObj.birthDate && !parsedObj.birthYear) {
    const birthDate = new Date(parsedObj.birthDate as string);
    const convertedSettings: UserSettings = {
      birthYear: birthDate.getFullYear(),
      birthMonth: birthDate.getMonth() + 1,
      birthDay: birthDate.getDate(),
      gender: 'male', // デフォルト値
      targets: parsedObj.targetDate
        ? [
            {
              id: 'legacy',
              year: (parsedObj.targetDate as LegacyTargetDate).year,
              month: (parsedObj.targetDate as LegacyTargetDate).month,
              day: (parsedObj.targetDate as LegacyTargetDate).day,
              label: (parsedObj.targetDate as LegacyTargetDate).label,
            },
          ]
        : [],
    };
    return convertedSettings;
  }

  if (parsedObj.birthYear) {
    // 新旧混在データの処理
    const newSettings: UserSettings = {
      birthYear: parsedObj.birthYear as number,
      birthMonth: parsedObj.birthMonth as number,
      birthDay: parsedObj.birthDay as number,
      gender: (parsedObj.gender as 'male' | 'female') || 'male', // 性別がない場合はデフォルト値
      targets: [],
    };

    // 旧形式の単一targetDateがある場合
    if (parsedObj.targetDate && !parsedObj.targets) {
      const targetDate = parsedObj.targetDate as LegacyTargetDate;
      newSettings.targets = [
        {
          id: 'legacy',
          year: targetDate.year,
          month: targetDate.month,
          day: targetDate.day,
          label: targetDate.label,
        },
      ];
    } else if (parsedObj.targets) {
      // 新形式のtargetsがある場合
      newSettings.targets = parsedObj.targets as TargetDate[];
    }

    return newSettings;
  }

  return null;
}

// アプリの状態管理用のカスタムフック
function useAppState() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [targetDaysLeft, setTargetDaysLeft] = useState<Record<string, number>>(
    {}
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'life' | string>('life');

  // 一時的な編集値
  const [tempYear, setTempYear] = useState('');
  const [tempMonth, setTempMonth] = useState('');
  const [tempDay, setTempDay] = useState('');
  const [tempGender, setTempGender] = useState<'male' | 'female'>('male');

  // 目標日の一時的な編集値
  const [tempTargets, setTempTargets] = useState<
    Array<{
      id: string;
      year: string;
      month: string;
      day: string;
      label: string;
    }>
  >([]);

  // エラー状態の管理
  const [errors, setErrors] = useState<{
    birthDate?: string;
    targets?: Record<string, string>;
  }>({});

  // リセット確認モーダル
  const [showResetModal, setShowResetModal] = useState(false);

  return {
    settings,
    setSettings,
    daysLeft,
    setDaysLeft,
    targetDaysLeft,
    setTargetDaysLeft,
    isEditing,
    setIsEditing,
    isLoading,
    setIsLoading,
    activeTab,
    setActiveTab,
    tempYear,
    setTempYear,
    tempMonth,
    setTempMonth,
    tempDay,
    setTempDay,
    tempGender,
    setTempGender,
    tempTargets,
    setTempTargets,
    errors,
    setErrors,
    showResetModal,
    setShowResetModal,
  };
}

// Utility functions for settings management
function createDefaultSettings(): UserSettings {
  const today = new Date();
  const currentYear = today.getFullYear();
  return {
    birthYear: currentYear - 30,
    birthMonth: 1,
    birthDay: 1,
    gender: 'male',
    targets: [
      {
        id: 'sample-newyear',
        year: currentYear,
        month: 12,
        day: 31,
        label: '今年の終わりまで',
      },
    ],
  };
}

function loadSettingsFromStorage(): UserSettings | null {
  const savedSettings = localStorage.getItem('daysLeftSettings');
  if (!savedSettings) {
    return null;
  }

  try {
    const parsed = JSON.parse(savedSettings);
    const convertedSettings = convertLegacySettings(parsed);

    if (convertedSettings) {
      localStorage.setItem(
        'daysLeftSettings',
        JSON.stringify(convertedSettings)
      );
      return convertedSettings;
    }
    localStorage.removeItem('daysLeftSettings');
    return null;
  } catch (_e) {
    localStorage.removeItem('daysLeftSettings');
    return null;
  }
}

function saveSettingsToStorage(settings: UserSettings): void {
  localStorage.setItem('daysLeftSettings', JSON.stringify(settings));
}

// Validation utilities
function validateDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function checkBasicInput(
  year: number,
  month: number,
  day: number
): string | null {
  if (!(year && month && day)) {
    return '生年月日を入力してください';
  }
  if (year < 1900 || year > 2100) {
    return '年は1900年から2100年の間で入力してください';
  }
  if (month < 1 || month > 12) {
    return '月は1から12の間で入力してください';
  }
  return null;
}

function validateBirthDate(
  year: number,
  month: number,
  day: number
): string | null {
  const basicError = checkBasicInput(year, month, day);
  if (basicError) {
    return basicError;
  }

  if (day < 1 || day > 31) {
    return '日は1から31の間で入力してください';
  }
  if (!validateDate(year, month, day)) {
    return '存在しない日付です';
  }
  if (new Date(year, month - 1, day) > new Date()) {
    return '未来の日付は設定できません';
  }
  return null;
}

// Loading component
function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <div className="mt-6 space-y-2">
          <p className="font-medium text-gray-900 text-lg">
            設定を読み込んでいます
          </p>
          <p className="text-gray-600 text-sm">しばらくお待ちください</p>
        </div>
        <div className="mt-4">
          <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-full animate-pulse bg-gradient-to-r from-blue-400 to-blue-600" />
          </div>
        </div>
      </div>
    </main>
  );
}

// Target card component
function TargetCard({
  target,
  daysLeft,
}: {
  target: TargetDate;
  daysLeft: number | undefined;
}) {
  return (
    <div className="mb-8">
      <div className="mb-4 text-center">
        <h2 className="font-bold text-2xl text-gray-900 md:text-3xl">
          {target.label}
        </h2>
      </div>
      <div className="rounded-3xl bg-blue-900 p-8 shadow-2xl md:p-16">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-2xl text-blue-300 md:text-3xl">
              {(daysLeft ?? 0) < 0 ? '経過' : 'あと'}
            </span>
          </div>
          <div className="font-black text-6xl text-white tabular-nums sm:text-7xl md:text-8xl lg:text-9xl">
            {daysLeft !== undefined
              ? Math.abs(daysLeft).toLocaleString()
              : '---'}
          </div>
          <div className="mt-4 text-3xl text-blue-300 md:text-4xl lg:text-5xl">
            日
          </div>
        </div>
      </div>
    </div>
  );
}

// Life days card component
function LifeDaysCard({ daysLeft }: { daysLeft: number | null }) {
  return (
    <div className="mb-8">
      <div className="mb-4 text-center">
        <h2 className="font-bold text-2xl text-gray-900 md:text-3xl">
          人生の残り日数
        </h2>
      </div>
      <div className="rounded-3xl bg-slate-900 p-8 shadow-2xl md:p-16">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-2xl text-slate-300 md:text-3xl">あと</span>
          </div>
          <div className="font-black text-6xl text-white tabular-nums sm:text-7xl md:text-8xl lg:text-9xl">
            {daysLeft !== null ? daysLeft.toLocaleString() : '---'}
          </div>
          <div className="mt-4 text-3xl text-slate-300 md:text-4xl lg:text-5xl">
            日
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom hook for date calculations
function useDateCalculations() {
  const calculateLifeExpectancy = useCallback(
    (_birthYear: number, gender: 'male' | 'female') => {
      const baseMaleLifeExpectancy = 81.09;
      const baseFemaleLifeExpectancy = 87.13;
      const baseExpectancy =
        gender === 'male' ? baseMaleLifeExpectancy : baseFemaleLifeExpectancy;
      return Math.round(baseExpectancy * 10) / 10;
    },
    []
  );

  const calculateDaysLeft = useCallback(
    (userSettings: UserSettings) => {
      const birthDate = new Date(
        userSettings.birthYear,
        userSettings.birthMonth - 1,
        userSettings.birthDay
      );
      const today = new Date();
      const lifeExpectancy = calculateLifeExpectancy(
        userSettings.birthYear,
        userSettings.gender
      );
      const expectedDeathDate = new Date(birthDate);
      expectedDeathDate.setFullYear(
        birthDate.getFullYear() + Math.floor(lifeExpectancy)
      );

      const fractionalDays =
        (lifeExpectancy - Math.floor(lifeExpectancy)) * 365;
      expectedDeathDate.setDate(
        expectedDeathDate.getDate() + Math.floor(fractionalDays)
      );

      const timeDiff = expectedDeathDate.getTime() - today.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return Math.max(0, days);
    },
    [calculateLifeExpectancy]
  );

  const calculateTargetDaysLeft = useCallback((targetDate: TargetDate) => {
    const target = new Date(
      targetDate.year,
      targetDate.month - 1,
      targetDate.day
    );
    const today = new Date();
    const timeDiff = target.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days;
  }, []);

  return { calculateDaysLeft, calculateTargetDaysLeft };
}

// Hook for handling user settings operations
function useSettingsOperations() {
  const handleEdit = (
    settings: UserSettings | null,
    setters: {
      setTempYear: (year: string) => void;
      setTempMonth: (month: string) => void;
      setTempDay: (day: string) => void;
      setTempGender: (gender: 'male' | 'female') => void;
      setTempTargets: (targets: TempTargetDate[]) => void;
      setIsEditing: (editing: boolean) => void;
    }
  ) => {
    const defaultSettings = settings || createDefaultSettings();
    setters.setTempYear(defaultSettings.birthYear.toString());
    setters.setTempMonth(defaultSettings.birthMonth.toString());
    setters.setTempDay(defaultSettings.birthDay.toString());
    setters.setTempGender(defaultSettings.gender);
    setters.setTempTargets(
      defaultSettings.targets.map((target) => ({
        id: target.id,
        year: target.year.toString(),
        month: target.month.toString(),
        day: target.day.toString(),
        label: target.label,
      }))
    );
    setters.setIsEditing(true);
  };

  const validateTargets = (tempTargets: TempTargetDate[]) => {
    const targetErrors: Record<string, string> = {};
    const validTargets: TargetDate[] = [];

    for (const target of tempTargets) {
      if (!target.label.trim()) {
        targetErrors[target.id] = '目標の名前を入力してください';
        continue;
      }

      const targetYear = Number.parseInt(target.year, 10);
      const targetMonth = Number.parseInt(target.month, 10);
      const targetDay = Number.parseInt(target.day, 10);

      if (!(target.year && target.month && target.day)) {
        targetErrors[target.id] = '日付を入力してください';
        continue;
      }

      if (!validateDate(targetYear, targetMonth, targetDay)) {
        targetErrors[target.id] = '存在しない日付です';
        continue;
      }

      validTargets.push({
        id: target.id,
        year: targetYear,
        month: targetMonth,
        day: targetDay,
        label: target.label.trim(),
      });
    }

    return { targetErrors, validTargets };
  };

  return { handleEdit, validateTargets };
}

// Main display components
function MainDisplay({
  settings,
  daysLeft,
  targetDaysLeft,
  handleEdit,
}: {
  settings: UserSettings;
  daysLeft: number;
  targetDaysLeft: Record<string, number>;
  handleEdit: () => void;
}) {
  return (
    <div className="space-y-8">
      {settings.targets.length > 0 && (
        <div className="space-y-8">
          {settings.targets.map((target) => (
            <TargetCard
              daysLeft={targetDaysLeft[target.id]}
              key={target.id}
              target={target}
            />
          ))}
        </div>
      )}

      <LifeDaysCard daysLeft={daysLeft} />

      <div className="flex flex-col justify-center gap-4 sm:gap-3">
        <div className="flex justify-center">
          <button
            className="rounded-lg bg-blue-600 px-6 py-4 font-medium text-base text-white transition-colors hover:bg-blue-700 md:px-6 md:py-3 md:text-base"
            onClick={handleEdit}
            type="button"
          >
            設定を変更
          </button>
        </div>
        <div className="flex justify-center">
          <InstallPwaButton />
        </div>
      </div>
    </div>
  );
}

// Settings form component
function SettingsForm({
  tempYear,
  setTempYear,
  tempMonth,
  setTempMonth,
  tempDay,
  setTempDay,
  tempGender,
  setTempGender,
  tempTargets,
  setTempTargets,
  errors,
  handleSave,
  handleCancel,
  settings,
}: {
  tempYear: string;
  setTempYear: (year: string) => void;
  tempMonth: string;
  setTempMonth: (month: string) => void;
  tempDay: string;
  setTempDay: (day: string) => void;
  tempGender: 'male' | 'female';
  setTempGender: (gender: 'male' | 'female') => void;
  tempTargets: TempTargetDate[];
  setTempTargets: (targets: TempTargetDate[]) => void;
  errors: ErrorState;
  handleSave: () => void;
  handleCancel: () => void;
  settings: UserSettings | null;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
  const futureYears = Array.from({ length: 30 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const addNewTarget = () => {
    const newId = `target-${Date.now()}`;
    setTempTargets([
      ...tempTargets,
      { id: newId, year: '', month: '', day: '', label: '' },
    ]);
  };

  const removeTarget = (id: string) => {
    setTempTargets(tempTargets.filter((target) => target.id !== id));
  };

  const updateTarget = (id: string, field: string, value: string) => {
    setTempTargets(
      tempTargets.map((target) =>
        target.id === id ? { ...target, [field]: value } : target
      )
    );
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg md:p-12">
      <h2 className="mb-6 text-center font-bold text-gray-900 text-xl md:mb-8 md:text-2xl">
        あなたの情報を入力
      </h2>

      <div className="mb-8 space-y-6">
        <div>
          <div className="mb-3 block font-medium text-gray-700 text-sm">
            生年月日
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div>
              <select
                className="w-full rounded-lg border-2 border-gray-300 px-2 py-3 text-center font-medium text-base focus:border-blue-500 focus:outline-none md:px-3 md:text-lg"
                onChange={(e) => setTempYear(e.target.value)}
                value={tempYear}
              >
                <option value="">年</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full rounded-lg border-2 border-gray-300 px-2 py-3 text-center font-medium text-base focus:border-blue-500 focus:outline-none md:px-3 md:text-lg"
                onChange={(e) => setTempMonth(e.target.value)}
                value={tempMonth}
              >
                <option value="">月</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full rounded-lg border-2 border-gray-300 px-2 py-3 text-center font-medium text-base focus:border-blue-500 focus:outline-none md:px-3 md:text-lg"
                onChange={(e) => setTempDay(e.target.value)}
                value={tempDay}
              >
                <option value="">日</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.birthDate && (
            <p className="mt-2 text-red-600 text-sm">{errors.birthDate}</p>
          )}
        </div>

        <div>
          <div className="mb-3 block font-medium text-gray-700 text-sm">
            性別
          </div>
          <select
            className="w-full rounded-lg border-2 border-gray-300 px-3 py-3 font-medium text-base focus:border-blue-500 focus:outline-none md:text-lg"
            onChange={(e) => setTempGender(e.target.value as 'male' | 'female')}
            value={tempGender}
          >
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-medium text-gray-700 text-sm">
            目標日（任意）
          </div>
          <button
            className="rounded-lg bg-green-600 px-3 py-2 font-medium text-sm text-white transition-colors hover:bg-green-700"
            onClick={addNewTarget}
            type="button"
          >
            + 追加
          </button>
        </div>

        <div className="space-y-4">
          {tempTargets.map((target) => (
            <div
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              key={target.id}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="font-medium text-gray-700 text-sm">目標名</div>
                <button
                  className="rounded-lg bg-red-600 px-3 py-1 font-medium text-sm text-white transition-colors hover:bg-red-700"
                  onClick={() => removeTarget(target.id)}
                  type="button"
                >
                  削除
                </button>
              </div>
              <input
                className="mb-3 w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                onChange={(e) =>
                  updateTarget(target.id, 'label', e.target.value)
                }
                placeholder="例: 誕生日まで"
                type="text"
                value={target.label}
              />

              <div className="mb-3 block font-medium text-gray-700 text-sm">
                目標日
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="w-full rounded-lg border-2 border-gray-300 px-2 py-2 text-center text-base focus:border-blue-500 focus:outline-none"
                  onChange={(e) =>
                    updateTarget(target.id, 'year', e.target.value)
                  }
                  value={target.year}
                >
                  <option value="">年</option>
                  {futureYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border-2 border-gray-300 px-2 py-2 text-center text-base focus:border-blue-500 focus:outline-none"
                  onChange={(e) =>
                    updateTarget(target.id, 'month', e.target.value)
                  }
                  value={target.month}
                >
                  <option value="">月</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border-2 border-gray-300 px-2 py-2 text-center text-base focus:border-blue-500 focus:outline-none"
                  onChange={(e) =>
                    updateTarget(target.id, 'day', e.target.value)
                  }
                  value={target.day}
                >
                  <option value="">日</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              {errors.targets?.[target.id] && (
                <p className="mt-2 text-red-600 text-sm">
                  {errors.targets[target.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          onClick={handleSave}
          type="button"
        >
          保存
        </button>
        {settings && (
          <button
            className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
            onClick={handleCancel}
            type="button"
          >
            キャンセル
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const {
    settings,
    setSettings,
    daysLeft,
    setDaysLeft,
    targetDaysLeft,
    setTargetDaysLeft,
    isEditing,
    setIsEditing,
    isLoading,
    setIsLoading,
    tempYear,
    setTempYear,
    tempMonth,
    setTempMonth,
    tempDay,
    setTempDay,
    tempGender,
    setTempGender,
    tempTargets,
    setTempTargets,
    errors,
    setErrors,
    showResetModal,
    setShowResetModal,
  } = useAppState();

  const { calculateDaysLeft, calculateTargetDaysLeft } = useDateCalculations();
  const { handleEdit: handleEditAction, validateTargets } =
    useSettingsOperations();

  useEffect(() => {
    setIsLoading(true);
    const loadedSettings = loadSettingsFromStorage() || createDefaultSettings();
    saveSettingsToStorage(loadedSettings);
    setSettings(loadedSettings);
    setIsLoading(false);
  }, [setIsLoading, setSettings]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    const days = calculateDaysLeft(settings);
    setDaysLeft(days);

    const targetDays: Record<string, number> = {};
    for (const target of settings.targets) {
      targetDays[target.id] = calculateTargetDaysLeft(target);
    }
    setTargetDaysLeft(targetDays);
  }, [
    settings,
    calculateDaysLeft,
    calculateTargetDaysLeft,
    setDaysLeft,
    setTargetDaysLeft,
  ]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    const interval = setInterval(() => {
      const days = calculateDaysLeft(settings);
      setDaysLeft(days);

      const targetDays: Record<string, number> = {};
      for (const target of settings.targets) {
        targetDays[target.id] = calculateTargetDaysLeft(target);
      }
      setTargetDaysLeft(targetDays);
    }, 1000);

    return () => clearInterval(interval);
  }, [
    settings,
    calculateDaysLeft,
    calculateTargetDaysLeft,
    setDaysLeft,
    setTargetDaysLeft,
  ]);

  const handleEdit = () => {
    handleEditAction(settings, {
      setTempYear,
      setTempMonth,
      setTempDay,
      setTempGender,
      setTempTargets,
      setIsEditing,
    });
  };

  const handleSave = () => {
    const year = Number.parseInt(tempYear, 10);
    const month = Number.parseInt(tempMonth, 10);
    const day = Number.parseInt(tempDay, 10);

    const newErrors: typeof errors = {};
    const birthDateError = validateBirthDate(year, month, day);
    if (birthDateError) {
      newErrors.birthDate = birthDateError;
    }

    const { targetErrors, validTargets } = validateTargets(tempTargets);
    if (Object.keys(targetErrors).length > 0) {
      newErrors.targets = targetErrors;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const newSettings: UserSettings = {
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        gender: tempGender,
        targets: validTargets,
      };

      saveSettingsToStorage(newSettings);
      setSettings(newSettings);
      setIsEditing(false);
      setErrors({});
    }
  };

  const handleCancel = () => {
    if (settings) {
      setIsEditing(false);
      setErrors({});
    }
  };

  const handleResetConfirm = () => {
    localStorage.removeItem('daysLeftSettings');
    const defaultSettings = createDefaultSettings();
    setSettings(defaultSettings);
    setDaysLeft(null);
    setTargetDaysLeft({});
    setTempYear(defaultSettings.birthYear.toString());
    setTempMonth(defaultSettings.birthMonth.toString());
    setTempDay(defaultSettings.birthDay.toString());
    setTempGender(defaultSettings.gender);
    setTempTargets(
      defaultSettings.targets.map((target) => ({
        id: target.id,
        year: target.year.toString(),
        month: target.month.toString(),
        day: target.day.toString(),
        label: target.label,
      }))
    );
    setIsEditing(true);
    setShowResetModal(false);
    setErrors({});
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative flex items-center justify-center py-4">
            <Image
              alt="人生の残り時間アプリのアイコン"
              className="absolute left-0 h-12 w-12 rounded-xl shadow-sm md:h-14 md:w-14"
              height={56}
              src="/icon-192.png"
              width={56}
            />
            <div className="text-center">
              <h1 className="font-bold text-gray-900 text-xl md:text-2xl">
                人生の残り時間
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <p className="text-base text-gray-700 md:text-lg">
            あなたが毎日を大切に過ごすために
            <br />
            意識づけするためのアプリです
          </p>
        </div>

        {!isEditing && settings && daysLeft !== null ? (
          <MainDisplay
            daysLeft={daysLeft}
            handleEdit={handleEdit}
            settings={settings}
            targetDaysLeft={targetDaysLeft}
          />
        ) : (
          <SettingsForm
            errors={errors}
            handleCancel={handleCancel}
            handleSave={handleSave}
            setTempDay={setTempDay}
            setTempGender={setTempGender}
            setTempMonth={setTempMonth}
            setTempTargets={setTempTargets}
            setTempYear={setTempYear}
            settings={settings}
            tempDay={tempDay}
            tempGender={tempGender}
            tempMonth={tempMonth}
            tempTargets={tempTargets}
            tempYear={tempYear}
          />
        )}

        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
              <h3 className="mb-4 font-bold text-gray-900 text-lg">
                設定をリセット
              </h3>
              <p className="mb-6 text-gray-600">
                すべての設定がリセットされます。この操作は元に戻せません。
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-lg bg-red-600 py-3 font-medium text-white transition-colors hover:bg-red-700"
                  onClick={handleResetConfirm}
                  type="button"
                >
                  リセット
                </button>
                <button
                  className="flex-1 rounded-lg bg-gray-600 py-3 font-medium text-white transition-colors hover:bg-gray-700"
                  onClick={handleResetCancel}
                  type="button"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
