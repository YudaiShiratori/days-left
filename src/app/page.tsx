'use client';

import { Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface UserSettings {
  birthDate: string;
  lifeExpectancy: number;
}

function DaysLeftCard() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculateDaysLeft = useCallback((userSettings: UserSettings) => {
    const birthDate = new Date(userSettings.birthDate);
    const today = new Date();
    const expectedDeathDate = new Date(birthDate);
    expectedDeathDate.setFullYear(
      birthDate.getFullYear() + userSettings.lifeExpectancy
    );

    const timeDiff = expectedDeathDate.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    setDaysLeft(Math.max(0, days));
  }, []);

  useEffect(() => {
    const loadSettings = () => {
      setIsLoading(true);
      const savedSettings = localStorage.getItem('daysLeftSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as UserSettings;
        setSettings(parsed);
        calculateDaysLeft(parsed);
      }
      setIsLoading(false);
    };

    loadSettings();
  }, [calculateDaysLeft]);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm md:p-12">
        <div className="space-y-6 text-center">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-cyan-500/10" />
          <div className="h-8 animate-pulse rounded-lg bg-slate-700/50" />
          <div className="mx-auto h-4 max-w-xs animate-pulse rounded bg-slate-700/30" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 text-center backdrop-blur-sm md:p-12">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl" />

        <div className="relative z-10 space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
            <span className="text-4xl">⏳</span>
          </div>

          <div className="space-y-4">
            <h2 className="font-bold text-2xl text-white md:text-3xl">
              まず設定から始めましょう
            </h2>
            <p className="text-lg text-slate-300">
              生年月日と予想寿命を入力して
              <br />
              あなたの人生時計をスタートします
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm md:p-12">
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400/10 to-blue-400/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-400/5 to-cyan-400/5 blur-2xl" />

      <div className="relative z-10 space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">
            <span className="font-medium text-cyan-300 text-sm">残り時間</span>
          </div>

          <div className="space-y-2">
            <output
              aria-label={`人生の残り時間は${daysLeft?.toLocaleString() || '---'}日です`}
              className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text font-black text-6xl text-transparent tabular-nums tracking-tight drop-shadow-sm md:text-8xl lg:text-9xl"
            >
              {daysLeft?.toLocaleString() || '---'}
            </output>
            <p className="font-light text-3xl text-slate-300 md:text-4xl">
              日間
            </p>
          </div>
        </div>

        <div className="space-y-4 border-slate-700/50 border-t pt-6">
          <p className="text-lg text-slate-400">
            {settings.lifeExpectancy}歳まで生きると想定
          </p>
          <div className="flex justify-center">
            <div className="inline-flex items-center space-x-2 rounded-full bg-slate-700/30 px-4 py-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-slate-300 text-sm">リアルタイム更新中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LifeProgressCard() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [currentAge, setCurrentAge] = useState<number | null>(null);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const savedSettings = localStorage.getItem('daysLeftSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as UserSettings;
      setSettings(parsed);

      const birthDate = new Date(parsed.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const calculatedAge =
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;

      setCurrentAge(calculatedAge);
      const calc = Math.max(
        0,
        Math.min(100, (calculatedAge / parsed.lifeExpectancy) * 100)
      );
      setPercentage(calc);
    }
  }, []);

  if (!settings || currentAge === null) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="h-6 animate-pulse rounded bg-slate-700/50" />
          <div className="h-4 animate-pulse rounded bg-slate-700/30" />
          <div className="h-2 animate-pulse rounded bg-slate-700/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50">
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-orange-400/5 blur-2xl" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">人生の歩み</h3>
          <div className="text-2xl">🚶‍♂️</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-slate-400">現在の年齢</span>
            <span className="font-bold text-2xl text-white">
              {currentAge}歳
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">0歳</span>
            <span className="text-slate-400">{settings.lifeExpectancy}歳</span>
          </div>

          <div className="relative h-3 overflow-hidden rounded-full bg-slate-700/50">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-orange-500 transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full w-2 rounded-full bg-white/50 blur-sm"
              style={{ left: `${Math.max(0, percentage - 1)}%` }}
            />
          </div>

          <div className="text-center">
            <span className="font-semibold text-slate-300 text-xl">
              {percentage.toFixed(1)}%
            </span>
            <span className="block text-slate-400 text-sm">
              の人生を歩みました
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MotivationCard() {
  const [message, setMessage] = useState<string>('');
  const [timeBasedGreeting, setTimeBasedGreeting] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('✨');

  // 時間帯別のグリーティング設定
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 6) {
      setTimeBasedGreeting('深夜の静寂な時間');
      setEmoji('🌙');
    } else if (hour < 12) {
      setTimeBasedGreeting('新しい朝の始まり');
      setEmoji('🌅');
    } else if (hour < 18) {
      setTimeBasedGreeting('充実した午後');
      setEmoji('☀️');
    } else {
      setTimeBasedGreeting('一日の終わりに');
      setEmoji('🌆');
    }
  }, []);

  // メッセージの設定
  useEffect(() => {
    const savedSettings = localStorage.getItem('daysLeftSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const birthDate = new Date(settings.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const percentage = (age / settings.lifeExpectancy) * 100;

      if (percentage < 25) {
        setMessage(
          'まだ見ぬ可能性が無限に広がっています。今日という日を大切に過ごしましょう。'
        );
      } else if (percentage < 50) {
        setMessage(
          '経験を重ね、より深い人生を歩んでいます。今の瞬間を味わいましょう。'
        );
      } else if (percentage < 75) {
        setMessage(
          '豊かな経験と知恵を持つあなた。その価値ある時間を大切にしましょう。'
        );
      } else {
        setMessage(
          '人生の集大成の時。一日一日を丁寧に、心を込めて過ごしましょう。'
        );
      }
    } else {
      const inspirationalMessages = [
        '今日という日は、残りの人生の最初の日です。',
        '時間は誰にでも平等に与えられた、最も貴重な贈り物です。',
        '過去は歴史、未来は謎、今日は贈り物。だから「Present」と呼ばれます。',
        '限りあるからこそ、人生は美しく意味深いものになります。',
        'この瞬間を大切に。すべての始まりは「今」からです。',
      ];
      const randomIndex = Math.floor(
        Math.random() * inspirationalMessages.length
      );
      const randomMessage = inspirationalMessages[randomIndex];
      if (randomMessage) {
        setMessage(randomMessage);
      }
    }
  }, []);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-600/50">
      <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl transition-all duration-500 group-hover:bg-cyan-400/10" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">今日への想い</h3>
          <div className="text-2xl">{emoji}</div>
        </div>

        <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">
          <span className="font-medium text-cyan-300 text-sm">
            {timeBasedGreeting}
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-slate-200 leading-relaxed">{message}</p>
        </div>

        <div className="border-slate-700/50 border-t pt-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                style={{ animationDelay: '0s', animationDuration: '2s' }}
              />
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                style={{ animationDelay: '0.3s', animationDuration: '2s' }}
              />
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                style={{ animationDelay: '0.6s', animationDuration: '2s' }}
              />
            </div>
            <span className="font-medium text-cyan-300 text-sm">
              今を大切に
            </span>
            <div className="flex space-x-1">
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                style={{ animationDelay: '0.9s', animationDuration: '2s' }}
              />
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                style={{ animationDelay: '1.2s', animationDuration: '2s' }}
              />
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                style={{ animationDelay: '1.5s', animationDuration: '2s' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsButton() {
  const [showModal, setShowModal] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [lifeExpectancy, setLifeExpectancy] = useState(80);

  useEffect(() => {
    const savedSettings = localStorage.getItem('daysLeftSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as UserSettings;
      setBirthDate(parsed.birthDate);
      setLifeExpectancy(parsed.lifeExpectancy);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const firstInput = document.getElementById('birthDate');
        firstInput?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  const handleSave = () => {
    if (birthDate) {
      const settings: UserSettings = { birthDate, lifeExpectancy };
      localStorage.setItem('daysLeftSettings', JSON.stringify(settings));
      setShowModal(false);
      window.location.reload();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleBackdropClick(e);
    }
  };

  return (
    <>
      <button
        aria-label="設定を開く"
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 font-semibold text-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/25 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-400/50 active:scale-95"
        onClick={() => setShowModal(true)}
        type="button"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-center gap-3">
          <Settings
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:rotate-90"
            size={22}
          />
          <span>設定する</span>
          <div className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
        </div>
      </button>

      {showModal && (
        <button
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
          onKeyDown={handleBackdropKeyDown}
          type="button"
        >
          <div
            aria-labelledby="settings-title"
            aria-modal="true"
            className="relative w-full max-w-md animate-fade-in rounded-3xl border border-slate-600/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-8 shadow-2xl backdrop-blur-xl"
            role="dialog"
          >
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl" />

            <div className="relative z-10">
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
                  <Settings className="text-cyan-400" size={24} />
                </div>
                <h2
                  className="font-bold text-2xl text-white"
                  id="settings-title"
                >
                  人生時計の設定
                </h2>
                <p className="mt-2 text-slate-400 text-sm">
                  あなたの時間を正確に計測するための設定
                </p>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label
                    className="flex items-center gap-2 font-medium text-sm text-white"
                    htmlFor="birthDate"
                  >
                    <span className="text-lg">📅</span>
                    生年月日
                  </label>
                  <input
                    aria-describedby="birthDate-help"
                    className="w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-4 text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-200 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    id="birthDate"
                    onChange={(e) => setBirthDate(e.target.value)}
                    type="date"
                    value={birthDate}
                  />
                  <p
                    className="text-slate-400 text-xs leading-relaxed"
                    id="birthDate-help"
                  >
                    あなたの生まれた日を正確に入力してください
                  </p>
                </div>

                <div className="space-y-4">
                  <label
                    className="flex items-center gap-2 font-medium text-sm text-white"
                    htmlFor="lifeExpectancy"
                  >
                    <span className="text-lg">🎯</span>
                    目標寿命: {lifeExpectancy}歳
                  </label>

                  <div className="relative">
                    <input
                      aria-describedby="lifeExpectancy-help"
                      className="slider-modern h-3 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-slate-600 to-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-400/20"
                      id="lifeExpectancy"
                      max="120"
                      min="60"
                      onChange={(e) =>
                        setLifeExpectancy(Number(e.target.value))
                      }
                      type="range"
                      value={lifeExpectancy}
                    />
                    <div className="mt-2 flex justify-between text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-green-400" />
                        60歳
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-orange-400" />
                        120歳
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3 text-center">
                    <span className="font-semibold text-cyan-300 text-lg">
                      {lifeExpectancy}歳
                    </span>
                    <p className="mt-1 text-slate-400 text-xs">
                      まで生きることを目標に
                    </p>
                  </div>

                  <p
                    className="text-slate-400 text-xs leading-relaxed"
                    id="lifeExpectancy-help"
                  >
                    あなたが目指したい年齢を設定してください
                  </p>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  className="flex-1 rounded-xl border border-slate-600/50 bg-slate-700/30 px-6 py-4 font-medium text-slate-300 backdrop-blur-sm transition-all duration-200 hover:bg-slate-600/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                  onClick={() => setShowModal(false)}
                  type="button"
                >
                  キャンセル
                </button>
                <button
                  aria-describedby={
                    birthDate ? undefined : 'save-disabled-help'
                  }
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/25 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                  disabled={!birthDate}
                  onClick={handleSave}
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-center justify-center gap-2">
                    <span>時計をスタート</span>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white/80" />
                  </div>
                </button>
                {!birthDate && (
                  <span className="sr-only" id="save-disabled-help">
                    保存するには生年月日を入力してください
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      )}
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="container mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-8">
        <div className="mb-12 space-y-6 text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
            <span className="font-medium text-cyan-300 text-sm">
              人生をもっと大切に
            </span>
          </div>

          <h1 className="bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text font-bold text-4xl text-transparent leading-tight md:text-6xl lg:text-7xl">
            あなたの人生の
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              残された時間
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-300 leading-relaxed md:text-xl">
            毎日を意味あるものにするために、
            <br className="hidden sm:block" />
            限られた時間を可視化します
          </p>
        </div>

        <div className="mb-12 grid gap-8 md:gap-12">
          <DaysLeftCard />
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <LifeProgressCard />
          <MotivationCard />
        </div>

        <div className="text-center">
          <SettingsButton />
        </div>
      </div>
    </main>
  );
}
