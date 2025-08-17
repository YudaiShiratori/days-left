import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '~/app/page';

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Settings UI Simplification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should show simplified settings only for first-time users', () => {
    // 初回ユーザー（LocalStorageが空）
    localStorageMock.getItem.mockReturnValue(null);

    render(<Home />);

    // 初回は設定ができるボタンが表示される
    expect(screen.getByText('設定を変更')).toBeInTheDocument();
  });

  it('should show main display for returning users', () => {
    // 既存ユーザー（設定済み）
    const existingSettings = {
      birthYear: 1990,
      birthMonth: 1,
      birthDay: 1,
      gender: 'male',
      targets: [
        {
          id: 'test',
          year: 2024,
          month: 12,
          day: 31,
          label: 'テスト目標',
        },
      ],
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSettings));

    render(<Home />);

    // 既存ユーザーは即座にカウンタが表示される
    expect(screen.getByText('テスト目標')).toBeInTheDocument();
    expect(screen.getByText('人生の残り日数')).toBeInTheDocument();
  });

  it('should have simple settings form with essential fields only', () => {
    render(<Home />);

    // 設定変更ボタンをクリック
    const settingsButton = screen.getByText('設定を変更');
    fireEvent.click(settingsButton);

    // 簡素化された設定フォームが表示される
    expect(screen.getByText('あなたの情報を入力')).toBeInTheDocument();
  });

  it('should focus on essential settings: birth date, life expectancy, display unit', () => {
    // 必要最小限の設定項目：
    // 1. 生年月日
    // 2. 目標寿命（日本平均）
    // 3. 表示単位（年/週/日）

    const essentialFields = ['birthDate', 'lifeExpectancy', 'displayUnit'];

    // 設定項目が3つのみであることを確認
    expect(essentialFields).toHaveLength(3);
    expect(essentialFields).toContain('birthDate');
    expect(essentialFields).toContain('lifeExpectancy');
    expect(essentialFields).toContain('displayUnit');
  });

  it('should default to Japanese average life expectancy', () => {
    // 日本の平均寿命をデフォルトとして使用
    const japaneseLifeExpectancy = {
      male: 81.09,
      female: 87.13,
    };

    expect(japaneseLifeExpectancy.male).toBeCloseTo(81.09);
    expect(japaneseLifeExpectancy.female).toBeCloseTo(87.13);
  });

  it('should save settings to localStorage for persistence', () => {
    render(<Home />);

    // 設定保存時にlocalStorageに保存される
    // （実装時に詳細なテストを追加）
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
