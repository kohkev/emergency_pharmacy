// backend/src/controllers/pharmacyController.ts
import { Request, Response } from 'express';
import axios from 'axios';
import xml2js from 'xml2js';

const XML_API_URL =
    'https://notdienst.sberg.net/api/apipub/notdienst/xmlschnittstelle/QUENGgQHEERCQl9HWUwFeGd2TVZGW1pPV14MdmxwSUJDVwl_ZH9kfnF9aF5CQ1pURF1mQ1pQHwVXV05YUVBedVxMTFBHYExbf0VeDRJIR0FGQVNKVF5jXRoWVElRXQkDEBYGEA8XDhIAChYfAQcDGA0eSVdeQBwFGxIGEAIbBA8aCg4fDBITHRBJWVxZUFhcUXRFfkJJWlEXGQNKXVRRcltGTk1aWEMJ';

export const getPharmacyData = async (req: Request, res: Response) => {
    try {
        // Fetch the XML data as text
        const response = await axios.get(XML_API_URL, { responseType: 'text' });
        const xmlData = response.data;

        // Log the raw XML length
        console.log(`Fetched XML length: ${xmlData.length} characters`);

        // Parse XML data into JSON using the Promise-based API
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        // Log the entire parsed JSON for inspection
        console.log('Parsed JSON result:', result);

        // Check and log how many pharmacy entries are retrieved
        // Assuming the XML structure is <container><entries><entry>...</entry></entries></container>
        const entries = result?.container?.entries?.entry;
        const count = Array.isArray(entries) ? entries.length : (entries ? 1 : 0);
        console.log(`Number of pharmacy entries retrieved: ${count}`);

        // Respond with the parsed JSON data
        res.json(result);
    } catch (error) {
        console.error('Error fetching or parsing pharmacy data:', error);
        res.status(500).json({ error: 'Failed to retrieve pharmacy data' });
    }
};
