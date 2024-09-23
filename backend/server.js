import express from 'express';
import cors from 'cors';
import seedrandom from 'seedrandom';
import { Faker, en, en_GB, es_MX } from '@faker-js/faker';

const fakerEN_US = new Faker({ locale: [en] });
const fakerEN_GB = new Faker({ locale: [en_GB, en] });
const fakerES_MX = new Faker({ locale: [es_MX, en] });

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
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  return Math.abs(hash);
}

function getLocale(region) {
  switch (region) {
    case 'Mexico':
      return fakerES_MX;
    case 'United_States':
      return fakerEN_US;
    case 'Great_Britain':
      return fakerEN_GB;
    default:
      return fakerEN_US;
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
      const record = generateRecord(
        index,
        region,
        parseFloat(errorsPerRecord),
        combinedSeed
      );
      data.push(record);
    } catch (error) {
      console.error(`Error generating record ${index}:`, error);
    }
  }

  res.json(data);
});

function generateRecord(index, region, errorsPerRecord, combinedSeed) {
  const faker = getLocale(region);
  faker.seed(stringToNumber(combinedSeed + index)); // Seed faker

  const identifier = faker.string.uuid();
  const name = `${faker.person.firstName()} ${faker.person.middleName()} ${faker.person.lastName()}`;
  const address = generateAddress(region, faker);
  const phone = generatePhone(region, faker);

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
    case 'United_States':
    case 'Great_Britain':
      return 'abcdefghijklmnopqrstuvwxyz';
    default:
      return 'abcdefghijklmnopqrstuvwxyz';
  }
}

function generateAddress(region, faker) {
  switch (region) {
    case 'Mexico':
      return `${faker.location.streetAddress()} ${faker.location.city()} ${faker.location.state()}`;
    case 'United_States':
      return `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`;
    case 'Great_Britain':
      return `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.county()}, ${faker.location.zipCode()}`;
    default:
      return faker.location.streetAddress();
  }
}

function generatePhone(region, faker) {
  switch (region) {
    case 'Mexico':
      return `+52-${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
    case 'United_States':
      return `(+1) ${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
    case 'Great_Britain':
      return `+44 ${faker.string.numeric(4)} ${faker.string.numeric(6)}`;
    default:
      return faker.string.numeric(10);
  }
}


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
