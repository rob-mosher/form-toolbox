// __tests__/web/common/FormDetails.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';

import FormDetails from '../../../../src/web/src/common/FormDetails';

describe('FormDetails component', () => {
  const mockForm = {
    name: 'Sample Form',
    description: 'This is a test form',
    // Add other mock data that represents your Form type
  };

  it('renders the form details correctly', () => {
    render(<FormDetails form={mockForm} />);

    Object.entries(mockForm).forEach(([key, value]) => {
      expect(screen.getByText(`${key}:`)).toBeInTheDocument();
      expect(screen.getByText(JSON.stringify(value))).toBeInTheDocument();
    });
  });
});
