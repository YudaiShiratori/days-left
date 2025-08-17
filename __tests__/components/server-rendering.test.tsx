import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '~/app/page';

describe('Server Side Rendering', () => {
  it('should render meaningful content without JavaScript', () => {
    // Server Component として意味のあるコンテンツが表示される
    render(<Home />);

    // 基本的な説明文が表示される
    expect(screen.getByText(/毎日を大切に過ごすために/)).toBeInTheDocument();

    // デフォルトのコンテンツが表示される
    expect(screen.getByText('今年の終わりまで')).toBeInTheDocument();
    expect(screen.getByText('人生の残り日数')).toBeInTheDocument();
  });

  it('should not show loading screen on initial server render', () => {
    render(<Home />);

    // 初期レンダリング時にローディング画面が表示されない
    expect(
      screen.queryByText('設定を読み込んでいます')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('しばらくお待ちください')
    ).not.toBeInTheDocument();
  });

  it('should provide static UI structure for SEO and accessibility', () => {
    render(<Home />);

    // 静的なUI構造が提供される
    expect(screen.getByRole('main')).toBeInTheDocument();

    // アクセシビリティ属性が適切に設定される
    expect(screen.getAllByRole('status')).toHaveLength(2); // 2つのカウンター

    // aria-live属性が設定される
    const statusElements = screen.getAllByRole('status');
    statusElements.forEach((element) => {
      expect(element).toHaveAttribute('aria-live', 'polite');
    });
  });
});
