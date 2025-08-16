'use client';

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
  } = useAppState();

  // 日本人の平均寿命を計算（厚生労働省2024年データ）
  const calculateLifeExpectancy = useCallback(
    (_birthYear: number, gender: 'male' | 'female') => {
      // 2024年の日本の平均寿命（厚生労働省最新データ）
      // 男性: 81.09歳、女性: 87.13歳
      const baseMaleLifeExpectancy = 81.09;
      const baseFemaleLifeExpectancy = 87.13;

      // シンプルに基本寿命を使用（複雑な調整を削除）
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

      // 小数点以下の日数を追加
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

  // 初期化と設定の読み込み
  useEffect(() => {
    setIsLoading(true);
    const savedSettings = localStorage.getItem('daysLeftSettings');

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const convertedSettings = convertLegacySettings(parsed);

        if (convertedSettings) {
          localStorage.setItem(
            'daysLeftSettings',
            JSON.stringify(convertedSettings)
          );
          setSettings(convertedSettings);
        } else {
          localStorage.removeItem('daysLeftSettings');
          // 初回利用時はサンプルデータで設定を自動作成
          const today = new Date();
          const currentYear = today.getFullYear();
          const defaultSettings: UserSettings = {
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
          localStorage.setItem(
            'daysLeftSettings',
            JSON.stringify(defaultSettings)
          );
          setSettings(defaultSettings);
        }
      } catch (_e) {
        localStorage.removeItem('daysLeftSettings');
        // エラー時もサンプルデータで設定を自動作成
        const today = new Date();
        const currentYear = today.getFullYear();
        const defaultSettings: UserSettings = {
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
        localStorage.setItem(
          'daysLeftSettings',
          JSON.stringify(defaultSettings)
        );
        setSettings(defaultSettings);
      }
    } else {
      // 初回利用時はサンプルデータで設定を自動作成
      const today = new Date();
      const currentYear = today.getFullYear();
      const defaultSettings: UserSettings = {
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
      localStorage.setItem('daysLeftSettings', JSON.stringify(defaultSettings));
      setSettings(defaultSettings);
    }

    setIsLoading(false);
  }, [setIsLoading, setSettings]);

  // 設定が更新された時の処理
  useEffect(() => {
    if (!settings) {
      return;
    }

    const days = calculateDaysLeft(settings);
    setDaysLeft(days);

    // 全ての目標日の日数を計算
    const targetDays: Record<string, number> = {};
    for (const target of settings.targets) {
      targetDays[target.id] = calculateTargetDaysLeft(target);
    }
    setTargetDaysLeft(targetDays);

    // アクティブタブの初期設定は削除（ユーザーが手動で選択）
  }, [
    settings,
    calculateDaysLeft,
    calculateTargetDaysLeft,
    setDaysLeft,
    setTargetDaysLeft,
  ]);

  // 1秒ごとに更新
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
    if (settings) {
      setTempYear(settings.birthYear.toString());
      setTempMonth(settings.birthMonth.toString());
      setTempDay(settings.birthDay.toString());
      setTempGender(settings.gender);

      setTempTargets(
        settings.targets.map((target) => ({
          id: target.id,
          year: target.year.toString(),
          month: target.month.toString(),
          day: target.day.toString(),
          label: target.label,
        }))
      );
    } else {
      // デフォルト値を設定
      const today = new Date();
      const currentYear = today.getFullYear();
      setTempYear((today.getFullYear() - 30).toString());
      setTempMonth('1');
      setTempDay('1');
      setTempGender('male');
      // サンプル目標日を初期設定
      setTempTargets([
        {
          id: 'sample-newyear',
          year: currentYear.toString(),
          month: '12',
          day: '31',
          label: '今年の終わりまで',
        },
      ]);
    }
    setIsEditing(true);
  };

  const addNewTarget = () => {
    const newId = `target-${Date.now()}`;
    setTempTargets([
      ...tempTargets,
      {
        id: newId,
        year: '',
        month: '',
        day: '',
        label: '',
      },
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

  const validateDate = (year: number, month: number, day: number) => {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const checkBasicInput = (year: number, month: number, day: number) => {
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
  };

  const validateBirthDate = (year: number, month: number, day: number) => {
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
  };

  const validateTargets = () => {
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

  const handleSave = () => {
    const year = Number.parseInt(tempYear, 10);
    const month = Number.parseInt(tempMonth, 10);
    const day = Number.parseInt(tempDay, 10);

    const newErrors: typeof errors = {};

    // 生年月日のバリデーション
    const birthDateError = validateBirthDate(year, month, day);
    if (birthDateError) {
      newErrors.birthDate = birthDateError;
    }

    // 目標日のバリデーション
    const { targetErrors, validTargets } = validateTargets();
    if (Object.keys(targetErrors).length > 0) {
      newErrors.targets = targetErrors;
    }

    setErrors(newErrors);

    // エラーがない場合のみ保存
    if (Object.keys(newErrors).length === 0) {
      const newSettings: UserSettings = {
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        gender: tempGender,
        targets: validTargets,
      };

      localStorage.setItem('daysLeftSettings', JSON.stringify(newSettings));
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

  const _handleResetClick = () => {
    setShowResetModal(true);
  };

  const handleResetConfirm = () => {
    localStorage.removeItem('daysLeftSettings');
    setSettings(null);
    setDaysLeft(null);
    setTargetDaysLeft({});
    setTempYear('');
    setTempMonth('');
    setTempDay('');
    setTempGender('male');
    // リセット時もサンプル目標日を設定
    const today = new Date();
    const currentYear = today.getFullYear();
    setTempTargets([
      {
        id: 'sample-newyear',
        year: currentYear.toString(),
        month: '12',
        day: '31',
        label: '今年の終わりまで',
      },
    ]);
    setActiveTab('life');
    setIsEditing(true);
    setShowResetModal(false);
    setErrors({});
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
  };

  // 年のオプション生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
  const futureYears = Array.from({ length: 30 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // 表示する日数
  const _currentTarget =
    activeTab !== 'life' && settings
      ? settings.targets.find((t) => t.id === activeTab)
      : null;
  const _displayDays =
    activeTab === 'life' ? daysLeft : targetDaysLeft[activeTab];

  // 進捗率の計算
  const _progressPercentage =
    settings && daysLeft !== null
      ? Math.max(
          0,
          Math.min(
            100,
            ((calculateLifeExpectancy(settings.birthYear, settings.gender) *
              365 -
              daysLeft) /
              (calculateLifeExpectancy(settings.birthYear, settings.gender) *
                365)) *
              100
          )
        )
      : 0;

  if (isLoading) {
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

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* ヘッダー */}
        <header className="mb-8 text-center">
          <h1 className="mb-2 font-bold text-3xl text-gray-900 md:text-4xl">
            人生の残り時間
          </h1>
          <p className="text-gray-600">一日一日を大切に</p>
        </header>

        {/* メインコンテンツ */}
        {!isEditing && settings && daysLeft !== null ? (
          <div className="space-y-8">
            {/* 目標日の残り日数 */}
            {settings.targets.length > 0 && (
              <div className="space-y-8">
                {settings.targets.map((target) => (
                  <div className="mb-8" key={target.id}>
                    <div className="mb-4 text-center">
                      <h2 className="font-bold text-2xl text-gray-900 md:text-3xl">
                        {target.label}
                      </h2>
                    </div>
                    <div className="rounded-3xl bg-blue-900 p-8 shadow-2xl md:p-16">
                      <div className="text-center">
                        <div className="mb-4">
                          <span className="text-2xl text-blue-300 md:text-3xl">
                            {targetDaysLeft[target.id] < 0 ? '経過' : 'あと'}
                          </span>
                        </div>
                        <div className="font-black text-6xl text-white tabular-nums sm:text-7xl md:text-8xl lg:text-9xl">
                          {targetDaysLeft[target.id] !== undefined
                            ? Math.abs(
                                targetDaysLeft[target.id]
                              ).toLocaleString()
                            : '---'}
                        </div>
                        <div className="mt-4 text-3xl text-blue-300 md:text-4xl lg:text-5xl">
                          日
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 人生の残り日数 */}
            <div className="mb-8">
              <div className="mb-4 text-center">
                <h2 className="font-bold text-2xl text-gray-900 md:text-3xl">
                  人生の残り日数
                </h2>
              </div>
              <div className="rounded-3xl bg-slate-900 p-8 shadow-2xl md:p-16">
                <div className="text-center">
                  <div className="mb-4">
                    <span className="text-2xl text-slate-300 md:text-3xl">
                      あと
                    </span>
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

            {/* アクションボタン */}
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
        ) : (
          /* 編集モード */
          <div className="rounded-2xl bg-white p-6 shadow-lg md:p-12">
            <h2 className="mb-6 text-center font-bold text-gray-900 text-xl md:mb-8 md:text-2xl">
              あなたの情報を入力
            </h2>

            {/* 生年月日と性別入力 */}
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
                  <p className="mt-2 text-red-600 text-sm">
                    {errors.birthDate}
                  </p>
                )}
              </div>

              {/* 性別選択 */}
              <div>
                <div className="mb-3 block font-medium text-gray-700 text-sm">
                  性別
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    className={`rounded-lg border-2 px-4 py-3 font-medium transition-colors ${
                      tempGender === 'male'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setTempGender('male')}
                    type="button"
                  >
                    男性
                    <div className="mt-1 text-gray-500 text-xs">
                      平均寿命: 81.09歳
                    </div>
                  </button>
                  <button
                    className={`rounded-lg border-2 px-4 py-3 font-medium transition-colors ${
                      tempGender === 'female'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setTempGender('female')}
                    type="button"
                  >
                    女性
                    <div className="mt-1 text-gray-500 text-xs">
                      平均寿命: 87.13歳
                    </div>
                  </button>
                </div>
                <p className="mt-2 text-gray-500 text-xs">
                  ※ 厚生労働省2024年データに基づく
                </p>
              </div>

              {/* 目標日設定 */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-medium text-gray-700 text-sm">
                    目標日を設定（複数可）
                  </div>
                  <button
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700"
                    onClick={addNewTarget}
                    type="button"
                  >
                    + 目標を追加
                  </button>
                </div>

                <div className="space-y-4">
                  {tempTargets.map((target) => (
                    <div
                      className="space-y-3 rounded-lg bg-blue-50 p-4"
                      key={target.id}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 text-sm">
                          目標
                        </span>
                        <button
                          className="text-red-600 text-sm hover:text-red-800"
                          onClick={() => removeTarget(target.id)}
                          type="button"
                        >
                          削除
                        </button>
                      </div>
                      <input
                        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        onChange={(e) =>
                          updateTarget(target.id, 'label', e.target.value)
                        }
                        placeholder="目標の名前（例：定年退職、卒業、結婚記念日）"
                        type="text"
                        value={target.label}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <select
                            className="w-full rounded-lg border-2 border-gray-300 px-3 py-3 text-center font-medium text-lg focus:border-blue-500 focus:outline-none"
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
                        </div>
                        <div>
                          <select
                            className="w-full rounded-lg border-2 border-gray-300 px-3 py-3 text-center font-medium text-lg focus:border-blue-500 focus:outline-none"
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
                        </div>
                        <div>
                          <select
                            className="w-full rounded-lg border-2 border-gray-300 px-3 py-3 text-center font-medium text-lg focus:border-blue-500 focus:outline-none"
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
                      </div>
                      {errors.targets?.[target.id] && (
                        <p className="mt-2 text-red-600 text-sm">
                          {errors.targets[target.id]}
                        </p>
                      )}
                    </div>
                  ))}

                  {tempTargets.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      「+ 目標を追加」ボタンで目標日を追加できます
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
              {settings && (
                <button
                  className="order-2 rounded-xl border border-gray-300 bg-white px-6 py-4 font-medium text-base text-gray-700 transition-colors hover:bg-gray-50 sm:order-1 sm:flex-1 sm:py-3"
                  onClick={handleCancel}
                  type="button"
                >
                  キャンセル
                </button>
              )}
              <button
                className="order-1 rounded-lg bg-blue-600 px-6 py-4 font-medium text-base text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:order-2 sm:flex-1 sm:py-3"
                disabled={!(tempYear && tempMonth && tempDay)}
                onClick={handleSave}
                type="button"
              >
                計算を開始
              </button>
            </div>
          </div>
        )}
      </div>

      {/* リセット確認モーダル */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 font-bold text-gray-900 text-lg">
              データをリセットしますか？
            </h3>
            <p className="mb-6 text-gray-600 text-sm">
              すべての設定が削除され、元に戻すことはできません。本当にリセットしますか？
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                onClick={handleResetCancel}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
                onClick={handleResetConfirm}
                type="button"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
