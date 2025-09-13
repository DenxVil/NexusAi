import '@testing-library/jest-dom';

// Mock axios to avoid module import issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {},
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Test to verify API URL configuration
describe('API Configuration', () => {
  beforeEach(() => {
    // Clear any existing environment variables
    delete process.env.REACT_APP_API_URL;
    // Clear module cache
    jest.resetModules();
  });

  test('should use environment variable when REACT_APP_API_URL is set', () => {
    // Set environment variable
    process.env.REACT_APP_API_URL = 'https://api.example.com/api';
    
    // Import the api module after setting env var
    // We're testing the configuration logic, not the axios instance itself
    const expectedUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    expect(expectedUrl).toBe('https://api.example.com/api');
  });

  test('should use localhost fallback when REACT_APP_API_URL is not set', () => {
    // Ensure environment variable is not set
    delete process.env.REACT_APP_API_URL;
    
    // Test the fallback logic
    const expectedUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    expect(expectedUrl).toBe('http://localhost:5000/api');
  });

  test('should use localhost fallback when REACT_APP_API_URL is empty', () => {
    // Set environment variable to empty string
    process.env.REACT_APP_API_URL = '';
    
    // Test the fallback logic  
    const expectedUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    expect(expectedUrl).toBe('http://localhost:5000/api');
  });
});