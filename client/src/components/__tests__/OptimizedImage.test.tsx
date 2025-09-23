import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// TODO: Implement OptimizedImage component
// import OptimizedImage from '../OptimizedImage';

describe.skip('OptimizedImage', () => {
  it('renders image with correct attributes', () => {
    const props = {
      src: 'test-image.jpg',
      alt: 'Test image',
      className: 'test-class',
    };

    // render(<OptimizedImage {...props} />);

    // const img = screen.getByRole('img');
    // expect(img).toBeInTheDocument();
    // expect(img).toHaveAttribute('alt', 'Test image');
    // expect(img).toHaveClass('test-class');
  });

  it('transforms Supabase Storage URLs correctly', () => {
    const supabaseUrl = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/test.jpg';

    // render(
    //   <OptimizedImage
    //     src={supabaseUrl}
    //     alt="Test"
    //     width={300}
    //     height={200}
    //   />
    // );

    // const img = screen.getByRole('img');
    // // Supabase uses render endpoint for transformations
    // expect(img.getAttribute('src')).toContain('/storage/v1/render/image/public/');
    // expect(img.getAttribute('src')).toContain('width=300');
    // expect(img.getAttribute('src')).toContain('height=200');
  });

  it('handles non-Supabase URLs without transformation', () => {
    const regularUrl = 'https://example.com/image.jpg';

    // render(<OptimizedImage src={regularUrl} alt="Test" />);

    // const img = screen.getByRole('img');
    // expect(img.getAttribute('src')).toBe(regularUrl);
  });

  it('provides WebP support via picture element', () => {
    const supabaseUrl = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/images/test.jpg';

    // render(<OptimizedImage src={supabaseUrl} alt="Test" />);

    // const picture = screen.getByRole('img').closest('picture');
    // expect(picture).toBeInTheDocument();

    // const webpSource = picture?.querySelector('source[type="image/webp"]');
    // expect(webpSource).toBeInTheDocument();
  });
});