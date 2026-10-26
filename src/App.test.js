import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Azure IoT Hub Telemetry Dashboard', () => {
  render(<App />);
  const titleElement = screen.getByText(/Azure IoT Hub Telemetry Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});
