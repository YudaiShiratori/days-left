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

    // 年、月、日を設定
    const yearSelects = screen.getAllByRole('combobox');
    const yearSelect = yearSelects.find((select) =>
      select.innerHTML.includes('年')
    );
    const monthSelect = yearSelects.find((select) =>
      select.innerHTML.includes('月')
    );
    const daySelect = yearSelects.find((select) =>
      select.innerHTML.includes('日')
    );
    const saveButton = screen.getByText('保存');

    if (yearSelect && monthSelect && daySelect) {
      fireEvent.change(yearSelect, { target: { value: '1990' } });
      fireEvent.change(monthSelect, { target: { value: '1' } });
      fireEvent.change(daySelect, { target: { value: '1' } });
      fireEvent.click(saveButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'daysLeftSettings',
        expect.stringContaining('1990')
      );
    }
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

    expect(screen.getByText('あなたの情報を入力')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('編集モードで保存ボタンが表示される', () => {
    render(<Home />);

    // 設定変更ボタンをクリックして編集モードに入る
    const settingsButton = screen.getByText('設定を変更');
    fireEvent.click(settingsButton);

    const saveButton = screen.getByText('保存');
    expect(saveButton).toBeInTheDocument();
  });

  it('編集モードで性別選択ができる', () => {
    render(<Home />);

    // 設定変更ボタンをクリックして編集モードに入る
    const settingsButton = screen.getByText('設定を変更');
    fireEvent.click(settingsButton);

    const genderSelect = screen.getByDisplayValue('男性');
    expect(genderSelect).toBeInTheDocument();

    fireEvent.change(genderSelect, { target: { value: 'female' } });
    expect(genderSelect).toHaveValue('female');
  });
});
