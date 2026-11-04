import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HUB_CONFIG_FILE = path.resolve(__dirname, '../data/hub_config.json');

export const DEFAULT_HUB_CONFIG = Object.freeze({
  name: 'SMART ROUTE Central Bus Hub',
  line1: 'SMART ROUTE Central Bus Hub',
  line2: 'Palakkad – Ukkadam Highway',
  line3: 'K.G. Chavadi, Coimbatore – 641105',
  line4: 'Tamil Nadu, India.',
  formattedAddress: 'SMART ROUTE Central Bus Hub, Palakkad – Ukkadam Highway, K.G. Chavadi, Coimbatore – 641105, Tamil Nadu, India.',
  landmark: 'K.G. Chavadi',
  highway: 'Palakkad – Ukkadam Highway',
  city: 'Coimbatore',
  pincode: '641105',
  state: 'Tamil Nadu',
  country: 'India',
  helpline: '+91 8072065549',
  email: 'support@smartroutebooking.com',
  isVerifiedLocation: false,
  verifiedLocationNotice: 'Designated central operations hub address. Premises ownership and physical boarding bay status are subject to independent operational verification.',
});

let currentHubConfig = { ...DEFAULT_HUB_CONFIG };

export function loadHubConfig() {
  try {
    if (fs.existsSync(HUB_CONFIG_FILE)) {
      const raw = fs.readFileSync(HUB_CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      currentHubConfig = { ...DEFAULT_HUB_CONFIG, ...data };
      return currentHubConfig;
    }
  } catch (err) {
    logger.warn('Failed to load hub_config.json, using default hub config:', err.message);
  }
  return currentHubConfig;
}

export function saveHubConfig(newConfig) {
  try {
    const dataDir = path.dirname(HUB_CONFIG_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const line1 = newConfig.line1 || currentHubConfig.line1;
    const line2 = newConfig.line2 || currentHubConfig.line2;
    const line3 = newConfig.line3 || currentHubConfig.line3;
    const line4 = newConfig.line4 || currentHubConfig.line4;

    currentHubConfig = {
      ...currentHubConfig,
      ...newConfig,
      line1,
      line2,
      line3,
      line4,
      formattedAddress: newConfig.formattedAddress || `${line1}, ${line2}, ${line3}, ${line4}`,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(HUB_CONFIG_FILE, JSON.stringify(currentHubConfig, null, 2), 'utf-8');
    return currentHubConfig;
  } catch (err) {
    logger.error('Failed to save hub_config.json:', err);
    throw err;
  }
}

export function getHubConfig() {
  return currentHubConfig;
}

// Initial load
loadHubConfig();
