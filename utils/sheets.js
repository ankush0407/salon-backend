const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

async function getSheetData(sheetName) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z`,
    });
    
    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return [];
    }
    
    // First row is headers
    const headers = rows[0];
    
    // Convert remaining rows to objects
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  } catch (error) {
    console.error('Error reading sheet:', error);
    throw error;
  }
}

async function appendSheetData(sheetName, values) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      resource: { values },
    });
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

async function updateSheetRow(sheetName, rowNumber, data) {
  try {
    // Get headers first
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });
    
    const headers = headerResponse.data.values[0];
    
    // Convert data object to array in correct order
    const values = headers.map(header => data[header] || '');
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNumber}:Z${rowNumber}`,
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw error;
  }
}

async function deleteSheetRow(sheetName, rowNumber) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    // Find the sheet ID
    const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found`);
    }
    
    const sheetId = sheet.properties.sheetId;
    
    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber
            }
          }
        }]
      }
    });
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
}

module.exports = { getSheetData, appendSheetData, updateSheetRow, deleteSheetRow };