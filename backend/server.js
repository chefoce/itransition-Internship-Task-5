const express = require('express');
const cors = require('cors');
const seedrandom = require('seedrandom');
const { faker } = require('@faker-js/faker'); // Use faker singleton
const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
      origin: 'https://itransition-internship-task-5-frontend.onrender.com',
  })
);
app.use(express.json());

// Helper function to convert string to number for seeding
function stringToNumber(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getLocale(region) {
  switch (region) {
    case 'Mexico':
      return 'es'; // Use 'es' for Spanish
    case 'USA':
      return 'en_US';
    case 'UK':
      return 'en_GB';
    default:
      return 'en';
  }
}

app.get('/api/data', (req, res) => {
  console.log('Received request with query:', req.query);
  const { region, errorsPerRecord, seed, pageNumber } = req.query;
  const recordsPerPage = pageNumber == 1 ? 20 : 10;
  const combinedSeed = `${seed}-${pageNumber}`;
  const data = [];

  for (let i = 0; i < recordsPerPage; i++) {
    const index = (pageNumber - 1) * recordsPerPage + i + 1;
    try {
      const record = generateRecord(index, region, parseFloat(errorsPerRecord), combinedSeed);
      data.push(record);
    } catch (error) {
      console.error(`Error generating record ${index}:`, error);
    }
  }

  res.json(data);
});

function generateRecord(index, region, errorsPerRecord, combinedSeed) {
  const locale = getLocale(region);
  faker.locale = locale; // Set locale directly on faker
  faker.seed(stringToNumber(combinedSeed + index)); // Seed faker

  const identifier = faker.string.uuid();
  const name = `${faker.person.firstName()} ${faker.person.middleName()} ${faker.person.lastName()}`;
  const address = generateAddress(region);
  const phone = generatePhone(region);

  const record = {
    index,
    identifier,
    name,
    address,
    phone,
  };

  // Apply errors
  const errorsToApply = Math.floor(errorsPerRecord);
  const fractionalError = errorsPerRecord - errorsToApply;
  let totalErrors = errorsToApply;

  const rng = seedrandom(`${combinedSeed}-${index}`);

  if (fractionalError > rng()) {
    totalErrors += 1;
  }

  for (let e = 0; e < totalErrors; e++) {
    applyRandomError(record, rng, region);
  }

  return record;
}

function applyRandomError(record, rng, region) {
  const fields = ['name', 'address', 'phone'];
  const field = fields[Math.floor(rng() * fields.length)];
  record[field] = introduceError(record[field], rng, region);
}

function introduceError(text, rng, region) {
  const errorTypes = ['delete', 'insert', 'swap'];
  const errorType = errorTypes[Math.floor(rng() * errorTypes.length)];
  const position = Math.floor(rng() * text.length);

  switch (errorType) {
    case 'delete':
      if (text.length > 0) {
        return text.slice(0, position) + text.slice(position + 1);
      }
      return text;
    case 'insert':
      const alphabet = getAlphabet(region);
      const randomChar = alphabet[Math.floor(rng() * alphabet.length)];
      return text.slice(0, position) + randomChar + text.slice(position);
    case 'swap':
      if (position < text.length - 1) {
        const chars = text.split('');
        const temp = chars[position];
        chars[position] = chars[position + 1];
        chars[position + 1] = temp;
        return chars.join('');
      }
      return text;
    default:
      return text;
  }
}

function getAlphabet(region) {
  switch (region) {
    case 'Mexico':
      return 'abcdefghijklmnopqrstuvwxyzñáéíóúü';
    case 'USA':
    case 'UK':
      return 'abcdefghijklmnopqrstuvwxyz';
    default:
      return 'abcdefghijklmnopqrstuvwxyz';
  }
}

function generateAddress(region) {
  switch (region) {
    case 'Mexico':
      return `${faker.location.streetAddress()} ${faker.location.city()} ${faker.location.state()}`;
    case 'USA':
      return `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.stateAbbr()} ${faker.location.zipCode()}`;
    case 'UK':
      return `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.county()}, ${faker.location.postcode()}`;
    default:
      return faker.location.streetAddress();
  }
}

function generatePhone(region) {
  switch (region) {
    case 'Mexico':
      return faker.phone.number('+52-###-###-####');
    case 'USA':
      return faker.phone.number('(+1) ###-###-####');
    case 'UK':
      return faker.phone.number('+44 #### ######');
    default:
      return faker.phone.number();
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
