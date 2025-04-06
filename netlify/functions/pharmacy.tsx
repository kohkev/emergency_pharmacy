// netlify/functions/pharmacy.ts
import { Handler } from '@netlify/functions';
import axios from 'axios';
import xml2js from 'xml2js';

const XML_API_URL =
    'https://notdienst.sberg.net/api/apipub/notdienst/xmlschnittstelle/QUENGgQHF0RCQl9HWUwFeGd2TVZGW1pPV14MdmxwSUJDVwl_ZH9kfnF9aF5CQ1pURF1mQ1pQHwVXV05YUVBedVxMTFBHYExbf0VeDRJIR0FGQVNKVF5jXRoWVElRXQkCFhYBEQ0YDxMIChYfAQcDGA0eSVdeQBwNBQ0FFgUZAggaCg4fDBITHRAFUERfSU9QS05iXWpYS0ZYCR8HUUhHSnxRWUFQU05RGw==';

export const handler: Handler = async (event, context) => {
    try {
        // Fetch the XML data as text
        const response = await axios.get(XML_API_URL, { responseType: 'text' });
        const xmlData = response.data;

        // Parse XML data into JSON using the Promise-based API
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error fetching or parsing pharmacy data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch pharmacy data' })
        };
    }
};
