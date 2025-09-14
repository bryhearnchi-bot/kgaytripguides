import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OptimizedImage from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('renders image with correct attributes', () => {
    const props = {
      src: 'test-image.jpg',
      alt: 'Test image',
      className: 'test-class',
    };

    render(<OptimizedImage {...props} />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Test image');
    expect(img).toHaveClass('test-class');
  });

  it('transforms Cloudinary URLs correctly', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1234/test.jpg';

    render(
      <OptimizedImage
        src={cloudinaryUrl}
        alt="Test"
        width={300}
        height={200}
      />
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('w_300,h_200,c_fill,f_auto,q_auto');
  });

  it('handles non-Cloudinary URLs without transformation', () => {
    const regularUrl = 'https://example.com/image.jpg';

    render(<OptimizedImage src={regularUrl} alt="Test" />);

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe(regularUrl);
  });

  it('provides WebP support via picture element', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1234/test.jpg';

    render(<OptimizedImage src={cloudinaryUrl} alt="Test" />);

    const picture = screen.getByRole('img').closest('picture');
    expect(picture).toBeInTheDocument();

    const webpSource = picture?.querySelector('source[type="image/webp"]');
    expect(webpSource).toBeInTheDocument();
  });
});