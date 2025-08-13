import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '~/app/page';

// 正規表現をトップレベルで定義
const LIFE_EXPECTANCY_REGEX = /予想寿命:/;
const DAYS_NUMBER_REGEX = /^\d{1,3}(,\d{3})*$/;

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

// location.reloadのモック
Object.defineProperty(window, 'location', {
  value: { reload: vi.fn() },
  writable: true,
});

describe('Days Left App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('設定が未設定の場合、?を表示する', () => {
    render(<Home />);

    expect(screen.getByText('人生の残り日数')).toBeInTheDocument();
    expect(screen.getByLabelText('不明な残り日数')).toBeInTheDocument();
    expect(screen.getByText('設定を入力してください')).toBeInTheDocument();
  });

  it('設定ボタンをクリックしてモーダルを開ける', () => {
    render(<Home />);

    const settingsButton = screen.getByLabelText('設定を開く');
    fireEvent.click(settingsButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('生年月日')).toBeInTheDocument();
    expect(screen.getByLabelText(LIFE_EXPECTANCY_REGEX)).toBeInTheDocument();
  });

  it('設定を保存できる', () => {
    render(<Home />);

    const settingsButton = screen.getByLabelText('設定を開く');
    fireEvent.click(settingsButton);

    const birthDateInput = screen.getByLabelText('生年月日');
    const saveButton = screen.getByText('保存');

    fireEvent.change(birthDateInput, { target: { value: '1990-01-01' } });
    fireEvent.click(saveButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'daysLeftSettings',
      expect.stringContaining('1990-01-01')
    );
  });

  it('設定がある場合、残り日数を計算して表示する', () => {
    const settings = {
      birthDate: '1990-01-01',
      lifeExpectancy: 80,
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));

    render(<Home />);

    // 残り日数の数字が表示されることを確認（具体的な数値は日付に依存するため、パターンで確認）
    expect(screen.getByText(DAYS_NUMBER_REGEX)).toBeInTheDocument();
    expect(screen.getByText('80歳まで生きると仮定')).toBeInTheDocument();
  });

  it('Escapeキーでモーダルを閉じられる', () => {
    render(<Home />);

    const settingsButton = screen.getByLabelText('設定を開く');
    fireEvent.click(settingsButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('生年月日が入力されていない場合、保存ボタンが無効になる', () => {
    render(<Home />);

    const settingsButton = screen.getByLabelText('設定を開く');
    fireEvent.click(settingsButton);

    const saveButton = screen.getByText('保存');
    expect(saveButton).toBeDisabled();
  });

  it('予想寿命のスライダーを操作できる', () => {
    render(<Home />);

    const settingsButton = screen.getByLabelText('設定を開く');
    fireEvent.click(settingsButton);

    const slider = screen.getByLabelText(LIFE_EXPECTANCY_REGEX);
    fireEvent.change(slider, { target: { value: '90' } });

    expect(screen.getByText('予想寿命: 90歳')).toBeInTheDocument();
  });
});
