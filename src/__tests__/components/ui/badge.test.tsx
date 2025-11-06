import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  it('should render badge with text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { container } = render(<Badge variant="destructive">Danger</Badge>);
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Badge className="custom-badge">Custom</Badge>);
    expect(container.querySelector('.custom-badge')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    render(
      <>
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
      </>
    );
    
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
    expect(screen.getByText('Outline')).toBeInTheDocument();
  });
});
