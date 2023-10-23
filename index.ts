import express,  { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { convertFile } from 'xlsx-to-csv';
import csv from 'csv-parser';
import { Coordinate } from 'ol/coordinate';
import proj4 from 'proj4';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Set the destination directory to "uploads"
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename
  },
});

const upload = multer({ storage: storage });

async function replaceSemicolonsWithCommas(inputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.readFile(inputPath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err.message);
        reject(err);
        return;
      }

      // Perform the replacement
      const modifiedContent = data.replace(/;/g, ',');

      // Write the modified content back to the file
      fs.writeFile(inputPath, modifiedContent, 'utf-8', (writeErr) => {
        if (writeErr) {
          console.error('Error writing file:', writeErr.message);
          reject(writeErr);
          return;
        }
        console.log('Semicolons replaced with commas in the file:', inputPath);
        resolve();
      });
    });
  });
}

// Define the UTM and WGS84 projections
proj4.defs('EPSG:32633', '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

function convertUTMToWGS84(coordinates: Coordinate): Coordinate {
    const wgs84Coordinate = proj4('EPSG:32633', 'EPSG:4326', coordinates);
    return wgs84Coordinate as Coordinate;
}

async function convertXLSXtoGeoJSON(inputXLSXFile: string): Promise<string | undefined> {
  return new Promise<string | undefined>(async (resolve) => {
    const outputGeoJSON = path.join(__dirname, 'output/json/geojson/bookshelvesLichtenberg.geojson');
    const inputXlsx = path.join('./', inputXLSXFile);
    let outputPath: string | undefined;

    try {
      // Convert XLSX to CSV
      const { filePath } = await convertFile(inputXlsx);
      outputPath = filePath;

      // Replace semicolon separator by comma
      await replaceSemicolonsWithCommas(outputPath);

      // Continue with other functions that interact with the file
      // Read the CSV file
      const data: any[] = [];
      fs.createReadStream(outputPath)
        .pipe(csv())
        .on('data', (row: Record<string, string | number>) => {
          data.push(row);
        })
        .on('end', () => {
          // Convert CSV data to GeoJSON
          const geojsonFeatures = data.map((row) => {

            const coordinates = [parseFloat(String(row['X-Koordinate'])),
            parseFloat(String(row['Y-Koordinate']))];
            
            let convertedCoordinates = convertUTMToWGS84(coordinates);

            const feature = {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: convertedCoordinates,
              },
              properties: {
                id: String(row['Lfd. Nr.']),
                name: String(row['Name ']),
                address: `${row.Straße}\n${row.PLZ} ${row.Ort}`,
                owner: String(row['Träger bzw. Verantwortlicher']),
              },
            };

            return feature;
          });

          const geojson = {
            type: 'FeatureCollection',
            features: geojsonFeatures,
          };

          // Write GeoJSON to a file
          fs.writeFileSync(outputGeoJSON, JSON.stringify(geojson, null, 2));

          // Resolve the promise with the GeoJSON content
          resolve(outputGeoJSON);
        });
    } catch (error: unknown) {
      console.error('Error:', (error as Error).message);
      resolve(undefined);
    }
  });
}

function readGeoJSONFile(filePath: string) {
  try {
    const geojsonString = fs.readFileSync(filePath, 'utf-8');
    const geojsonObject = JSON.parse(geojsonString);
    return geojsonObject;

  } catch (error) {
    console.error('Error reading GeoJSON file:', error);
    return null;
  }
}

app.post('/convert', upload.single('file'), async (req: Request, res: Response) => {

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const uploadedFilePath = path.join('uploads', req.file.originalname);

  fs.access(uploadedFilePath, fs.constants.F_OK, async (err) => {
    if (err) {
      console.error('File does not exist:', err.message);
      return res.status(500).json({ error: 'File upload failed.' });
    }

    try {
      // Convert the uploaded XLSX file to GeoJSON
      const geojsonPath = await convertXLSXtoGeoJSON(uploadedFilePath);
      let geojson

      if (geojsonPath != undefined){
        geojson = readGeoJSONFile(geojsonPath)
      }

      if (geojson) {
        res.json(geojson);
      } else {
        res.status(500).json({ error: 'Conversion failed.' });
      }
    } catch (error: unknown) {
      console.error('Conversion error:', (error as Error).message);
      res.status(500).json({ error: 'Conversion error.' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
