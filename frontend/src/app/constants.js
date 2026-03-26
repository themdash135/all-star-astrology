export const FORM_KEY = 'allstar-form';
export const RESULT_KEY = 'allstar-result';
export const SPLASH_KEY = 'allstar-splash';
export const THEME_KEY = 'allstar-theme';
export const MOTION_KEY = 'allstar-motion';
export const ORACLE_HISTORY_KEY = 'allstar-oracle-history';
export const ORACLE_HISTORY_LIMIT = 12;

export const BLANK = {
  birth_date: '',
  birth_time: '',
  birth_location: '',
  full_name: '',
  hebrew_name: '',
};

export const SYSTEMS = [
  { id: 'western', name: 'Western', icon: '\u2648', desc: 'Tropical zodiac', color: '#6B8CFF', hasChart: true },
  { id: 'vedic', name: 'Vedic', icon: '\ud83e\udea7', desc: 'Sidereal chart', color: '#FF9B5E', hasChart: true },
  { id: 'chinese', name: 'Chinese', icon: '\ud83d\udc09', desc: 'Lunar zodiac', color: '#FF6B6B', hasChart: false },
  { id: 'bazi', name: 'BaZi', icon: '\u67f1', desc: 'Four Pillars', color: '#5ECC8F', hasChart: true },
  { id: 'numerology', name: 'Numerology', icon: '\ud83d\udd22', desc: 'Life path numbers', color: '#B47EFF', hasChart: false },
  { id: 'kabbalistic', name: 'Kabbalistic', icon: '\u2721', desc: 'Tree of Life', color: '#FFD76B', hasChart: true },
  { id: 'gematria', name: 'Gematria', icon: '\u05d0', desc: 'Sacred letters', color: '#7BE0E0', hasChart: false },
  { id: 'persian', name: 'Persian', icon: '\u263d', desc: 'Islamic astrology', color: '#E07BB4', hasChart: false },
];

export const SYSTEM_PAGES = ['Overview', 'Details', 'Calendar', 'Games'];

export const AREAS = [
  { key: 'love', label: 'Love', icon: '\u2661' },
  { key: 'career', label: 'Career', icon: '\u2605' },
  { key: 'health', label: 'Health', icon: '\u2726' },
  { key: 'wealth', label: 'Wealth', icon: '\u25c6' },
  { key: 'mood', label: 'Mood', icon: '\u263d' },
];

export const CITIES = [
  // US — major cities by state
  'Birmingham, AL', 'Montgomery, AL', 'Huntsville, AL',
  'Anchorage, AK', 'Fairbanks, AK',
  'Phoenix, AZ', 'Tucson, AZ', 'Mesa, AZ', 'Scottsdale, AZ',
  'Little Rock, AR', 'Fayetteville, AR',
  'Los Angeles, CA', 'San Francisco, CA', 'San Diego, CA', 'San Jose, CA',
  'Sacramento, CA', 'Oakland, CA', 'Fresno, CA', 'Long Beach, CA', 'Bakersfield, CA',
  'Anaheim, CA', 'Riverside, CA', 'Irvine, CA', 'Santa Monica, CA',
  'Denver, CO', 'Colorado Springs, CO', 'Aurora, CO', 'Boulder, CO',
  'Hartford, CT', 'New Haven, CT', 'Stamford, CT', 'Bridgeport, CT',
  'Wilmington, DE', 'Dover, DE',
  'Washington, DC',
  'Miami, FL', 'Orlando, FL', 'Tampa, FL', 'Jacksonville, FL', 'Fort Lauderdale, FL',
  'St. Petersburg, FL', 'Tallahassee, FL', 'Hialeah, FL',
  'Atlanta, GA', 'Savannah, GA', 'Augusta, GA', 'Columbus, GA',
  'Honolulu, HI', 'Maui, HI',
  'Boise, ID', 'Meridian, ID',
  'Chicago, IL', 'Springfield, IL', 'Naperville, IL', 'Rockford, IL', 'Aurora, IL',
  'Indianapolis, IN', 'Fort Wayne, IN', 'Evansville, IN',
  'Des Moines, IA', 'Cedar Rapids, IA', 'Davenport, IA',
  'Wichita, KS', 'Kansas City, KS', 'Topeka, KS', 'Overland Park, KS',
  'Louisville, KY', 'Lexington, KY', 'Bowling Green, KY',
  'New Orleans, LA', 'Baton Rouge, LA', 'Shreveport, LA',
  'Portland, ME', 'Bangor, ME',
  'Baltimore, MD', 'Bethesda, MD', 'Silver Spring, MD', 'Rockville, MD',
  'Boston, MA', 'Cambridge, MA', 'Worcester, MA', 'Springfield, MA',
  'Detroit, MI', 'Grand Rapids, MI', 'Ann Arbor, MI', 'Lansing, MI',
  'Minneapolis, MN', 'St. Paul, MN', 'Rochester, MN', 'Duluth, MN',
  'Jackson, MS', 'Gulfport, MS',
  'Kansas City, MO', 'St. Louis, MO', 'Springfield, MO',
  'Billings, MT', 'Missoula, MT',
  'Omaha, NE', 'Lincoln, NE',
  'Las Vegas, NV', 'Reno, NV', 'Henderson, NV',
  'Manchester, NH', 'Concord, NH',
  'Newark, NJ', 'Jersey City, NJ', 'Trenton, NJ', 'Princeton, NJ', 'Paterson, NJ',
  'Albuquerque, NM', 'Santa Fe, NM', 'Las Cruces, NM',
  'New York, NY', 'Brooklyn, NY', 'Queens, NY', 'Buffalo, NY', 'Rochester, NY',
  'Albany, NY', 'Syracuse, NY', 'Bronx, NY', 'Manhattan, NY',
  'Charlotte, NC', 'Raleigh, NC', 'Durham, NC', 'Greensboro, NC', 'Wilmington, NC',
  'Fargo, ND', 'Bismarck, ND',
  'Columbus, OH', 'Cleveland, OH', 'Cincinnati, OH', 'Toledo, OH', 'Akron, OH', 'Dayton, OH',
  'Oklahoma City, OK', 'Tulsa, OK', 'Norman, OK',
  'Portland, OR', 'Salem, OR', 'Eugene, OR',
  'Philadelphia, PA', 'Pittsburgh, PA', 'Allentown, PA', 'Harrisburg, PA', 'Erie, PA',
  'Providence, RI', 'Warwick, RI',
  'Charleston, SC', 'Columbia, SC', 'Greenville, SC',
  'Sioux Falls, SD', 'Rapid City, SD',
  'Nashville, TN', 'Memphis, TN', 'Knoxville, TN', 'Chattanooga, TN',
  'Houston, TX', 'Dallas, TX', 'Austin, TX', 'San Antonio, TX', 'Fort Worth, TX',
  'El Paso, TX', 'Arlington, TX', 'Plano, TX', 'Corpus Christi, TX',
  'Salt Lake City, UT', 'Provo, UT', 'Ogden, UT',
  'Burlington, VT', 'Montpelier, VT',
  'Virginia Beach, VA', 'Richmond, VA', 'Norfolk, VA', 'Arlington, VA', 'Alexandria, VA',
  'Seattle, WA', 'Tacoma, WA', 'Spokane, WA', 'Bellevue, WA',
  'Charleston, WV', 'Huntington, WV',
  'Milwaukee, WI', 'Madison, WI', 'Green Bay, WI',
  'Cheyenne, WY', 'Casper, WY',
  // US territories
  'San Juan, Puerto Rico', 'Ponce, Puerto Rico',
  // Canada
  'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada',
  'Ottawa, Canada', 'Edmonton, Canada', 'Winnipeg, Canada', 'Halifax, Canada',
  // Mexico & Central America
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Cancún, Mexico',
  'Guatemala City, Guatemala', 'San Salvador, El Salvador', 'San José, Costa Rica',
  'Panama City, Panama', 'Tegucigalpa, Honduras', 'Managua, Nicaragua',
  // Caribbean
  'Kingston, Jamaica', 'Havana, Cuba', 'Santo Domingo, Dominican Republic',
  'Nassau, Bahamas', 'Port of Spain, Trinidad',
  // South America
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Buenos Aires, Argentina',
  'Bogotá, Colombia', 'Lima, Peru', 'Santiago, Chile', 'Caracas, Venezuela',
  'Quito, Ecuador', 'Montevideo, Uruguay', 'Asunción, Paraguay',
  'La Paz, Bolivia', 'Georgetown, Guyana',
  // Europe
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Glasgow, UK',
  'Paris, France', 'Lyon, France', 'Marseille, France',
  'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Florence, Italy',
  'Madrid, Spain', 'Barcelona, Spain', 'Seville, Spain',
  'Lisbon, Portugal', 'Porto, Portugal',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium',
  'Vienna, Austria', 'Zurich, Switzerland', 'Geneva, Switzerland',
  'Stockholm, Sweden', 'Oslo, Norway', 'Copenhagen, Denmark', 'Helsinki, Finland',
  'Dublin, Ireland', 'Warsaw, Poland', 'Kraków, Poland',
  'Prague, Czech Republic', 'Budapest, Hungary', 'Bucharest, Romania',
  'Athens, Greece', 'Istanbul, Turkey', 'Ankara, Turkey',
  'Moscow, Russia', 'St. Petersburg, Russia', 'Kyiv, Ukraine',
  // Middle East
  'Tel Aviv, Israel', 'Jerusalem, Israel', 'Haifa, Israel',
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Doha, Qatar', 'Riyadh, Saudi Arabia',
  'Jeddah, Saudi Arabia', 'Kuwait City, Kuwait', 'Muscat, Oman',
  'Amman, Jordan', 'Beirut, Lebanon', 'Baghdad, Iraq', 'Tehran, Iran',
  // Africa
  'Lagos, Nigeria', 'Cairo, Egypt', 'Nairobi, Kenya', 'Johannesburg, South Africa',
  'Cape Town, South Africa', 'Accra, Ghana', 'Addis Ababa, Ethiopia',
  'Casablanca, Morocco', 'Dar es Salaam, Tanzania', 'Kampala, Uganda',
  'Dakar, Senegal', 'Abidjan, Ivory Coast', 'Lusaka, Zambia',
  // South & Central Asia
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Chennai, India',
  'Kolkata, India', 'Hyderabad, India', 'Pune, India', 'Ahmedabad, India',
  'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan',
  'Dhaka, Bangladesh', 'Colombo, Sri Lanka', 'Kathmandu, Nepal',
  // East & Southeast Asia
  'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Yokohama, Japan',
  'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China',
  'Hong Kong, China', 'Taipei, Taiwan',
  'Seoul, South Korea', 'Busan, South Korea',
  'Singapore', 'Bangkok, Thailand', 'Kuala Lumpur, Malaysia',
  'Jakarta, Indonesia', 'Manila, Philippines', 'Ho Chi Minh City, Vietnam',
  'Hanoi, Vietnam', 'Phnom Penh, Cambodia', 'Yangon, Myanmar',
  // Oceania
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand',
];
