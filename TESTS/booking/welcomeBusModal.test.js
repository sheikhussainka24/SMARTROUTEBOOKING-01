import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Welcome / Royal Coach Intro Modal Specifications', () => {
  const filePath = path.resolve(__dirname, '../../FRONTEND/src/components/common/WelcomeBusModal.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Test 1: Verify removal of Top-Right Replay button
  test('Top-right toggle bar keeps only Day/Night switcher and Close ("✕") button without Replay button', () => {
    // Top bar controls should have Day Bus, Night Bus, Close (X)
    expect(content).toContain('Day Bus');
    expect(content).toContain('Night Bus');
    expect(content).toContain('<X size={16} />');

    // Neither Replay button should exist
    expect(content).not.toMatch(/<RotateCcw[^>]*\/>\s*Replay/i);
    expect(content).not.toContain('title="Run bus animation again"');
  });

  // Test 2: Verify removal of Coach Registration badge
  test('"Coach Registration: TN 76 KA 2006" badge is completely removed', () => {
    expect(content).not.toContain('Coach Registration');
    expect(content).not.toContain('TN 76 KA 2006');

    // Remaining badges are retained
    expect(content).toContain('Active 06:00 AM – 06:00 PM');
    expect(content).toContain('Official smartroutebooking.com Flagship');
  });

  // Test 3: Verify single centered "Enter SMART ROUTE" CTA button without extra button box
  test('Bottom action bar center-aligns single "Enter SMART ROUTE" CTA button without extra box', () => {
    expect(content).toContain('Enter SMART ROUTE');
    expect(content).toContain('justifyContent: \'center\'');
    // Ensure no secondary button in bottom action bar
    expect(content).not.toMatch(/className="btn btn-outline"[\s\S]*Replay/);
  });

  // Test 4: Header crown badge text update
  test('Header crown badge contains "👑 A/C and Non-A/C, SEATER & SLEEPER COACHES • LUXURY & COMFORT 👑"', () => {
    expect(content).toMatch(/👑\s*A\/C and Non-A\/C,\s*SEATER &amp; SLEEPER COACHES\s*&bull;\s*LUXURY &amp; COMFORT\s*👑/i);
    expect(content).not.toContain('2+1 A/C SLEEPER COACH');
    expect(content).toContain('Welcome to SMART ROUTE BOOKING');
  });
});
