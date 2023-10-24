# Visualize an XLSX file

## Description
This project was build using data provided by the city of Berlin. The data is about bookcases in the district of Lichtenberg. The data was provided in an XLSX file and can be downloaded from [here](https://daten.berlin.de/datensaetze/b%C3%BCcherschr%C3%A4nke-im-bezirk-lichtenberg).

### Sample of the data

| Name | Street | ZIP | City | X-Coordinate | Y-Coordinate | Carrier or responsible person |
| --- | --- | --- | --- | --- | --- | --- |
| Bücher-Box Nachbarschaftshaus Ostseeviertel |	Ribnitzer Straße 1B | 13051 | Berlin | 398497,71 | 5825737,978 | VaV e.V. |

Given coordinates have a UTM format, and are converted to EPSG:4326 (WSG84) format. 

## Backend
This repository contains the backend of the project. The backend was build using Node.js and Express. The backend has to receive an XLSX file in order for it to be converted to GeoJSON file. The GeoJSON file is then used by the frontend to display the data on a map.

## Frontend
The frontend of the project can be found [here](https://github.com/psylocube/fe-bookcases-berlin-lichtenberg). This frontend was build using React. Follow the given link for more information about the frontend.

## Results
To see the results of the project visit [here](https://psylocube.github.io/fe-bookcases-berlin-lichtenberg#results).

## Installation
The backend can be started by running the following commands in the terminal:
```
npm install
npm start
```
