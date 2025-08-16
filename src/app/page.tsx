'use client';

import { useCallback, useEffect, useState } from 'react';

interface TargetDate {
  id: string;
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
              year: (parsedObj.targetDate as any).year,
              month: (parsedObj.targetDate as any).month,
              day: (parsedObj.targetDate as any).day,
              label: (parsedObj.targetDate as any).label,
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
    if (parsed.targetDate && !parsed.targets) {
      newSettings.targets = [
        {
          id: 'legacy',
          year: parsed.targetDate.year,
          month: parsed.targetDate.month,
          day: parsed.targetDate.day,
          label: parsed.targetDate.label,
        },
      ];
    } else if (parsed.targets) {
      // 新形式のtargetsがある場合
      newSettings.targets = parsed.targets;
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

  return {
    settings, setSettings,
    daysLeft, setDaysLeft,
    targetDaysLeft, setTargetDaysLeft,
    isEditing, setIsEditing,
    isLoading, setIsLoading,
    activeTab, setActiveTab,
    tempYear, setTempYear,
    tempMonth, setTempMonth,
    tempDay, setTempDay,
    tempGender, setTempGender,
    tempTargets, setTempTargets
  };
}

export default function Home() {
  const {
    settings, setSettings,
    daysLeft, setDaysLeft,
    targetDaysLeft, setTargetDaysLeft,
    isEditing, setIsEditing,
    isLoading, setIsLoading,
    activeTab, setActiveTab,
    tempYear, setTempYear,
    tempMonth, setTempMonth,
    tempDay, setTempDay,
    tempGender, setTempGender,
    tempTargets, setTempTargets
  } = useAppState();

  // 日本人の平均寿命を計算（厚生労働省2023年データ）
  const calculateLifeExpectancy = useCallback(
    (birthYear: number, gender: 'male' | 'female') => {
      // 2024年の日本の平均寿命（厚生労働省最新データ）
      // 男性: 81.09歳、女性: 87.13歳
      const baseMaleLifeExpectancy = 81.09;
      const baseFemaleLifeExpectancy = 87.13;

      // 出生年による調整（医療技術の向上により年々延びている傾向）
      const baseYear = 2024;
      const yearDifference = baseYear - birthYear;

      // 1年につき約0.2歳ずつ短くなる（過去）または長くなる（未来）傾向
      const yearAdjustment = -yearDifference * 0.2;

      const baseExpectancy =
        gender === 'male' ? baseMaleLifeExpectancy : baseFemaleLifeExpectancy;
      const adjustedExpectancy = baseExpectancy + yearAdjustment;

      // 現実的な範囲に制限（65〜95歳）
      return Math.max(
        65,
        Math.min(95, Math.round(adjustedExpectancy * 10) / 10)
      );
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
          localStorage.setItem('daysLeftSettings', JSON.stringify(convertedSettings));
          setSettings(convertedSettings);
        } else {
          localStorage.removeItem('daysLeftSettings');
          setIsEditing(true);
        }
      } catch (_e) {
        localStorage.removeItem('daysLeftSettings');
        setIsEditing(true);
      }
    } else {
      setIsEditing(true);
    }
    
    setIsLoading(false);
  }, []);

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
  }, [settings, calculateDaysLeft, calculateTargetDaysLeft]);

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
  }, [settings, calculateDaysLeft, calculateTargetDaysLeft]);

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
      setTempYear((today.getFullYear() - 30).toString());
      setTempMonth('1');
      setTempDay('1');
      setTempGender('male');
      setTempTargets([]);
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

  const handleSave = () => {
    const year = Number.parseInt(tempYear, 10);
    const month = Number.parseInt(tempMonth, 10);
    const day = Number.parseInt(tempDay, 10);

    if (
      year &&
      month &&
      day &&
      year > 1900 &&
      year < 2100 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      // 有効な目標日のみをフィルタリング
      const validTargets: TargetDate[] = tempTargets
        .filter(
          (target) =>
            target.year && target.month && target.day && target.label.trim()
        )
        .map((target) => ({
          id: target.id,
          year: Number.parseInt(target.year, 10),
          month: Number.parseInt(target.month, 10),
          day: Number.parseInt(target.day, 10),
          label: target.label.trim(),
        }));

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
    }
  };

  const handleCancel = () => {
    if (settings) {
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('daysLeftSettings');
    setSettings(null);
    setDaysLeft(null);
    setTargetDaysLeft({});
    setTempYear('');
    setTempMonth('');
    setTempDay('');
    setTempGender('male');
    setTempTargets([]);
    setActiveTab('life');
    setIsEditing(true);
  };

  // 年のオプション生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
  const futureYears = Array.from({ length: 30 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // 表示する日数
  const currentTarget =
    activeTab !== 'life' && settings
      ? settings.targets.find((t) => t.id === activeTab)
      : null;
  const displayDays =
    activeTab === 'life' ? daysLeft : targetDaysLeft[activeTab];

  // 進捗率の計算
  const progressPercentage =
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
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
            {/* タブ切り替え */}
            {settings.targets.length > 0 && (
              <div className="mb-6 flex justify-center">
                <div className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
                  <button
                    className={`rounded-md px-4 py-2 font-medium transition-colors ${
                      activeTab === 'life'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      setActiveTab('life');
                    }}
                    type="button"
                  >
                    人生の残り
                  </button>
                  {settings.targets.map((target) => (
                    <button
                      className={`rounded-md px-4 py-2 font-medium transition-colors ${
                        activeTab === target.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      key={target.id}
                      onClick={() => setActiveTab(target.id)}
                      type="button"
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* メインカード */}
            <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
              {/* 残り日数表示 */}
              <div className="mb-8 text-center">
                <div className="mb-2">
                  <span className="text-gray-500 text-sm">
                    {activeTab !== 'life' &&
                    displayDays !== null &&
                    displayDays !== undefined &&
                    displayDays < 0
                      ? '経過'
                      : 'あと'}
                  </span>
                </div>
                <div className="font-bold text-6xl text-gray-900 tabular-nums md:text-7xl lg:text-8xl">
                  {displayDays !== null && displayDays !== undefined
                    ? Math.abs(displayDays).toLocaleString()
                    : '---'}
                </div>
                <div className="mt-2 text-2xl text-gray-700 md:text-3xl">
                  日
                </div>
              </div>

              {/* プログレスバー（人生タブの時のみ） */}
              {activeTab === 'life' && (
                <div className="mb-6">
                  <div className="mb-2 flex justify-between text-gray-600 text-sm">
                    <span>0歳</span>
                    <span className="font-medium">
                      {progressPercentage.toFixed(1)}% 経過
                    </span>
                    <span>
                      {calculateLifeExpectancy(
                        settings.birthYear,
                        settings.gender
                      ).toFixed(0)}
                      歳
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 設定情報 */}
              <div className="text-center text-gray-600 text-sm">
                {activeTab === 'life'
                  ? `${settings.birthYear}年${settings.birthMonth}月${settings.birthDay}日生まれ・${settings.gender === 'male' ? '男性' : '女性'}・平均寿命${calculateLifeExpectancy(settings.birthYear, settings.gender).toFixed(1)}歳`
                  : currentTarget &&
                    `${currentTarget.year}年${currentTarget.month}月${currentTarget.day}日 - ${currentTarget.label}`}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
                onClick={handleEdit}
                type="button"
              >
                設定を変更
              </button>
              <button
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                onClick={handleReset}
                type="button"
              >
                リセット
              </button>
            </div>
          </div>
        ) : (
          /* 編集モード */
          <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
            <h2 className="mb-8 text-center font-bold text-2xl text-gray-900">
              あなたの情報を入力
            </h2>

            {/* 生年月日と性別入力 */}
            <div className="mb-8 space-y-6">
              <div>
                <div className="mb-3 block font-medium text-gray-700 text-sm">
                  生年月日
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <select
                      className="w-full rounded-lg border-2 border-gray-300 px-3 py-3 text-center font-medium text-lg focus:border-blue-500 focus:outline-none"
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
                      className="w-full rounded-lg border-2 border-gray-300 px-3 py-3 text-center font-medium text-lg focus:border-blue-500 focus:outline-none"
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
                      className="w-full rounded-lg border-2 border-gray-300 px-3 py-3 text-center font-medium text-lg focus:border-blue-500 focus:outline-none"
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
              </div>

              {/* 性別選択 */}
              <div>
                <div className="mb-3 block font-medium text-gray-700 text-sm">
                  性別
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                          目標 #{target.id.split('-')[1]}
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
            <div className="flex gap-3">
              {settings && (
                <button
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  onClick={handleCancel}
                  type="button"
                >
                  キャンセル
                </button>
              )}
              <button
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
    </main>
  );
}
