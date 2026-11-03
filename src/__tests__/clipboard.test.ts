import { copyToClipboard } from '../clipboard';

describe('copyToClipboard', () => {
  it('returns a boolean and does not throw', () => {
    const result = copyToClipboard('breathing-github-profile clipboard probe');
    expect(typeof result).toBe('boolean');
  });
});
