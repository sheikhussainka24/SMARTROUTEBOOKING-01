import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('UI/UX: Password Autofill & Modal Focus Defense Suite', () => {
  const welcomeModalPath = path.resolve(__dirname, '../../FRONTEND/src/components/common/WelcomeBusModal.jsx');
  const landingPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/LandingPage.jsx');
  const placeAutocompletePath = path.resolve(__dirname, '../../FRONTEND/src/components/common/PlaceAutocomplete.jsx');
  const loginPath = path.resolve(__dirname, '../../FRONTEND/src/pages/auth/Login.jsx');
  const registerPath = path.resolve(__dirname, '../../FRONTEND/src/pages/auth/Register.jsx');
  const ownerRegisterPath = path.resolve(__dirname, '../../FRONTEND/src/pages/owner/OwnerRegister.jsx');

  const welcomeModal = fs.readFileSync(welcomeModalPath, 'utf8');
  const landingPage = fs.readFileSync(landingPagePath, 'utf8');
  const placeAutocomplete = fs.readFileSync(placeAutocompletePath, 'utf8');
  const login = fs.readFileSync(loginPath, 'utf8');
  const register = fs.readFileSync(registerPath, 'utf8');
  const ownerRegister = fs.readFileSync(ownerRegisterPath, 'utf8');

  test('1. Welcome Modal performs activeElement blur on mount to clear background input focus', () => {
    expect(welcomeModal).toContain('document.activeElement.blur()');
    expect(welcomeModal).toMatch(/useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?document\.activeElement\.blur\(\)[\s\S]*?\},\s*\[\s*isOpen\s*\]\s*\)/);
  });

  test('2. Welcome Modal contains zero <input> or <form> elements and sets tabIndex={0} on CTA', () => {
    expect(welcomeModal).not.toMatch(/<input[\s>]/);
    expect(welcomeModal).not.toMatch(/<form[\s>]/);
    expect(welcomeModal).toContain('tabIndex={0}');
    expect(welcomeModal).toContain('tabIndex={-1}');
    expect(welcomeModal).toContain('Enter SMART ROUTE');
  });

  test('3. Entire FRONTEND/src codebase contains zero autoFocus / autofocus attributes on input elements', () => {
    const srcDir = path.resolve(__dirname, '../../FRONTEND/src');
    function scanDir(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(scanDir(fullPath));
        } else if (/\.(jsx?|tsx?)$/.test(file)) {
          const code = fs.readFileSync(fullPath, 'utf8');
          if (/<input[^>]*\b(autoFocus|autofocus)\b/i.test(code)) {
            results.push(fullPath);
          }
        }
      });
      return results;
    }

    const filesWithAutoFocus = scanDir(srcDir);
    expect(filesWithAutoFocus).toEqual([]);
  });

  test('4. LandingPage search form includes dummy trap fields and autoComplete off', () => {
    expect(landingPage).toContain('<form onSubmit={handleSearchSubmit} autoComplete="off">');
    expect(landingPage).toContain('<input type="text" style={{ display: \'none\' }} aria-hidden="true" autoComplete="off" tabIndex={-1} readOnly />');
    expect(landingPage).toContain('<input type="password" style={{ display: \'none\' }} aria-hidden="true" autoComplete="new-password" tabIndex={-1} readOnly />');
  });

  test('5. PlaceAutocomplete input includes modern autofill heuristic disablers', () => {
    expect(placeAutocomplete).toContain('autoComplete="off"');
    expect(placeAutocomplete).toContain('data-lpignore="true"');
    expect(placeAutocomplete).toContain('data-1p-ignore="true"');
    expect(placeAutocomplete).toContain('data-form-type="other"');
  });

  test('6. Login.jsx forms include dummy trap fields and autofill disablers on credentials and password', () => {
    expect(login).toContain('<form onSubmit={handleStep1Submit} autoComplete="off"');
    expect(login).toContain('<form onSubmit={handleStep2Submit} autoComplete="off"');
    expect(login).not.toContain('autoFocus');
    expect(login).toContain('data-lpignore="true"');
    expect(login).toContain('data-1p-ignore="true"');
    expect(login).toContain('autoComplete="new-password"');
  });

  test('7. Register.jsx and OwnerRegister.jsx forms include dummy trap fields and password manager guards', () => {
    expect(register).not.toContain('autoFocus');
    expect(register).toContain('data-lpignore="true"');
    expect(ownerRegister).toContain('data-lpignore="true"');
    expect(ownerRegister).toContain('autoComplete="new-password"');
  });
});
