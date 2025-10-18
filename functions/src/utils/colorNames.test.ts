import { describe, it, expect } from 'vitest';
import { getColorName, formatColorForAI } from './colorNames';

describe('Color Name Detection', () => {
  describe('getColorName', () => {
    it('should detect common color names from hex codes', () => {
      expect(getColorName('#3b82f6')).toBe('blue'); // Tailwind blue-500 (default)
      expect(getColorName('#ef4444')).toBe('red'); // Tailwind red-500
      expect(getColorName('#22c55e')).toBe('green'); // Tailwind green-500
      expect(getColorName('#eab308')).toBe('yellow'); // Tailwind yellow-500
      expect(getColorName('#a855f7')).toBe('purple'); // Tailwind purple-500
      expect(getColorName('#ec4899')).toBe('pink'); // Tailwind pink-500
      expect(getColorName('#f97316')).toBe('orange'); // Tailwind orange-500
    });

    it('should detect pure colors', () => {
      expect(getColorName('#FF0000')).toBe('red');
      expect(getColorName('#00FF00')).toBe('green');
      expect(getColorName('#0000FF')).toBe('blue');
      expect(getColorName('#FFFF00')).toBe('yellow');
      expect(getColorName('#FF00FF')).toBe('magenta');
      expect(getColorName('#00FFFF')).toBe('cyan');
      expect(getColorName('#000000')).toBe('black');
      expect(getColorName('#FFFFFF')).toBe('white');
    });

    it('should handle 3-digit hex codes', () => {
      expect(getColorName('#F00')).toBe('red');
      expect(getColorName('#0F0')).toBe('green');
      expect(getColorName('#00F')).toBe('blue');
    });

    it('should handle hex codes without # prefix', () => {
      expect(getColorName('3b82f6')).toBe('blue');
      expect(getColorName('ef4444')).toBe('red');
    });

    it('should return null for invalid hex codes', () => {
      expect(getColorName('invalid')).toBe(null);
      expect(getColorName('GGGGGG')).toBe(null);
      expect(getColorName('')).toBe(null);
    });

    it('should return null for colors too far from any mapping', () => {
      // A very specific shade that doesn't match common colors
      expect(getColorName('#1a2b3c')).toBe(null);
    });
  });

  describe('formatColorForAI', () => {
    it('should format colors with names', () => {
      expect(formatColorForAI('#3b82f6')).toBe('blue (#3b82f6)');
      expect(formatColorForAI('#ef4444')).toBe('red (#ef4444)');
      expect(formatColorForAI('#22c55e')).toBe('green (#22c55e)');
    });

    it('should return just hex for unknown colors', () => {
      expect(formatColorForAI('#1a2b3c')).toBe('#1a2b3c');
    });

    it('should handle various hex formats', () => {
      expect(formatColorForAI('#F00')).toBe('red (#F00)');
      expect(formatColorForAI('3b82f6')).toBe('blue (3b82f6)');
    });
  });
});


