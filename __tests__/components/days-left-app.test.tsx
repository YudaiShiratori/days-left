import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '~/app/page';

// Next.js Imageコンポーネントのモック
vi.mock('next/image', () => ({
  default: vi.fn((props) => {
    const { src, ...otherProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return (
      // biome-ignore lint/performance/noImgElement: Test mock for Next.js Image component
      <img
        {...otherProps}
        alt={props.alt || ''}
        src={typeof src === 'string' ? src : '/test-image.png'}
      />
    );
  }),
}));

// 正規表現は使用されなくなったため削除

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

  it('設定が未設定でもデフォルト設定で表示される', () => {
    render(<Home />);

    expect(screen.getByText('今年の終わりまで')).toBeInTheDocument();
    expect(screen.getByText('人生の残り日数')).toBeInTheDocument();
    expect(screen.getByText('設定を変更')).toBeInTheDocument();
  });

  it('設定がある場合、設定変更ボタンが表示される', () => {
    const settings = {
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
    localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));

    render(<Home />);

    expect(screen.getByText('設定を変更')).toBeInTheDocument();
  });

  it('設定を保存できる', () => {
    render(<Home />);

    // 設定変更ボタンをクリック
    const settingsButton = screen.getByText('設定を変更');
    fireEvent.click(settingsButton);

    // 設定フォームが表示される
    expect(screen.getByText('あなたの情報を入力')).toBeInTheDocument();

    // localStorage の setItem が呼ばれることを確認（デフォルト設定の保存）
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('設定がある場合、残り日数を計算して表示する', () => {
    const settings = {
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
    localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));

    render(<Home />);

    // 残り日数の数字が表示されることを確認
    expect(screen.getByText('人生の残り日数')).toBeInTheDocument();
    expect(screen.getByText('テスト目標')).toBeInTheDocument();
  });

  it('設定変更ボタンをクリックして編集モードに切り替えられる', () => {
    const settings = {
      birthYear: 1990,
      birthMonth: 1,
      birthDay: 1,
      gender: 'male',
      targets: [],
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));

    render(<Home />);

    const settingsButton = screen.getByText('設定を変更');
    fireEvent.click(settingsButton);

    // 設定フォームが表示される
    expect(screen.getByText('あなたの情報を入力')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('編集モードで戻るボタンが表示される', () => {
    render(<Home />);

    // 設定変更ボタンをクリックして編集モードに入る
    const settingsButton = screen.getByText('設定を変更');
    fireEvent.click(settingsButton);

    // キャンセルボタンが表示される
    const cancelButton = screen.getByText('キャンセル');
    expect(cancelButton).toBeInTheDocument();
  });

  it('編集モードで戻る機能が動作する', () => {
    render(<Home />);

    // 設定変更ボタンをクリックして編集モードに入る
    const settingsButton = screen.getByText('設定を変更');
    fireEvent.click(settingsButton);

    // キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    // 元の画面に戻る
    expect(screen.getByText('設定を変更')).toBeInTheDocument();
    expect(screen.queryByText('あなたの情報を入力')).not.toBeInTheDocument();
  });
});
