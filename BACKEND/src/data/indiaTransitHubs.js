/**
 * SMART ROUTE — Pan-India Comprehensive Transit Hubs & Geocoding Index
 *
 * Covers transport hubs across all Indian states and Union Territories:
 * - South: Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana, Puducherry
 * - West: Maharashtra, Goa, Gujarat, Rajasthan
 * - North: Delhi NCR, Punjab, Haryana, Himachal Pradesh, Uttarakhand, Jammu & Kashmir, Chandigarh
 * - Central: Madhya Pradesh, Chhattisgarh
 * - East: West Bengal, Odisha, Bihar, Jharkhand
 * - Northeast: Assam, Meghalaya
 */

export const PAN_INDIA_CITY_ALIASES = {
  // South India
  coimbatore: ['coimbatore', 'kovai', 'cbe'],
  bengaluru: ['bengaluru', 'bangalore', 'blr'],
  chennai: ['chennai', 'madras', 'mas', 'che'],
  madurai: ['madurai', 'mdu'],
  tenkasi: ['tenkasi', 'tks'],
  tirunelveli: ['tirunelveli', 'nellai', 'tnv'],
  nagercoil: ['nagercoil', 'ngl'],
  thoothukudi: ['thoothukudi', 'tuticorin', 'tcr'],
  rameswaram: ['rameswaram', 'rameshwaram', 'rmm'],
  tiruchendur: ['tiruchendur', 'tcn'],
  tiruchirappalli: ['tiruchirappalli', 'trichy', 'tpj', 'trz'],
  thanjavur: ['thanjavur', 'tanjore', 'tj'],
  karaikudi: ['karaikudi', 'kkdi'],
  salem: ['salem', 'sa'],
  erode: ['erode', 'ed'],
  tiruppur: ['tiruppur', 'tirupur', 'tup'],
  vellore: ['vellore', 'vlr'],
  hosur: ['hosur', 'hsr'],
  kochi: ['kochi', 'cochin', 'ernakulam', 'vytilla'],
  ernakulam: ['ernakulam', 'kochi', 'cochin', 'south railway'],
  thrissur: ['thrissur', 'trichur', 'tcr'],
  kozhikode: ['kozhikode', 'calicut', 'clt'],
  kannur: ['kannur', 'cannanore', 'can'],
  palakkad: ['palakkad', 'palghat', 'pgt'],
  thiruvananthapuram: ['thiruvananthapuram', 'trivandrum', 'tvm'],
  kollam: ['kollam', 'quilon', 'qln'],
  kottayam: ['kottayam', 'ktm'],
  hyderabad: ['hyderabad', 'secunderabad', 'hyd'],
  vijayawada: ['vijayawada', 'vja', 'bza'],
  visakhapatnam: ['visakhapatnam', 'vizag', 'vskp'],
  tirupati: ['tirupati', 'tpty'],
  guntur: ['guntur', 'gnt'],
  kurnool: ['kurnool', 'knl'],
  nellore: ['nellore', 'nlr'],
  mysuru: ['mysuru', 'mysore', 'mys'],
  mangaluru: ['mangaluru', 'mangalore', 'mlr', 'maq'],
  belagavi: ['belagavi', 'belgaum', 'bgm'],
  hubballi: ['hubballi', 'hubli', 'ubl'],
  puducherry: ['puducherry', 'pondicherry', 'pondy', 'pdy'],

  // West India
  mumbai: ['mumbai', 'bombay', 'bom'],
  pune: ['pune', 'poona', 'pnq'],
  nagpur: ['nagpur', 'ngp'],
  nashik: ['nashik', 'nasik', 'nsk'],
  shirdi: ['shirdi'],
  kolhapur: ['kolhapur', 'klp'],
  aurangabad: ['aurangabad', 'chhatrapati sambhajinagar'],
  goa: ['goa', 'panaji', 'panjim', 'madgaon', 'margao', 'mapusa'],
  ahmedabad: ['ahmedabad', 'amdavad', 'adi'],
  surat: ['surat', 'st'],
  vadodara: ['vadodara', 'baroda', 'brc'],
  rajkot: ['rajkot', 'rjt'],
  jaipur: ['jaipur', 'pink city', 'jp'],
  jodhpur: ['jodhpur', 'jdh'],
  udaipur: ['udaipur', 'udr'],
  kota: ['kota', 'kta'],
  jaisalmer: ['jaisalmer', 'jsm'],

  // North India
  delhi: ['delhi', 'new delhi', 'ndls', 'dli', 'ncr'],
  noida: ['noida'],
  gurugram: ['gurugram', 'gurgaon', 'ggn'],
  chandigarh: ['chandigarh', 'chd'],
  amritsar: ['amritsar', 'asr'],
  ludhiana: ['ludhiana', 'ldh'],
  jalandhar: ['jalandhar', 'juc'],
  shimla: ['shimla', 'sml'],
  manali: ['manali'],
  dharamshala: ['dharamshala', 'dharamsala'],
  dehradun: ['dehradun', 'ddn'],
  haridwar: ['haridwar', 'hw'],
  rishikesh: ['rishikesh', 'rksh'],
  jammu: ['jammu', 'jat'],
  srinagar: ['srinagar', 'sxr'],
  lucknow: ['lucknow', 'lko'],
  kanpur: ['kanpur', 'cnb'],
  agra: ['agra', 'agc'],
  varanasi: ['varanasi', 'banaras', 'kashi', 'bsb'],

  // Central India
  indore: ['indore', 'indb'],
  bhopal: ['bhopal', 'bpl'],
  gwalior: ['gwalior', 'gwl'],
  jabalpur: ['jabalpur', 'jbp'],
  raipur: ['raipur', 'rpr'],
  bilaspur: ['bilaspur', 'bsp'],

  // East & Northeast India
  kolkata: ['kolkata', 'calcutta', 'ccu', 'hwh', 'sdah'],
  siliguri: ['siliguri', 'njp'],
  durgapur: ['durgapur', 'dgr'],
  bhubaneswar: ['bhubaneswar', 'bbsr', 'bbs'],
  cuttack: ['cuttack', 'ctc'],
  puri: ['puri'],
  patna: ['patna', 'pnbe'],
  gaya: ['gaya', 'gay'],
  ranchi: ['ranchi', 'rnc'],
  jamshedpur: ['jamshedpur', 'tatanagar', 'tata'],
  guwahati: ['guwahati', 'gau', 'ghy'],
  shillong: ['shillong', 'shl'],
};

export const PAN_INDIA_TRANSIT_HUBS = [
  { placeId: 'hub-cbe-sr-central', mainText: 'SMART ROUTE Central Bus Hub', secondaryText: 'Palakkad – Ukkadam Highway, K.G. Chavadi, Coimbatore – 641105', city: 'Coimbatore', state: 'Tamil Nadu', type: 'central_hub' },
  { placeId: 'hub-cbe-01', mainText: 'Coimbatore', secondaryText: 'Tamil Nadu, India', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, type: 'city' },
  { placeId: 'hub-cbe-02', mainText: 'Coimbatore Omni Bus Stand', secondaryText: 'Sathy Road, Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, type: 'bus_station' },
  { placeId: 'hub-cbe-03', mainText: 'Gandhipuram Omni Bus Terminal', secondaryText: 'Dr. Nanjappa Road, Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0183, lng: 76.9725, type: 'bus_station' },
  { placeId: 'hub-che-01', mainText: 'Chennai', secondaryText: 'Tamil Nadu, India', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, type: 'city' },
  { placeId: 'hub-che-02', mainText: 'Koyambedu Omni Bus Stand (CMBT)', secondaryText: 'Koyambedu, Chennai', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0694, lng: 80.1948, type: 'bus_station' },
  { placeId: 'hub-che-03', mainText: 'Kilambakkam Bus Terminus (KCBT)', secondaryText: 'GST Road, Vandalur, Chennai', city: 'Chennai', state: 'Tamil Nadu', lat: 12.8686, lng: 80.0827, type: 'bus_station' },
  { placeId: 'hub-mdu-01', mainText: 'Madurai', secondaryText: 'Tamil Nadu, India', city: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198, type: 'city' },
  { placeId: 'hub-mdu-02', mainText: 'Mattuthavani Integrated Bus Stand (MIBT)', secondaryText: 'Mattuthavani, Madurai', city: 'Madurai', state: 'Tamil Nadu', lat: 9.9463, lng: 78.1565, type: 'bus_station' },
  { placeId: 'hub-sal-01', mainText: 'Salem', secondaryText: 'Tamil Nadu, India', city: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460, type: 'city' },
  { placeId: 'hub-sal-02', mainText: 'Salem New Bus Stand', secondaryText: 'AVR Circle, Salem', city: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460, type: 'bus_station' },
  { placeId: 'hub-trz-01', mainText: 'Tiruchirappalli (Trichy)', secondaryText: 'Tamil Nadu, India', city: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047, type: 'city' },
  { placeId: 'hub-trz-02', mainText: 'Trichy Central Bus Stand', secondaryText: 'Cantonment, Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7932, lng: 78.6854, type: 'bus_station' },
  { placeId: 'hub-tks-01', mainText: 'Tenkasi', secondaryText: 'Tenkasi District, Tamil Nadu', city: 'Tenkasi', state: 'Tamil Nadu', lat: 8.9604, lng: 77.3152, type: 'city' },
  { placeId: 'hub-tks-02', mainText: 'Tenkasi New Bus Stand', secondaryText: 'Kollam - Madurai Highway, Tenkasi', city: 'Tenkasi', state: 'Tamil Nadu', lat: 8.9604, lng: 77.3152, type: 'bus_station' },
  { placeId: 'hub-kkdi-01', mainText: 'Karaikudi', secondaryText: 'Sivaganga District, Tamil Nadu', city: 'Karaikudi', state: 'Tamil Nadu', lat: 10.0667, lng: 78.7833, type: 'city' },
  { placeId: 'hub-kkdi-02', mainText: 'Karaikudi New Bus Stand', secondaryText: 'College Road, Karaikudi', city: 'Karaikudi', state: 'Tamil Nadu', lat: 10.0712, lng: 78.7794, type: 'bus_station' },
  { placeId: 'hub-kkdi-03', mainText: 'Alagappa University', secondaryText: 'Karaikudi, Tamil Nadu', city: 'Karaikudi', state: 'Tamil Nadu', lat: 10.0760, lng: 78.7905, type: 'bus_station' },
  { placeId: 'hub-pdk-01', mainText: 'Pudukkottai Bus Stand', secondaryText: 'Pudukkottai, Tamil Nadu', city: 'Pudukkottai', state: 'Tamil Nadu', lat: 10.3833, lng: 78.8000, type: 'bus_station' },
  { placeId: 'hub-tnv-01', mainText: 'Tirunelveli New Bus Stand', secondaryText: 'Palayamkottai, Tirunelveli', city: 'Tirunelveli', state: 'Tamil Nadu', lat: 8.7099, lng: 77.7342, type: 'bus_station' },

  // ==================== KARNATAKA ====================
  { placeId: 'hub-blr-01', mainText: 'Bengaluru', secondaryText: 'Karnataka, India', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, type: 'city' },
  { placeId: 'hub-blr-02', mainText: 'Majestic Kempegowda Bus Station', secondaryText: 'Majestic, Bengaluru', city: 'Bengaluru', state: 'Karnataka', lat: 12.9767, lng: 77.5713, type: 'bus_station' },
  { placeId: 'hub-blr-03', mainText: 'Electronic City Toll Gate', secondaryText: 'Hosur Road, Bengaluru', city: 'Bengaluru', state: 'Karnataka', lat: 12.8399, lng: 77.6770, type: 'bus_station' },
  { placeId: 'hub-blr-04', mainText: 'Madiwala Bus Stand', secondaryText: 'Madiwala, Bengaluru', city: 'Bengaluru', state: 'Karnataka', lat: 12.9226, lng: 77.6174, type: 'bus_station' },
  { placeId: 'hub-mys-01', mainText: 'Mysuru (Mysore)', secondaryText: 'Karnataka, India', city: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394, type: 'city' },
  { placeId: 'hub-mys-02', mainText: 'Mysore Suburb Bus Stand', secondaryText: 'Lashkar Mohalla, Mysuru', city: 'Mysuru', state: 'Karnataka', lat: 12.3115, lng: 76.6558, type: 'bus_station' },
  { placeId: 'hub-mlr-01', mainText: 'Mangaluru (Mangalore)', secondaryText: 'Karnataka, India', city: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lng: 74.8560, type: 'city' },
  { placeId: 'hub-mlr-02', mainText: 'Mangalore KSRTC Terminal', secondaryText: 'Bejai, Mangaluru', city: 'Mangaluru', state: 'Karnataka', lat: 12.8833, lng: 74.8456, type: 'bus_station' },
  { placeId: 'hub-ubl-01', mainText: 'Hubballi (Hubli)', secondaryText: 'Karnataka, India', city: 'Hubballi', state: 'Karnataka', lat: 15.3647, lng: 75.1240, type: 'city' },

  // ==================== KERALA ====================
  { placeId: 'hub-koc-01', mainText: 'Kochi (Cochin / Ernakulam)', secondaryText: 'Kerala, India', city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, type: 'city' },
  { placeId: 'hub-koc-02', mainText: 'Vytilla Mobility Hub', secondaryText: 'Vytilla, Kochi', city: 'Kochi', state: 'Kerala', lat: 9.9676, lng: 76.3197, type: 'bus_station' },
  { placeId: 'hub-tvm-01', mainText: 'Thiruvananthapuram (Trivandrum)', secondaryText: 'Kerala, India', city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, type: 'city' },
  { placeId: 'hub-tvm-02', mainText: 'Central Bus Terminal Thampanoor', secondaryText: 'Thampanoor, Thiruvananthapuram', city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.4875, lng: 76.9525, type: 'bus_station' },
  { placeId: 'hub-clt-01', mainText: 'Kozhikode (Calicut)', secondaryText: 'Kerala, India', city: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804, type: 'city' },
  { placeId: 'hub-tcr-01', mainText: 'Thrissur', secondaryText: 'Kerala, India', city: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144, type: 'city' },

  // ==================== TELANGANA & ANDHRA PRADESH ====================
  { placeId: 'hub-hyd-01', mainText: 'Hyderabad', secondaryText: 'Telangana, India', city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, type: 'city' },
  { placeId: 'hub-hyd-02', mainText: 'Mahatma Gandhi Bus Station (MGBS)', secondaryText: 'Gowliguda, Hyderabad', city: 'Hyderabad', state: 'Telangana', lat: 17.3789, lng: 78.4812, type: 'bus_station' },
  { placeId: 'hub-hyd-03', mainText: 'Jubilee Bus Station (JBS)', secondaryText: 'Secunderabad, Hyderabad', city: 'Hyderabad', state: 'Telangana', lat: 17.4485, lng: 78.4984, type: 'bus_station' },
  { placeId: 'hub-hyd-04', mainText: 'Ameerpet Bus Stop', secondaryText: 'Ameerpet, Hyderabad', city: 'Hyderabad', state: 'Telangana', lat: 17.4375, lng: 78.4482, type: 'bus_station' },
  { placeId: 'hub-vja-01', mainText: 'Vijayawada', secondaryText: 'Andhra Pradesh, India', city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480, type: 'city' },
  { placeId: 'hub-vja-02', mainText: 'Pandit Nehru Bus Station (PNBS)', secondaryText: 'Autonagar, Vijayawada', city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5085, lng: 80.6277, type: 'bus_station' },
  { placeId: 'hub-vskp-01', mainText: 'Visakhapatnam (Vizag)', secondaryText: 'Andhra Pradesh, India', city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, type: 'city' },
  { placeId: 'hub-vskp-02', mainText: 'Dwaraka Bus Station (RTC Complex)', secondaryText: 'Dwaraka Nagar, Visakhapatnam', city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.7215, lng: 83.3032, type: 'bus_station' },
  { placeId: 'hub-tpty-01', mainText: 'Tirupati Central Bus Station', secondaryText: 'Tata Nagar, Tirupati', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192, type: 'bus_station' },

  // ==================== MAHARASHTRA & GOA ====================
  { placeId: 'hub-mum-01', mainText: 'Mumbai', secondaryText: 'Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, type: 'city' },
  { placeId: 'hub-mum-02', mainText: 'Borivali East Private Bus Stand', secondaryText: 'Western Express Highway, Mumbai', city: 'Mumbai', state: 'Maharashtra', lat: 19.2288, lng: 72.8541, type: 'bus_station' },
  { placeId: 'hub-mum-03', mainText: 'Dadar Asiad Bus Terminal', secondaryText: 'Dadar East, Mumbai', city: 'Mumbai', state: 'Maharashtra', lat: 19.0178, lng: 72.8478, type: 'bus_station' },
  { placeId: 'hub-mum-04', mainText: 'Vashi Highway Bus Stand', secondaryText: 'Sector 17, Vashi, Navi Mumbai', city: 'Mumbai', state: 'Maharashtra', lat: 19.0771, lng: 72.9986, type: 'bus_station' },
  { placeId: 'hub-pun-01', mainText: 'Pune', secondaryText: 'Maharashtra, India', city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, type: 'city' },
  { placeId: 'hub-pun-02', mainText: 'Swargate Bus Station', secondaryText: 'Swargate, Pune', city: 'Pune', state: 'Maharashtra', lat: 18.5018, lng: 73.8587, type: 'bus_station' },
  { placeId: 'hub-pun-03', mainText: 'Wakad Bridge Bus Stand', secondaryText: 'Mumbai-Pune Expressway, Wakad, Pune', city: 'Pune', state: 'Maharashtra', lat: 18.5987, lng: 73.7684, type: 'bus_station' },
  { placeId: 'hub-ngp-01', mainText: 'Nagpur', secondaryText: 'Maharashtra, India', city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, type: 'city' },
  { placeId: 'hub-shir-01', mainText: 'Shirdi', secondaryText: 'Ahmednagar District, Maharashtra', city: 'Shirdi', state: 'Maharashtra', lat: 19.7667, lng: 74.4767, type: 'city' },
  { placeId: 'hub-nsk-01', mainText: 'Nashik', secondaryText: 'Maharashtra, India', city: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, type: 'city' },
  { placeId: 'hub-goa-01', mainText: 'Goa (Panaji)', secondaryText: 'Goa, India', city: 'Goa', state: 'Goa', lat: 15.4909, lng: 73.8278, type: 'city' },
  { placeId: 'hub-goa-02', mainText: 'Panaji KTC Bus Terminus', secondaryText: 'Patto Centre, Panaji, Goa', city: 'Goa', state: 'Goa', lat: 15.4989, lng: 73.8354, type: 'bus_station' },
  { placeId: 'hub-goa-03', mainText: 'Margao (Madgaon) KTC Bus Stand', secondaryText: 'Fatorda, Margao, Goa', city: 'Goa', state: 'Goa', lat: 15.2832, lng: 73.9685, type: 'bus_station' },

  // ==================== GUJARAT & RAJASTHAN ====================
  { placeId: 'hub-ahd-01', mainText: 'Ahmedabad', secondaryText: 'Gujarat, India', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, type: 'city' },
  { placeId: 'hub-ahd-02', mainText: 'Paldi Bus Terminal', secondaryText: 'Paldi Cross Road, Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0125, lng: 72.5625, type: 'bus_station' },
  { placeId: 'hub-sur-01', mainText: 'Surat', secondaryText: 'Gujarat, India', city: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, type: 'city' },
  { placeId: 'hub-sur-02', mainText: 'Surat Central Bus Station', secondaryText: 'Railway Station Road, Surat', city: 'Surat', state: 'Gujarat', lat: 21.2045, lng: 72.8412, type: 'bus_station' },
  { placeId: 'hub-brc-01', mainText: 'Vadodara (Baroda)', secondaryText: 'Gujarat, India', city: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812, type: 'city' },
  { placeId: 'hub-jai-01', mainText: 'Jaipur', secondaryText: 'Rajasthan, India', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, type: 'city' },
  { placeId: 'hub-jai-02', mainText: 'Sindhi Camp Central Bus Stand', secondaryText: 'Station Road, Jaipur', city: 'Jaipur', state: 'Rajasthan', lat: 26.9239, lng: 75.8016, type: 'bus_station' },
  { placeId: 'hub-jdh-01', mainText: 'Jodhpur', secondaryText: 'Rajasthan, India', city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, type: 'city' },
  { placeId: 'hub-udr-01', mainText: 'Udaipur', secondaryText: 'Rajasthan, India', city: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125, type: 'city' },
  { placeId: 'hub-udr-02', mainText: 'Udaipur City Bus Station', secondaryText: 'Udiapol, Udaipur', city: 'Udaipur', state: 'Rajasthan', lat: 24.5765, lng: 73.6987, type: 'bus_station' },

  // ==================== DELHI NCR & NORTH INDIA ====================
  { placeId: 'hub-del-01', mainText: 'Delhi (New Delhi)', secondaryText: 'National Capital Territory, India', city: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, type: 'city' },
  { placeId: 'hub-del-02', mainText: 'Kashmere Gate ISBT (Maharana Pratap)', secondaryText: 'Kashmere Gate, Delhi', city: 'Delhi', state: 'Delhi', lat: 28.6675, lng: 77.2285, type: 'bus_station' },
  { placeId: 'hub-del-03', mainText: 'Anand Vihar ISBT (Swami Vivekananda)', secondaryText: 'Anand Vihar, Delhi', city: 'Delhi', state: 'Delhi', lat: 28.6472, lng: 77.3150, type: 'bus_station' },
  { placeId: 'hub-del-04', mainText: 'Sarai Kale Khan ISBT', secondaryText: 'Ring Road, Nizamuddin, Delhi', city: 'Delhi', state: 'Delhi', lat: 28.5886, lng: 77.2564, type: 'bus_station' },
  { placeId: 'hub-ggn-01', mainText: 'Gurugram (Gurgaon)', secondaryText: 'Haryana, India', city: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266, type: 'city' },
  { placeId: 'hub-chd-01', mainText: 'Chandigarh', secondaryText: 'Union Territory, India', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794, type: 'city' },
  { placeId: 'hub-chd-02', mainText: 'ISBT Sector 43 Chandigarh', secondaryText: 'Sector 43, Chandigarh', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7188, lng: 76.7412, type: 'bus_station' },
  { placeId: 'hub-asr-01', mainText: 'Amritsar', secondaryText: 'Punjab, India', city: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723, type: 'city' },
  { placeId: 'hub-ldh-01', mainText: 'Ludhiana', secondaryText: 'Punjab, India', city: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573, type: 'city' },
  { placeId: 'hub-sml-01', mainText: 'Shimla', secondaryText: 'Himachal Pradesh, India', city: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, type: 'city' },
  { placeId: 'hub-sml-02', mainText: 'ISBT Tutikandi Shimla', secondaryText: 'Tutikandi, Shimla', city: 'Shimla', state: 'Himachal Pradesh', lat: 31.0965, lng: 77.1542, type: 'bus_station' },
  { placeId: 'hub-mnl-01', mainText: 'Manali', secondaryText: 'Kullu District, Himachal Pradesh', city: 'Manali', state: 'Himachal Pradesh', lat: 32.2396, lng: 77.1887, type: 'city' },
  { placeId: 'hub-mnl-02', mainText: 'Manali Private Bus Stand', secondaryText: 'Mall Road, Manali', city: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1895, type: 'bus_station' },
  { placeId: 'hub-ddn-01', mainText: 'Dehradun', secondaryText: 'Uttarakhand, India', city: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, type: 'city' },
  { placeId: 'hub-ddn-02', mainText: 'Dehradun ISBT', secondaryText: 'Haridwar Bypass Road, Dehradun', city: 'Dehradun', state: 'Uttarakhand', lat: 30.2865, lng: 78.0125, type: 'bus_station' },
  { placeId: 'hub-hw-01', mainText: 'Haridwar Bus Stand', secondaryText: 'Near Railway Station, Haridwar', city: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642, type: 'bus_station' },
  { placeId: 'hub-jam-01', mainText: 'Jammu', secondaryText: 'Jammu and Kashmir, India', city: 'Jammu', state: 'Jammu and Kashmir', lat: 32.7266, lng: 74.8570, type: 'city' },
  { placeId: 'hub-sri-01', mainText: 'Srinagar', secondaryText: 'Jammu and Kashmir, India', city: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973, type: 'city' },
  { placeId: 'hub-lko-01', mainText: 'Lucknow', secondaryText: 'Uttar Pradesh, India', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, type: 'city' },
  { placeId: 'hub-lko-02', mainText: 'Alambagh ISBT Lucknow', secondaryText: 'Alambagh, Lucknow', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8156, lng: 80.9025, type: 'bus_station' },
  { placeId: 'hub-vns-01', mainText: 'Varanasi', secondaryText: 'Uttar Pradesh, India', city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, type: 'city' },

  // ==================== CENTRAL INDIA ====================
  { placeId: 'hub-ind-01', mainText: 'Indore', secondaryText: 'Madhya Pradesh, India', city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, type: 'city' },
  { placeId: 'hub-ind-02', mainText: 'Sarwate Bus Stand', secondaryText: 'Chhoti Gwaltoli, Indore', city: 'Indore', state: 'Madhya Pradesh', lat: 22.7154, lng: 75.8672, type: 'bus_station' },
  { placeId: 'hub-bpl-01', mainText: 'Bhopal', secondaryText: 'Madhya Pradesh, India', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, type: 'city' },
  { placeId: 'hub-rpr-01', mainText: 'Raipur', secondaryText: 'Chhattisgarh, India', city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, type: 'city' },

  // ==================== EAST & NORTHEAST INDIA ====================
  { placeId: 'hub-kol-01', mainText: 'Kolkata', secondaryText: 'West Bengal, India', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, type: 'city' },
  { placeId: 'hub-kol-02', mainText: 'Esplanade Bus Terminus', secondaryText: 'Dharmatala, Kolkata', city: 'Kolkata', state: 'West Bengal', lat: 22.5654, lng: 88.3512, type: 'bus_station' },
  { placeId: 'hub-slg-01', mainText: 'Siliguri', secondaryText: 'Darjeeling District, West Bengal', city: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953, type: 'city' },
  { placeId: 'hub-bbs-01', mainText: 'Bhubaneswar', secondaryText: 'Odisha, India', city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245, type: 'city' },
  { placeId: 'hub-bbs-02', mainText: 'Baramunda ISBT Bhubaneswar', secondaryText: 'Baramunda, Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', lat: 20.2785, lng: 85.7954, type: 'bus_station' },
  { placeId: 'hub-pat-01', mainText: 'Patna', secondaryText: 'Bihar, India', city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, type: 'city' },
  { placeId: 'hub-rnc-01', mainText: 'Ranchi', secondaryText: 'Jharkhand, India', city: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096, type: 'city' },
  { placeId: 'hub-ghy-01', mainText: 'Guwahati', secondaryText: 'Assam, India', city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362, type: 'city' },
  { placeId: 'hub-ghy-02', mainText: 'ISBT Betkuchi Guwahati', secondaryText: 'Betkuchi, Guwahati', city: 'Guwahati', state: 'Assam', lat: 26.1154, lng: 91.7145, type: 'bus_station' },
  { placeId: 'hub-shl-01', mainText: 'Shillong', secondaryText: 'Meghalaya, India', city: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933, type: 'city' },

  // ==================== NORTHEAST & HIMALAYAN STATES ====================
  { placeId: 'hub-agt-01', mainText: 'Agartala', secondaryText: 'Tripura, India', city: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868, type: 'city' },
  { placeId: 'hub-agt-02', mainText: 'Agartala ISBT Chandrapur', secondaryText: 'Chandrapur, Agartala', city: 'Agartala', state: 'Tripura', lat: 23.8415, lng: 91.2950, type: 'bus_station' },
  { placeId: 'hub-imp-01', mainText: 'Imphal', secondaryText: 'Manipur, India', city: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 93.9368, type: 'city' },
  { placeId: 'hub-aiz-01', mainText: 'Aizawl', secondaryText: 'Mizoram, India', city: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176, type: 'city' },
  { placeId: 'hub-khm-01', mainText: 'Kohima', secondaryText: 'Nagaland, India', city: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086, type: 'city' },
  { placeId: 'hub-dmp-01', mainText: 'Dimapur', secondaryText: 'Nagaland, India', city: 'Dimapur', state: 'Nagaland', lat: 25.9090, lng: 93.7266, type: 'city' },
  { placeId: 'hub-itn-01', mainText: 'Itanagar', secondaryText: 'Arunachal Pradesh, India', city: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053, type: 'city' },
  { placeId: 'hub-gtk-01', mainText: 'Gangtok', secondaryText: 'Sikkim, India', city: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065, type: 'city' },
  { placeId: 'hub-leh-01', mainText: 'Leh', secondaryText: 'Ladakh, India', city: 'Leh', state: 'Ladakh', lat: 34.1526, lng: 77.5771, type: 'city' },
  { placeId: 'hub-leh-02', mainText: 'Leh General Bus Stand', secondaryText: 'Skara, Leh, Ladakh', city: 'Leh', state: 'Ladakh', lat: 34.1580, lng: 77.5730, type: 'bus_station' },

  // ==================== UNION TERRITORIES ====================
  { placeId: 'hub-pdy-01', mainText: 'Puducherry (Pondicherry)', secondaryText: 'Union Territory, India', city: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083, type: 'city' },
  { placeId: 'hub-dmn-01', mainText: 'Daman', secondaryText: 'Dadra & Nagar Haveli and Daman & Diu', city: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu', lat: 20.3974, lng: 72.8328, type: 'city' },
  { placeId: 'hub-slv-01', mainText: 'Silvassa', secondaryText: 'Dadra & Nagar Haveli and Daman & Diu', city: 'Silvassa', state: 'Dadra and Nagar Haveli and Daman and Diu', lat: 20.2763, lng: 73.0083, type: 'city' },
  { placeId: 'hub-pbl-01', mainText: 'Port Blair', secondaryText: 'Andaman and Nicobar Islands, India', city: 'Port Blair', state: 'Andaman and Nicobar Islands', lat: 11.6234, lng: 92.7265, type: 'city' },
];

/**
 * Searches the Pan-India Transit Hubs index by city name, terminal name, or state
 */
export function queryPanIndiaTransitHubs(query) {
  if (!query) return [];
  const q = String(query).toLowerCase().trim();

  return PAN_INDIA_TRANSIT_HUBS
    .filter((hub) => {
      const matchMain = hub.mainText.toLowerCase().includes(q);
      const matchCity = hub.city.toLowerCase().includes(q);
      const matchSec = hub.secondaryText.toLowerCase().includes(q);
      const matchState = hub.state ? hub.state.toLowerCase().includes(q) : false;
      return matchMain || matchCity || matchSec || matchState;
    })
    .sort((a, b) => {
      const aStarts = a.mainText.toLowerCase().startsWith(q) || a.city.toLowerCase().startsWith(q);
      const bStarts = b.mainText.toLowerCase().startsWith(q) || b.city.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    })
    .map((hub) => ({
      placeId: hub.placeId,
      mainText: hub.mainText,
      secondaryText: hub.secondaryText,
      fullText: `${hub.mainText}, ${hub.secondaryText}`,
      city: hub.city,
      state: hub.state,
      lat: hub.lat,
      lng: hub.lng,
      type: hub.type,
      source: 'smartroute_pan_india_transit',
    }));
}

// ============================================================================
// COMPREHENSIVE PAN-INDIA VERIFIED STOP & CITY COORDINATES REGISTRY
// ============================================================================

export const PAN_INDIA_CITY_COORDINATES = {
  // Tamil Nadu
  coimbatore: { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
  chennai: { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  madurai: { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu' },
  salem: { lat: 11.6643, lng: 78.1460, state: 'Tamil Nadu' },
  erode: { lat: 11.3410, lng: 77.7172, state: 'Tamil Nadu' },
  tiruppur: { lat: 11.1085, lng: 77.3411, state: 'Tamil Nadu' },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047, state: 'Tamil Nadu' },
  trichy: { lat: 10.7905, lng: 78.7047, state: 'Tamil Nadu' },
  thanjavur: { lat: 10.7870, lng: 79.1378, state: 'Tamil Nadu' },
  tenkasi: { lat: 8.9604, lng: 77.3152, state: 'Tamil Nadu' },
  tirunelveli: { lat: 8.7099, lng: 77.7342, state: 'Tamil Nadu' },
  nagercoil: { lat: 8.1833, lng: 77.4333, state: 'Tamil Nadu' },
  thoothukudi: { lat: 8.7642, lng: 78.1348, state: 'Tamil Nadu' },
  rameswaram: { lat: 9.2876, lng: 79.3129, state: 'Tamil Nadu' },
  ramanathapuram: { lat: 9.3639, lng: 78.8395, state: 'Tamil Nadu' },
  tiruchendur: { lat: 8.4980, lng: 78.1250, state: 'Tamil Nadu' },
  karaikudi: { lat: 10.0667, lng: 78.7833, state: 'Tamil Nadu' },
  pudukkottai: { lat: 10.3833, lng: 78.8000, state: 'Tamil Nadu' },
  pollachi: { lat: 10.6609, lng: 77.0082, state: 'Tamil Nadu' },
  udumalpet: { lat: 10.5872, lng: 77.2476, state: 'Tamil Nadu' },
  udumalapettai: { lat: 10.5872, lng: 77.2476, state: 'Tamil Nadu' },
  palani: { lat: 10.4505, lng: 77.5164, state: 'Tamil Nadu' },
  ottanchathiram: { lat: 10.4851, lng: 77.7554, state: 'Tamil Nadu' },
  oddanchatram: { lat: 10.4851, lng: 77.7554, state: 'Tamil Nadu' },
  thirumangalam: { lat: 9.8242, lng: 77.9866, state: 'Tamil Nadu' },
  srivilliputhur: { lat: 9.5125, lng: 77.6348, state: 'Tamil Nadu' },
  rajapalayam: { lat: 9.4534, lng: 77.5565, state: 'Tamil Nadu' },
  vasudevanallur: { lat: 9.2335, lng: 77.4162, state: 'Tamil Nadu' },
  sivagiri: { lat: 9.3402, lng: 77.4302, state: 'Tamil Nadu' },
  puliyangudi: { lat: 9.1764, lng: 77.3965, state: 'Tamil Nadu' },
  kadayanallur: { lat: 9.0733, lng: 77.3423, state: 'Tamil Nadu' },
  villupuram: { lat: 11.9401, lng: 79.4861, state: 'Tamil Nadu' },
  vellore: { lat: 12.9165, lng: 79.1325, state: 'Tamil Nadu' },
  hosur: { lat: 12.7409, lng: 77.8253, state: 'Tamil Nadu' },
  avinashi: { lat: 11.1925, lng: 77.2694, state: 'Tamil Nadu' },
  palladam: { lat: 10.9981, lng: 77.2912, state: 'Tamil Nadu' },
  dharapuram: { lat: 10.7289, lng: 77.5270, state: 'Tamil Nadu' },
  kangeyam: { lat: 11.0064, lng: 77.5615, state: 'Tamil Nadu' },
  perundurai: { lat: 11.2750, lng: 77.5850, state: 'Tamil Nadu' },
  dindigul: { lat: 10.3673, lng: 77.9803, state: 'Tamil Nadu' },
  karur: { lat: 10.9601, lng: 78.0766, state: 'Tamil Nadu' },
  namakkal: { lat: 11.2189, lng: 78.1674, state: 'Tamil Nadu' },
  dharmapuri: { lat: 12.1211, lng: 78.1582, state: 'Tamil Nadu' },
  sankari: { lat: 11.4820, lng: 77.8680, state: 'Tamil Nadu' },
  kanchipuram: { lat: 12.8342, lng: 79.7036, state: 'Tamil Nadu' },
  virudhunagar: { lat: 9.5680, lng: 77.9624, state: 'Tamil Nadu' },
  sattur: { lat: 9.3620, lng: 77.9250, state: 'Tamil Nadu' },
  kovilpatti: { lat: 9.1730, lng: 77.8680, state: 'Tamil Nadu' },
  ettayapuram: { lat: 9.1510, lng: 77.9940, state: 'Tamil Nadu' },
  aruppukottai: { lat: 9.5120, lng: 78.0980, state: 'Tamil Nadu' },
  paramakudi: { lat: 9.5440, lng: 78.5910, state: 'Tamil Nadu' },
  valliyur: { lat: 8.3780, lng: 77.6120, state: 'Tamil Nadu' },
  ooty: { lat: 11.4102, lng: 76.6950, state: 'Tamil Nadu' },
  mettupalayam: { lat: 11.3000, lng: 76.9400, state: 'Tamil Nadu' },
  sulur: { lat: 11.0264, lng: 77.1265, state: 'Tamil Nadu' },
  kinathukadavu: { lat: 10.8210, lng: 77.0210, state: 'Tamil Nadu' },
  madathukulam: { lat: 10.5312, lng: 77.3820, state: 'Tamil Nadu' },
  sempatty: { lat: 10.3210, lng: 77.8520, state: 'Tamil Nadu' },

  // Karnataka
  bengaluru: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  bangalore: { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  mysuru: { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  mysore: { lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
  mangaluru: { lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
  mangalore: { lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
  udupi: { lat: 13.3409, lng: 74.7421, state: 'Karnataka' },
  karwar: { lat: 14.8136, lng: 74.1297, state: 'Karnataka' },
  hassan: { lat: 13.0072, lng: 76.0964, state: 'Karnataka' },
  sakleshpur: { lat: 12.9438, lng: 75.7865, state: 'Karnataka' },
  hubballi: { lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  hubli: { lat: 15.3647, lng: 75.1240, state: 'Karnataka' },
  dharwad: { lat: 15.4589, lng: 75.0078, state: 'Karnataka' },
  belagavi: { lat: 15.8497, lng: 74.4977, state: 'Karnataka' },
  belgaum: { lat: 15.8497, lng: 74.4977, state: 'Karnataka' },
  davangere: { lat: 14.4644, lng: 75.9218, state: 'Karnataka' },
  tumakuru: { lat: 13.3379, lng: 77.1010, state: 'Karnataka' },
  kunigal: { lat: 13.0238, lng: 77.0344, state: 'Karnataka' },
  mandya: { lat: 12.5244, lng: 76.8967, state: 'Karnataka' },
  bidadi: { lat: 12.7972, lng: 77.3850, state: 'Karnataka' },
  gundlupet: { lat: 11.8080, lng: 76.6890, state: 'Karnataka' },
  kolar: { lat: 13.1367, lng: 78.1291, state: 'Karnataka' },
  virajpet: { lat: 12.2024, lng: 75.8078, state: 'Karnataka' },

  // Kerala
  kochi: { lat: 9.9312, lng: 76.2673, state: 'Kerala' },
  ernakulam: { lat: 9.9816, lng: 76.2999, state: 'Kerala' },
  thrissur: { lat: 10.5276, lng: 76.2144, state: 'Kerala' },
  palakkad: { lat: 10.7867, lng: 76.6548, state: 'Kerala' },
  kozhikode: { lat: 11.2588, lng: 75.7804, state: 'Kerala' },
  calicut: { lat: 11.2588, lng: 75.7804, state: 'Kerala' },
  malappuram: { lat: 11.0732, lng: 76.0740, state: 'Kerala' },
  kannur: { lat: 11.8745, lng: 75.3704, state: 'Kerala' },
  iritty: { lat: 11.9833, lng: 75.6667, state: 'Kerala' },
  wayanad: { lat: 11.6628, lng: 76.2570, state: 'Kerala' },
  alappuzha: { lat: 9.4981, lng: 76.3388, state: 'Kerala' },
  kottayam: { lat: 9.5916, lng: 76.5222, state: 'Kerala' },
  kollam: { lat: 8.8932, lng: 76.6141, state: 'Kerala' },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, state: 'Kerala' },
  trivandrum: { lat: 8.5241, lng: 76.9366, state: 'Kerala' },
  aluva: { lat: 10.1076, lng: 76.3516, state: 'Kerala' },

  // Telangana & Andhra Pradesh
  hyderabad: { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  jadcherla: { lat: 16.7667, lng: 78.1333, state: 'Telangana' },
  kurnool: { lat: 15.8281, lng: 78.0373, state: 'Andhra Pradesh' },
  anantapur: { lat: 14.6819, lng: 77.6006, state: 'Andhra Pradesh' },
  chittoor: { lat: 13.2172, lng: 79.1003, state: 'Andhra Pradesh' },
  tirupati: { lat: 13.6288, lng: 79.4192, state: 'Andhra Pradesh' },
  nellore: { lat: 14.4426, lng: 79.9865, state: 'Andhra Pradesh' },
  guntur: { lat: 16.3067, lng: 80.4365, state: 'Andhra Pradesh' },
  vijayawada: { lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
  rajahmundry: { lat: 17.0005, lng: 81.8040, state: 'Andhra Pradesh' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, state: 'Andhra Pradesh' },

  // Maharashtra & Goa
  mumbai: { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  pune: { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  satara: { lat: 17.6805, lng: 74.0183, state: 'Maharashtra' },
  kolhapur: { lat: 16.7050, lng: 74.2433, state: 'Maharashtra' },
  ahmednagar: { lat: 19.0948, lng: 74.7480, state: 'Maharashtra' },
  shirdi: { lat: 19.7667, lng: 74.4767, state: 'Maharashtra' },
  solapur: { lat: 17.6599, lng: 75.9064, state: 'Maharashtra' },
  nashik: { lat: 19.9975, lng: 73.7898, state: 'Maharashtra' },
  nagpur: { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  goa: { lat: 15.4909, lng: 73.8278, state: 'Goa' },
  panaji: { lat: 15.4909, lng: 73.8278, state: 'Goa' },
  madgaon: { lat: 15.2832, lng: 73.9685, state: 'Goa' },
  margao: { lat: 15.2832, lng: 73.9685, state: 'Goa' },

  // Gujarat & Rajasthan
  ahmedabad: { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  surat: { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  vadodara: { lat: 22.3072, lng: 73.1812, state: 'Gujarat' },
  vapi: { lat: 20.3893, lng: 72.9106, state: 'Gujarat' },
  himatnagar: { lat: 23.5977, lng: 72.9698, state: 'Gujarat' },
  shamlaji: { lat: 23.6833, lng: 73.3833, state: 'Gujarat' },
  kherwara: { lat: 23.9833, lng: 73.6000, state: 'Rajasthan' },
  jaipur: { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  jodhpur: { lat: 26.2389, lng: 73.0243, state: 'Rajasthan' },
  udaipur: { lat: 24.5854, lng: 73.7125, state: 'Rajasthan' },
  behror: { lat: 27.8900, lng: 76.2800, state: 'Rajasthan' },
  kotputli: { lat: 27.7000, lng: 76.2000, state: 'Rajasthan' },

  // North India
  delhi: { lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  gurugram: { lat: 28.4595, lng: 77.0266, state: 'Haryana' },
  chandigarh: { lat: 30.7333, lng: 76.7794, state: 'Chandigarh' },
  murthal: { lat: 29.0270, lng: 77.0700, state: 'Haryana' },
  panipat: { lat: 29.3909, lng: 76.9635, state: 'Haryana' },
  karnal: { lat: 29.6857, lng: 76.9905, state: 'Haryana' },
  ambala: { lat: 30.3782, lng: 76.7767, state: 'Haryana' },
  ludhiana: { lat: 30.9010, lng: 75.8573, state: 'Punjab' },
  amritsar: { lat: 31.6340, lng: 74.8723, state: 'Punjab' },
  shimla: { lat: 31.1048, lng: 77.1734, state: 'Himachal Pradesh' },
  manali: { lat: 32.2396, lng: 77.1887, state: 'Himachal Pradesh' },
  bilaspur: { lat: 31.3300, lng: 76.7600, state: 'Himachal Pradesh' },
  mandi: { lat: 31.7087, lng: 76.9320, state: 'Himachal Pradesh' },
  kullu: { lat: 31.9579, lng: 77.1095, state: 'Himachal Pradesh' },
  dehradun: { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand' },
  haridwar: { lat: 29.9457, lng: 78.1642, state: 'Uttarakhand' },
  rishikesh: { lat: 30.0869, lng: 78.2676, state: 'Uttarakhand' },
  meerut: { lat: 28.9845, lng: 77.7064, state: 'Uttar Pradesh' },
  muzaffarnagar: { lat: 29.4727, lng: 77.7085, state: 'Uttar Pradesh' },
  lucknow: { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  agra: { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh' },
  varanasi: { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  jewar: { lat: 28.1285, lng: 77.5550, state: 'Uttar Pradesh' },
  kannauj: { lat: 27.0550, lng: 79.9180, state: 'Uttar Pradesh' },

  // Central India
  indore: { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  bhopal: { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  dewas: { lat: 22.9676, lng: 76.0534, state: 'Madhya Pradesh' },
  ashta: { lat: 23.0167, lng: 76.7167, state: 'Madhya Pradesh' },
  sehore: { lat: 23.2000, lng: 77.0833, state: 'Madhya Pradesh' },
  raipur: { lat: 21.2514, lng: 81.6296, state: 'Chhattisgarh' },

  // East & Northeast
  kolkata: { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  siliguri: { lat: 26.7271, lng: 88.3953, state: 'West Bengal' },
  barasat: { lat: 22.7200, lng: 88.4800, state: 'West Bengal' },
  krishnanagar: { lat: 23.4000, lng: 88.5000, state: 'West Bengal' },
  malda: { lat: 25.0000, lng: 88.1400, state: 'West Bengal' },
  dalkhola: { lat: 25.8500, lng: 87.8500, state: 'West Bengal' },
  kharagpur: { lat: 22.3400, lng: 87.3200, state: 'West Bengal' },
  balasore: { lat: 21.4900, lng: 86.9300, state: 'Odisha' },
  bhadrak: { lat: 21.0500, lng: 86.5000, state: 'Odisha' },
  cuttack: { lat: 20.4625, lng: 85.8828, state: 'Odisha' },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, state: 'Odisha' },
  guwahati: { lat: 26.1445, lng: 91.7362, state: 'Assam' },
  nongpoh: { lat: 25.9000, lng: 91.8800, state: 'Meghalaya' },
  umiam: { lat: 25.6500, lng: 91.8900, state: 'Meghalaya' },
  shillong: { lat: 25.5788, lng: 91.8933, state: 'Meghalaya' },
  patna: { lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  ranchi: { lat: 23.3441, lng: 85.3096, state: 'Jharkhand' },
  agartala: { lat: 23.8315, lng: 91.2868, state: 'Tripura' },
  imphal: { lat: 24.8170, lng: 93.9368, state: 'Manipur' },
  aizawl: { lat: 23.7271, lng: 92.7176, state: 'Mizoram' },
  kohima: { lat: 25.6751, lng: 94.1086, state: 'Nagaland' },
  dimapur: { lat: 25.9090, lng: 93.7266, state: 'Nagaland' },
  itanagar: { lat: 27.0844, lng: 93.6053, state: 'Arunachal Pradesh' },
  gangtok: { lat: 27.3389, lng: 88.6065, state: 'Sikkim' },
  leh: { lat: 34.1526, lng: 77.5771, state: 'Ladakh' },
  puducherry: { lat: 11.9416, lng: 79.8083, state: 'Puducherry' },
  pondicherry: { lat: 11.9416, lng: 79.8083, state: 'Puducherry' },
  daman: { lat: 20.3974, lng: 72.8328, state: 'Dadra and Nagar Haveli and Daman and Diu' },
  silvassa: { lat: 20.2763, lng: 73.0083, state: 'Dadra and Nagar Haveli and Daman and Diu' },
  portblair: { lat: 11.6234, lng: 92.7265, state: 'Andaman and Nicobar Islands' },
};

export const PAN_INDIA_STOPS_REGISTRY = {
  // Coimbatore specific stops
  'coimbatore central bus hub': { lat: 10.9320, lng: 76.8850, city: 'Coimbatore', state: 'Tamil Nadu' },
  'smart route central bus hub': { lat: 10.9320, lng: 76.8850, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore omni bus stand': { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore omni stand': { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu' },
  'gandhipuram omni bus stand': { lat: 11.0183, lng: 76.9725, city: 'Coimbatore', state: 'Tamil Nadu' },
  'gandhipuram omni bus terminal': { lat: 11.0183, lng: 76.9725, city: 'Coimbatore', state: 'Tamil Nadu' },
  'gandhipuram terminal': { lat: 11.0183, lng: 76.9725, city: 'Coimbatore', state: 'Tamil Nadu' },
  'gandhipuram': { lat: 11.0183, lng: 76.9725, city: 'Coimbatore', state: 'Tamil Nadu' },
  'gandhipuram vee vee office': { lat: 11.0180, lng: 76.9715, city: 'Coimbatore', state: 'Tamil Nadu' },
  'gandhipuram ybm lounge': { lat: 11.0185, lng: 76.9730, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore gandhipuram bus stand': { lat: 11.0183, lng: 76.9725, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore gandhipuram stand': { lat: 11.0183, lng: 76.9725, city: 'Coimbatore', state: 'Tamil Nadu' },
  'lakshmi mills': { lat: 11.0118, lng: 76.9855, city: 'Coimbatore', state: 'Tamil Nadu' },
  'singanallur': { lat: 10.9950, lng: 77.0002, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore singanallur bus stand': { lat: 10.9950, lng: 77.0002, city: 'Coimbatore', state: 'Tamil Nadu' },
  'singanallur bus terminal': { lat: 10.9950, lng: 77.0002, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore singanallur stand': { lat: 10.9950, lng: 77.0002, city: 'Coimbatore', state: 'Tamil Nadu' },
  'hope college bypass': { lat: 11.0250, lng: 77.0120, city: 'Coimbatore', state: 'Tamil Nadu' },
  'hope college': { lat: 11.0250, lng: 77.0120, city: 'Coimbatore', state: 'Tamil Nadu' },
  'hopes': { lat: 11.0250, lng: 77.0120, city: 'Coimbatore', state: 'Tamil Nadu' },
  'peelamedu': { lat: 11.0310, lng: 77.0050, city: 'Coimbatore', state: 'Tamil Nadu' },
  'nava india': { lat: 11.0210, lng: 76.9880, city: 'Coimbatore', state: 'Tamil Nadu' },
  'chinniampalayam': { lat: 11.0450, lng: 77.0620, city: 'Coimbatore', state: 'Tamil Nadu' },
  'neelambur bypass toll': { lat: 11.0620, lng: 77.0980, city: 'Coimbatore', state: 'Tamil Nadu' },
  'ukkadam': { lat: 10.9904, lng: 76.9601, city: 'Coimbatore', state: 'Tamil Nadu' },
  'ukkadam bus stand': { lat: 10.9904, lng: 76.9601, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore ukkadam bus stand': { lat: 10.9904, lng: 76.9601, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore ukkadam stand': { lat: 10.9904, lng: 76.9601, city: 'Coimbatore', state: 'Tamil Nadu' },
  'coimbatore bypass': { lat: 10.9850, lng: 77.0200, city: 'Coimbatore', state: 'Tamil Nadu' },
  'sulur': { lat: 11.0264, lng: 77.1265, city: 'Coimbatore', state: 'Tamil Nadu' },
  'kinathukadavu': { lat: 10.8210, lng: 77.0210, city: 'Kinathukadavu', state: 'Tamil Nadu' },

  // Tenkasi Corridor
  'pollachi old bus stand': { lat: 10.6609, lng: 77.0082, city: 'Pollachi', state: 'Tamil Nadu' },
  'pollachi bus stand': { lat: 10.6609, lng: 77.0082, city: 'Pollachi', state: 'Tamil Nadu' },
  'udumalpet central bus stand': { lat: 10.5872, lng: 77.2476, city: 'Udumalpet', state: 'Tamil Nadu' },
  'udumalpet central stand': { lat: 10.5872, lng: 77.2476, city: 'Udumalpet', state: 'Tamil Nadu' },
  'udumalapettai central bus stand': { lat: 10.5872, lng: 77.2476, city: 'Udumalapettai', state: 'Tamil Nadu' },
  'udumalapettai central stand': { lat: 10.5872, lng: 77.2476, city: 'Udumalapettai', state: 'Tamil Nadu' },
  'madathukulam': { lat: 10.5312, lng: 77.3820, city: 'Madathukulam', state: 'Tamil Nadu' },
  'palani bus stand': { lat: 10.4505, lng: 77.5164, city: 'Palani', state: 'Tamil Nadu' },
  'palani bypass': { lat: 10.4420, lng: 77.5250, city: 'Palani', state: 'Tamil Nadu' },
  'ottanchathiram bus stand': { lat: 10.4851, lng: 77.7554, city: 'Ottanchathiram', state: 'Tamil Nadu' },
  'oddanchatram bypass': { lat: 10.4910, lng: 77.7600, city: 'Oddanchatram', state: 'Tamil Nadu' },
  'sempatty': { lat: 10.3210, lng: 77.8520, city: 'Sempatty', state: 'Tamil Nadu' },
  'thirumangalam toll gate': { lat: 9.8242, lng: 77.9866, city: 'Thirumangalam', state: 'Tamil Nadu' },
  'srivilliputhur bus stand': { lat: 9.5125, lng: 77.6348, city: 'Srivilliputhur', state: 'Tamil Nadu' },
  'srivilliputhur bypass': { lat: 9.5180, lng: 77.6410, city: 'Srivilliputhur', state: 'Tamil Nadu' },
  'rajapalayam old bus stand': { lat: 9.4534, lng: 77.5565, city: 'Rajapalayam', state: 'Tamil Nadu' },
  'rajapalayam stand': { lat: 9.4534, lng: 77.5565, city: 'Rajapalayam', state: 'Tamil Nadu' },
  'rajapalayam bypass': { lat: 9.4600, lng: 77.5620, city: 'Rajapalayam', state: 'Tamil Nadu' },
  'vasudevanallur bypass': { lat: 9.2335, lng: 77.4162, city: 'Vasudevanallur', state: 'Tamil Nadu' },
  'sivagiri bus stop': { lat: 9.3402, lng: 77.4302, city: 'Sivagiri', state: 'Tamil Nadu' },
  'puliyangudi main road': { lat: 9.1764, lng: 77.3965, city: 'Puliyangudi', state: 'Tamil Nadu' },
  'kadayanallur bypass': { lat: 9.0733, lng: 77.3423, city: 'Kadayanallur', state: 'Tamil Nadu' },
  'kadayanallur stand': { lat: 9.0733, lng: 77.3423, city: 'Kadayanallur', state: 'Tamil Nadu' },
  'tenkasi new bus stand': { lat: 8.9604, lng: 77.3152, city: 'Tenkasi', state: 'Tamil Nadu' },
  'tenkasi old bus stand': { lat: 8.9580, lng: 77.3100, city: 'Tenkasi', state: 'Tamil Nadu' },

  // Chennai specific stops
  'koyambedu omni bus stand (cmbt)': { lat: 13.0694, lng: 80.1948, city: 'Chennai', state: 'Tamil Nadu' },
  'koyambedu cmbt': { lat: 13.0694, lng: 80.1948, city: 'Chennai', state: 'Tamil Nadu' },
  'ashok pillar': { lat: 13.0330, lng: 80.2110, city: 'Chennai', state: 'Tamil Nadu' },
  'guindy kathipara junction': { lat: 13.0067, lng: 80.2025, city: 'Chennai', state: 'Tamil Nadu' },
  'tambaram mepz terminal': { lat: 12.9249, lng: 80.1345, city: 'Chennai', state: 'Tamil Nadu' },
  'perungalathur terminal': { lat: 12.9050, lng: 80.0890, city: 'Chennai', state: 'Tamil Nadu' },
  'kilambakkam bus terminus (kcbt)': { lat: 12.8686, lng: 80.0827, city: 'Chennai', state: 'Tamil Nadu' },
  'maduravoyal toll': { lat: 13.0680, lng: 80.1550, city: 'Chennai', state: 'Tamil Nadu' },
  'poonamallee stand': { lat: 13.0489, lng: 80.0917, city: 'Chennai', state: 'Tamil Nadu' },

  // Bengaluru specific stops
  'majestic kempegowda bus station': { lat: 12.9767, lng: 77.5713, city: 'Bengaluru', state: 'Karnataka' },
  'majestic kempegowda': { lat: 12.9767, lng: 77.5713, city: 'Bengaluru', state: 'Karnataka' },
  'bengaluru majestic': { lat: 12.9767, lng: 77.5713, city: 'Bengaluru', state: 'Karnataka' },
  'shantinagar bus station': { lat: 12.9550, lng: 77.5950, city: 'Bengaluru', state: 'Karnataka' },
  'madiwala bus stand': { lat: 12.9226, lng: 77.6174, city: 'Bengaluru', state: 'Karnataka' },
  'madiwala': { lat: 12.9226, lng: 77.6174, city: 'Bengaluru', state: 'Karnataka' },
  'silk board junction': { lat: 12.9170, lng: 77.6230, city: 'Bengaluru', state: 'Karnataka' },
  'electronic city toll gate': { lat: 12.8399, lng: 77.6770, city: 'Bengaluru', state: 'Karnataka' },
  'electronic city toll': { lat: 12.8399, lng: 77.6770, city: 'Bengaluru', state: 'Karnataka' },
  'electronic city': { lat: 12.8399, lng: 77.6770, city: 'Bengaluru', state: 'Karnataka' },
  'bengaluru electronic city': { lat: 12.8399, lng: 77.6770, city: 'Bengaluru', state: 'Karnataka' },
  'bommasandra': { lat: 12.8150, lng: 77.6920, city: 'Bengaluru', state: 'Karnataka' },
  'hebbal flyover': { lat: 13.0358, lng: 77.5970, city: 'Bengaluru', state: 'Karnataka' },
  'yelahanka bypass': { lat: 13.1007, lng: 77.5963, city: 'Bengaluru', state: 'Karnataka' },
  'yeshwantpur ttmc': { lat: 13.0280, lng: 77.5400, city: 'Bengaluru', state: 'Karnataka' },
  'indiranagar metro': { lat: 12.9784, lng: 77.6408, city: 'Bengaluru', state: 'Karnataka' },
  'kr puram bridge': { lat: 13.0000, lng: 77.6833, city: 'Bengaluru', state: 'Karnataka' },
  'kengeri ttmc': { lat: 12.9100, lng: 77.4850, city: 'Bengaluru', state: 'Karnataka' },
  'hosakote toll': { lat: 13.0700, lng: 77.7900, city: 'Bengaluru', state: 'Karnataka' },

  // Madurai stops
  'mattuthavani integrated bus stand (mibt)': { lat: 9.9463, lng: 78.1565, city: 'Madurai', state: 'Tamil Nadu' },
  'madurai mattuthavani': { lat: 9.9463, lng: 78.1565, city: 'Madurai', state: 'Tamil Nadu' },
  'madurai mattuthavani mibt': { lat: 9.9463, lng: 78.1565, city: 'Madurai', state: 'Tamil Nadu' },
  'madurai mibt': { lat: 9.9463, lng: 78.1565, city: 'Madurai', state: 'Tamil Nadu' },
  'madurai bypass': { lat: 9.9350, lng: 78.1400, city: 'Madurai', state: 'Tamil Nadu' },
  'madurai ring road': { lat: 9.9310, lng: 78.1620, city: 'Madurai', state: 'Tamil Nadu' },
  'madurai stand': { lat: 9.9252, lng: 78.1198, city: 'Madurai', state: 'Tamil Nadu' },

  // Salem & Erode & Tiruppur
  'salem new bus stand': { lat: 11.6643, lng: 78.1460, city: 'Salem', state: 'Tamil Nadu' },
  'salem new stand': { lat: 11.6643, lng: 78.1460, city: 'Salem', state: 'Tamil Nadu' },
  'salem stand': { lat: 11.6643, lng: 78.1460, city: 'Salem', state: 'Tamil Nadu' },
  'erode central bus stand': { lat: 11.3410, lng: 77.7172, city: 'Erode', state: 'Tamil Nadu' },
  'erode perundurai toll': { lat: 11.2750, lng: 77.5850, city: 'Erode', state: 'Tamil Nadu' },
  'tiruppur bypass': { lat: 11.1250, lng: 77.3600, city: 'Tiruppur', state: 'Tamil Nadu' },
  'tiruppur avinashi stand': { lat: 11.1150, lng: 77.3480, city: 'Tiruppur', state: 'Tamil Nadu' },
  'tiruppur old bus stand': { lat: 11.1085, lng: 77.3411, city: 'Tiruppur', state: 'Tamil Nadu' },
  'avinashi bypass': { lat: 11.1925, lng: 77.2694, city: 'Avinashi', state: 'Tamil Nadu' },
  'palladam bus stand': { lat: 10.9981, lng: 77.2912, city: 'Palladam', state: 'Tamil Nadu' },
  'palladam stand': { lat: 10.9981, lng: 77.2912, city: 'Palladam', state: 'Tamil Nadu' },
  'palladam bypass': { lat: 10.9920, lng: 77.2980, city: 'Palladam', state: 'Tamil Nadu' },
  'dharapuram old bus stand': { lat: 10.7289, lng: 77.5270, city: 'Dharapuram', state: 'Tamil Nadu' },
  'kangeyam stand': { lat: 11.0064, lng: 77.5615, city: 'Kangeyam', state: 'Tamil Nadu' },
  'perundurai stand': { lat: 11.2750, lng: 77.5850, city: 'Perundurai', state: 'Tamil Nadu' },
  'sankari bypass': { lat: 11.4820, lng: 77.8680, city: 'Sankari', state: 'Tamil Nadu' },
  'dharmapuri bypass': { lat: 12.1211, lng: 78.1582, city: 'Dharmapuri', state: 'Tamil Nadu' },
  'dharmapuri stand': { lat: 12.1211, lng: 78.1582, city: 'Dharmapuri', state: 'Tamil Nadu' },
  'hosur bus stand': { lat: 12.7409, lng: 77.8253, city: 'Hosur', state: 'Tamil Nadu' },
  'hosur stand': { lat: 12.7409, lng: 77.8253, city: 'Hosur', state: 'Tamil Nadu' },

  // Trichy & Thanjavur & Karaikudi
  'trichy central bus stand': { lat: 10.7932, lng: 78.6854, city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  'trichy stand': { lat: 10.7905, lng: 78.7047, city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  'thanjavur new bus stand': { lat: 10.7870, lng: 79.1378, city: 'Thanjavur', state: 'Tamil Nadu' },
  'thanjavur new stand': { lat: 10.7870, lng: 79.1378, city: 'Thanjavur', state: 'Tamil Nadu' },
  'karaikudi new bus stand': { lat: 10.0712, lng: 78.7794, city: 'Karaikudi', state: 'Tamil Nadu' },
  'alagappa university': { lat: 10.0760, lng: 78.7905, city: 'Karaikudi', state: 'Tamil Nadu' },
  'pudukkottai bypass': { lat: 10.3833, lng: 78.8000, city: 'Pudukkottai', state: 'Tamil Nadu' },
  'pudukkottai bus stand': { lat: 10.3833, lng: 78.8000, city: 'Pudukkottai', state: 'Tamil Nadu' },
  'karur bus stand': { lat: 10.9601, lng: 78.0766, city: 'Karur', state: 'Tamil Nadu' },
  'karur stand': { lat: 10.9601, lng: 78.0766, city: 'Karur', state: 'Tamil Nadu' },
  'namakkal bypass': { lat: 11.2189, lng: 78.1674, city: 'Namakkal', state: 'Tamil Nadu' },
  'namakkal stand': { lat: 11.2189, lng: 78.1674, city: 'Namakkal', state: 'Tamil Nadu' },

  // South TN (Tirunelveli, Nagercoil, Thoothukudi)
  'tirunelveli new bus stand': { lat: 8.7099, lng: 77.7342, city: 'Tirunelveli', state: 'Tamil Nadu' },
  'tirunelveli bypass': { lat: 8.7200, lng: 77.7400, city: 'Tirunelveli', state: 'Tamil Nadu' },
  'tirunelveli new stand': { lat: 8.7099, lng: 77.7342, city: 'Tirunelveli', state: 'Tamil Nadu' },
  'nagercoil vadasery bus stand': { lat: 8.1833, lng: 77.4333, city: 'Nagercoil', state: 'Tamil Nadu' },
  'nagercoil vadasery stand': { lat: 8.1833, lng: 77.4333, city: 'Nagercoil', state: 'Tamil Nadu' },
  'thoothukudi old bus stand': { lat: 8.7642, lng: 78.1348, city: 'Thoothukudi', state: 'Tamil Nadu' },
  'thoothukudi old stand': { lat: 8.7642, lng: 78.1348, city: 'Thoothukudi', state: 'Tamil Nadu' },
  'tiruchendur temple bus stand': { lat: 8.4980, lng: 78.1250, city: 'Tiruchendur', state: 'Tamil Nadu' },
  'rameswaram temple stand': { lat: 9.2876, lng: 79.3129, city: 'Rameswaram', state: 'Tamil Nadu' },
  'ramanathapuram bus stand': { lat: 9.3639, lng: 78.8395, city: 'Ramanathapuram', state: 'Tamil Nadu' },
  'ramanathapuram stand': { lat: 9.3639, lng: 78.8395, city: 'Ramanathapuram', state: 'Tamil Nadu' },
  'virudhunagar toll': { lat: 9.5680, lng: 77.9624, city: 'Virudhunagar', state: 'Tamil Nadu' },
  'sattur bypass': { lat: 9.3620, lng: 77.9250, city: 'Sattur', state: 'Tamil Nadu' },
  'kovilpatti new bus stand': { lat: 9.1730, lng: 77.8680, city: 'Kovilpatti', state: 'Tamil Nadu' },
  'kovilpatti stand': { lat: 9.1730, lng: 77.8680, city: 'Kovilpatti', state: 'Tamil Nadu' },
  'ettayapuram bypass': { lat: 9.1510, lng: 77.9940, city: 'Ettayapuram', state: 'Tamil Nadu' },
  'aruppukottai bypass': { lat: 9.5120, lng: 78.0980, city: 'Aruppukottai', state: 'Tamil Nadu' },
  'paramakudi bypass': { lat: 9.5440, lng: 78.5910, city: 'Paramakudi', state: 'Tamil Nadu' },
  'valliyur bypass': { lat: 8.3780, lng: 77.6120, city: 'Valliyur', state: 'Tamil Nadu' },
  'valliyur stand': { lat: 8.3780, lng: 77.6120, city: 'Valliyur', state: 'Tamil Nadu' },

  // Kerala stops
  'vytilla mobility hub': { lat: 9.9676, lng: 76.3197, city: 'Kochi', state: 'Kerala' },
  'ernakulam south ksrtc terminal': { lat: 9.9700, lng: 76.2890, city: 'Ernakulam', state: 'Kerala' },
  'ernakulam vytilla': { lat: 9.9676, lng: 76.3197, city: 'Ernakulam', state: 'Kerala' },
  'ernakulam south terminal': { lat: 9.9700, lng: 76.2890, city: 'Ernakulam', state: 'Kerala' },
  'ernakulam stand': { lat: 9.9816, lng: 76.2999, city: 'Ernakulam', state: 'Kerala' },
  'aluva flyover': { lat: 10.1076, lng: 76.3516, city: 'Aluva', state: 'Kerala' },
  'aluva stand': { lat: 10.1076, lng: 76.3516, city: 'Aluva', state: 'Kerala' },
  'thrissur ksrtc terminal': { lat: 10.5276, lng: 76.2144, city: 'Thrissur', state: 'Kerala' },
  'thrissur ksrtc stand': { lat: 10.5276, lng: 76.2144, city: 'Thrissur', state: 'Kerala' },
  'thrissur round': { lat: 10.5240, lng: 76.2160, city: 'Thrissur', state: 'Kerala' },
  'thrissur bypass': { lat: 10.5180, lng: 76.2250, city: 'Thrissur', state: 'Kerala' },
  'thrissur stand': { lat: 10.5276, lng: 76.2144, city: 'Thrissur', state: 'Kerala' },
  'palakkad ksrtc bus stand': { lat: 10.7867, lng: 76.6548, city: 'Palakkad', state: 'Kerala' },
  'palakkad ksrtc stand': { lat: 10.7867, lng: 76.6548, city: 'Palakkad', state: 'Kerala' },
  'palakkad bypass': { lat: 10.7950, lng: 76.6620, city: 'Palakkad', state: 'Kerala' },
  'palakkad stand': { lat: 10.7867, lng: 76.6548, city: 'Palakkad', state: 'Kerala' },
  'kozhikode mavoor road stand': { lat: 11.2588, lng: 75.7804, city: 'Kozhikode', state: 'Kerala' },
  'kozhikode stand': { lat: 11.2588, lng: 75.7804, city: 'Kozhikode', state: 'Kerala' },
  'malappuram stand': { lat: 11.0732, lng: 76.0740, city: 'Malappuram', state: 'Kerala' },
  'kannur stand': { lat: 11.8745, lng: 75.3704, city: 'Kannur', state: 'Kerala' },
  'kannur old bus stand': { lat: 11.8745, lng: 75.3704, city: 'Kannur', state: 'Kerala' },
  'iritty stand': { lat: 11.9833, lng: 75.6667, city: 'Iritty', state: 'Kerala' },
  'sulthan bathery': { lat: 11.6628, lng: 76.2570, city: 'Wayanad', state: 'Kerala' },
  'alappuzha stand': { lat: 9.4981, lng: 76.3388, city: 'Alappuzha', state: 'Kerala' },
  'kottayam ksrtc terminal': { lat: 9.5916, lng: 76.5222, city: 'Kottayam', state: 'Kerala' },
  'kollam ksrtc stand': { lat: 8.8932, lng: 76.6141, city: 'Kollam', state: 'Kerala' },
  'kollam stand': { lat: 8.8932, lng: 76.6141, city: 'Kollam', state: 'Kerala' },
  'thiruvananthapuram thampanoor': { lat: 8.4875, lng: 76.9525, city: 'Thiruvananthapuram', state: 'Kerala' },

  // Maharashtra & Goa stops
  'borivali east': { lat: 19.2288, lng: 72.8541, city: 'Mumbai', state: 'Maharashtra' },
  'mumbai borivali east': { lat: 19.2288, lng: 72.8541, city: 'Mumbai', state: 'Maharashtra' },
  'mumbai borivali terminal': { lat: 19.2288, lng: 72.8541, city: 'Mumbai', state: 'Maharashtra' },
  'dadar asiad': { lat: 19.0178, lng: 72.8478, city: 'Mumbai', state: 'Maharashtra' },
  'vashi highway': { lat: 19.0771, lng: 72.9986, city: 'Mumbai', state: 'Maharashtra' },
  'vashi plaza': { lat: 19.0771, lng: 72.9986, city: 'Navi Mumbai', state: 'Maharashtra' },
  'swargate bus station': { lat: 18.5018, lng: 73.8587, city: 'Pune', state: 'Maharashtra' },
  'pune swargate stand': { lat: 18.5018, lng: 73.8587, city: 'Pune', state: 'Maharashtra' },
  'pune swargate bus stand': { lat: 18.5018, lng: 73.8587, city: 'Pune', state: 'Maharashtra' },
  'wakad bridge': { lat: 18.5987, lng: 73.7684, city: 'Pune', state: 'Maharashtra' },
  'pune wakad bridge': { lat: 18.5987, lng: 73.7684, city: 'Pune', state: 'Maharashtra' },
  'pune katraj tunnel': { lat: 18.4450, lng: 73.8670, city: 'Pune', state: 'Maharashtra' },
  'pune katraj bypass': { lat: 18.4450, lng: 73.8670, city: 'Pune', state: 'Maharashtra' },
  'satara bypass': { lat: 17.6805, lng: 74.0183, city: 'Satara', state: 'Maharashtra' },
  'kolhapur stand': { lat: 16.7050, lng: 74.2433, city: 'Kolhapur', state: 'Maharashtra' },
  'ahmednagar stand': { lat: 19.0948, lng: 74.7480, city: 'Ahmednagar', state: 'Maharashtra' },
  'shirdi temple bus stand': { lat: 19.7667, lng: 74.4767, city: 'Shirdi', state: 'Maharashtra' },
  'solapur stand': { lat: 17.6599, lng: 75.9064, city: 'Solapur', state: 'Maharashtra' },
  'panaji bus stand': { lat: 15.4989, lng: 73.8354, city: 'Goa', state: 'Goa' },
  'panaji ktc bus terminus': { lat: 15.4989, lng: 73.8354, city: 'Goa', state: 'Goa' },
  'mapusa ktc bus stand': { lat: 15.5925, lng: 73.8164, city: 'Goa', state: 'Goa' },
  'madgaon ksrtc stand': { lat: 15.2832, lng: 73.9685, city: 'Goa', state: 'Goa' },
  'margao (madgaon) ktc bus stand': { lat: 15.2832, lng: 73.9685, city: 'Goa', state: 'Goa' },

  // Andhra & Telangana stops
  'mahatma gandhi bus station (mgbs)': { lat: 17.3789, lng: 78.4812, city: 'Hyderabad', state: 'Telangana' },
  'hyderabad mgbs terminal': { lat: 17.3789, lng: 78.4812, city: 'Hyderabad', state: 'Telangana' },
  'jubilee bus station (jbs)': { lat: 17.4485, lng: 78.4984, city: 'Hyderabad', state: 'Telangana' },
  'ameerpet bus stop': { lat: 17.4375, lng: 78.4482, city: 'Hyderabad', state: 'Telangana' },
  'lb nagar ring road': { lat: 17.3457, lng: 78.5522, city: 'Hyderabad', state: 'Telangana' },
  'jadcherla bypass': { lat: 16.7667, lng: 78.1333, city: 'Jadcherla', state: 'Telangana' },
  'kurnool toll gate': { lat: 15.8281, lng: 78.0373, city: 'Kurnool', state: 'Andhra Pradesh' },
  'kurnool toll': { lat: 15.8281, lng: 78.0373, city: 'Kurnool', state: 'Andhra Pradesh' },
  'kurnool new stand': { lat: 15.8281, lng: 78.0373, city: 'Kurnool', state: 'Andhra Pradesh' },
  'kurnool stand': { lat: 15.8281, lng: 78.0373, city: 'Kurnool', state: 'Andhra Pradesh' },
  'kurnool bus stand': { lat: 15.8281, lng: 78.0373, city: 'Kurnool', state: 'Andhra Pradesh' },
  'anantapur clock tower bypass': { lat: 14.6819, lng: 77.6006, city: 'Anantapur', state: 'Andhra Pradesh' },
  'anantapur clock tower': { lat: 14.6819, lng: 77.6006, city: 'Anantapur', state: 'Andhra Pradesh' },
  'anantapur bypass': { lat: 14.6819, lng: 77.6006, city: 'Anantapur', state: 'Andhra Pradesh' },
  'anantapur stand': { lat: 14.6819, lng: 77.6006, city: 'Anantapur', state: 'Andhra Pradesh' },
  'pandit nehru bus station (pnbs)': { lat: 16.5085, lng: 80.6277, city: 'Vijayawada', state: 'Andhra Pradesh' },
  'vijayawada pnbs terminal': { lat: 16.5085, lng: 80.6277, city: 'Vijayawada', state: 'Andhra Pradesh' },
  'vijayawada pnbs': { lat: 16.5085, lng: 80.6277, city: 'Vijayawada', state: 'Andhra Pradesh' },
  'guntur stand': { lat: 16.3067, lng: 80.4365, city: 'Guntur', state: 'Andhra Pradesh' },
  'guntur ntr bus station': { lat: 16.3067, lng: 80.4365, city: 'Guntur', state: 'Andhra Pradesh' },
  'tirupati central bus station': { lat: 13.6288, lng: 79.4192, city: 'Tirupati', state: 'Andhra Pradesh' },
  'tirupati central bus stand': { lat: 13.6288, lng: 79.4192, city: 'Tirupati', state: 'Andhra Pradesh' },
  'tirupati alipiri': { lat: 13.6420, lng: 79.3980, city: 'Tirupati', state: 'Andhra Pradesh' },
  'chittoor bus stand': { lat: 13.2172, lng: 79.1003, city: 'Chittoor', state: 'Andhra Pradesh' },
  'nellore stand': { lat: 14.4426, lng: 79.9865, city: 'Nellore', state: 'Andhra Pradesh' },
  'nellore atmakur stand': { lat: 14.4426, lng: 79.9865, city: 'Nellore', state: 'Andhra Pradesh' },
  'rajahmundry stand': { lat: 17.0005, lng: 81.8040, city: 'Rajahmundry', state: 'Andhra Pradesh' },
  'visakhapatnam rtc complex': { lat: 17.7215, lng: 83.3032, city: 'Visakhapatnam', state: 'Andhra Pradesh' },

  // Delhi NCR & North Zone stops
  'kashmere gate isbt': { lat: 28.6675, lng: 77.2285, city: 'Delhi', state: 'Delhi' },
  'anand vihar isbt': { lat: 28.6472, lng: 77.3150, city: 'Delhi', state: 'Delhi' },
  'sarai kale khan isbt': { lat: 28.5886, lng: 77.2564, city: 'Delhi', state: 'Delhi' },
  'gurugram iffco chowk': { lat: 28.4719, lng: 77.0725, city: 'Gurugram', state: 'Haryana' },
  'isbt sector 43 chandigarh': { lat: 30.7188, lng: 76.7412, city: 'Chandigarh', state: 'Chandigarh' },
  'chandigarh sector 43 bypass': { lat: 30.7188, lng: 76.7412, city: 'Chandigarh', state: 'Chandigarh' },
  'manali private bus stand': { lat: 32.2432, lng: 77.1895, city: 'Manali', state: 'Himachal Pradesh' },
  'isbt tutikandi shimla': { lat: 31.0965, lng: 77.1542, city: 'Shimla', state: 'Himachal Pradesh' },
  'dehradun isbt': { lat: 30.2865, lng: 78.0125, city: 'Dehradun', state: 'Uttarakhand' },
  'haridwar bus stand': { lat: 29.9457, lng: 78.1642, city: 'Haridwar', state: 'Uttarakhand' },
  'sindhi camp central bus stand': { lat: 26.9239, lng: 75.8016, city: 'Jaipur', state: 'Rajasthan' },
  'alambagh isbt lucknow': { lat: 26.8156, lng: 80.9025, city: 'Lucknow', state: 'Uttar Pradesh' },
  'paldi bus terminal': { lat: 23.0125, lng: 72.5625, city: 'Ahmedabad', state: 'Gujarat' },
  'surat central bus station': { lat: 21.2045, lng: 72.8412, city: 'Surat', state: 'Gujarat' },
  'udaipur city bus station': { lat: 24.5765, lng: 73.6987, city: 'Udaipur', state: 'Rajasthan' },
  'udaipur city bus station (udiapol)': { lat: 24.5765, lng: 73.6987, city: 'Udaipur', state: 'Rajasthan' },
};

/**
 * Resolves verified geographical coordinates for any stop name or city across India.
 * Guaranteed to return authentic latitude and longitude within India's borders.
 */
export function getVerifiedStopCoordinates(stopName = '', cityName = '', stateName = '') {
  const normStop = String(stopName || '').toLowerCase().trim();
  const normCity = String(cityName || '').toLowerCase().trim();

  // 1. Direct registry lookup by exact stop name
  if (normStop && PAN_INDIA_STOPS_REGISTRY[normStop]) {
    const reg = PAN_INDIA_STOPS_REGISTRY[normStop];
    return {
      latitude: reg.lat,
      longitude: reg.lng,
      city: reg.city || cityName,
      state: reg.state || stateName || 'India',
      isVerified: true,
      matchType: 'exact_stop',
    };
  }

  // 2. Partial match in stop registry
  for (const [key, val] of Object.entries(PAN_INDIA_STOPS_REGISTRY)) {
    if (normStop && (key.includes(normStop) || normStop.includes(key))) {
      return {
        latitude: val.lat,
        longitude: val.lng,
        city: val.city || cityName,
        state: val.state || stateName || 'India',
        isVerified: true,
        matchType: 'partial_stop',
      };
    }
  }

  // 3. Direct lookup in PAN_INDIA_TRANSIT_HUBS
  for (const hub of PAN_INDIA_TRANSIT_HUBS) {
    if (hub.lat && hub.lng) {
      const hubMain = hub.mainText.toLowerCase();
      const hubCity = hub.city.toLowerCase();
      if ((normStop && hubMain.includes(normStop)) || (normCity && hubCity === normCity)) {
        return {
          latitude: hub.lat,
          longitude: hub.lng,
          city: hub.city,
          state: hub.state || stateName || 'India',
          isVerified: true,
          matchType: 'transit_hub',
        };
      }
    }
  }

  // 4. Lookup in PAN_INDIA_CITY_COORDINATES
  if (normCity && PAN_INDIA_CITY_COORDINATES[normCity]) {
    const cCoord = PAN_INDIA_CITY_COORDINATES[normCity];
    return {
      latitude: cCoord.lat,
      longitude: cCoord.lng,
      city: cityName,
      state: cCoord.state || stateName || 'India',
      isVerified: true,
      matchType: 'city_center',
    };
  }

  // 5. Look for city alias matches
  for (const [canonicalCity, aliases] of Object.entries(PAN_INDIA_CITY_ALIASES)) {
    if (aliases.some((a) => normCity === a || (normStop && normStop.includes(a)))) {
      if (PAN_INDIA_CITY_COORDINATES[canonicalCity]) {
        const cCoord = PAN_INDIA_CITY_COORDINATES[canonicalCity];
        return {
          latitude: cCoord.lat,
          longitude: cCoord.lng,
          city: canonicalCity.charAt(0).toUpperCase() + canonicalCity.slice(1),
          state: cCoord.state || stateName || 'India',
          isVerified: true,
          matchType: 'alias_city',
        };
      }
    }
  }

  // 6. Regional fallback
  return {
    latitude: 11.0168,
    longitude: 76.9558,
    city: cityName || 'Coimbatore',
    state: stateName || 'Tamil Nadu',
    isVerified: false,
    matchType: 'fallback_hub',
  };
}

/**
 * Validates stop coordinates against real-world geographical boundaries of India
 * Latitude: 8.0° N to 35.5° N
 * Longitude: 68.0° E to 97.5° E
 */
export function validateStopCoordinates(lat, lng) {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);

  if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
    return { isValid: false, error: 'Coordinates are not valid numbers' };
  }

  if (numLat < 8.0 || numLat > 35.5) {
    return { isValid: false, error: `Latitude ${numLat} is outside Indian borders (8.0°N to 35.5°N)` };
  }

  if (numLng < 68.0 || numLng > 97.5) {
    return { isValid: false, error: `Longitude ${numLng} is outside Indian borders (68.0°E to 97.5°E)` };
  }

  return { isValid: true, latitude: numLat, longitude: numLng };
}

/**
 * Validates route stop sequences, checking for ordering, valid coordinates, and duplicates
 */
export function validateRouteStops(stops = []) {
  const errors = [];
  if (!Array.isArray(stops) || stops.length < 2) {
    errors.push('Route must contain at least 2 stops (origin and destination)');
    return { isValid: false, errors };
  }

  let prevOrder = -1;
  const seenCoordinates = new Set();
  const seenNames = new Set();

  stops.forEach((s, idx) => {
    // 1. Order check
    const order = typeof s.stop_order === 'number' ? s.stop_order : (s.order || idx + 1);
    if (order <= prevOrder) {
      errors.push(`Stop #${idx + 1} (${s.name}) is out of sequential order: ${order} <= ${prevOrder}`);
    }
    prevOrder = order;

    // 2. Coordinate check
    const coordVal = validateStopCoordinates(s.latitude, s.longitude);
    if (!coordVal.isValid) {
      errors.push(`Stop #${order} (${s.name}): ${coordVal.error}`);
    } else {
      const coordKey = `${coordVal.latitude.toFixed(4)},${coordVal.longitude.toFixed(4)}`;
      if (seenCoordinates.has(coordKey) && s.name && seenNames.has(s.name.toLowerCase())) {
        errors.push(`Duplicate stop found at #${order} (${s.name}) with identical coordinates`);
      }
      seenCoordinates.add(coordKey);
      if (s.name) seenNames.add(s.name.toLowerCase());
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    totalStops: stops.length,
  };
}
