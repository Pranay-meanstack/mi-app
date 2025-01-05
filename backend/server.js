const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.text());
app.use(cors());

// Middleware to get directories
function getDirectories(req, res, next) {
    const directoryPath = path.join(__dirname, './../../../Celergo/BatchFile'); // Adjust path as needed
    
    fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return next(err);
        }
        const isLowerCase = str =>
        str === str.toLowerCase();
        // Filter only directories and get their names
        const folders = files
            .filter(file => file.isDirectory() && !file.name.startsWith('.') && !isLowerCase(file.name))
            .map(dir => dir.name);
        res.locals.folders = folders;
        next();
    });
}

//to get all folders in the directory
app.get('/api/folders', getDirectories, (req, res) => {
    res.json({ folders: res.locals.folders });
});

app.post('/api/C2File', (req, res) => {
    console.log('Received data:', req.body);
    fs.readFile(req.body, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return res.status(500).json({ error: 'Failed to read file' });
        }
        res.json({ 
            content: data,
            message: 'Data received successfully'
         });
      });
});

app.post('/api/uploads', (req, res) => {

    res.json({ 
        status: 'success',
        message: 'Data received successfully',
        receivedData: JSON.stringify(req.body.content)
    });
});

//To generate batch file for unzipping the zip files
app.post('/api/save-batch', (req, res) => {
    const { content, fileName, directory } = req.body;
    const filePath = path.join(directory, fileName);
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        console.error('Error saving file:', err);
        return res.status(500).json({ error: 'Failed to save file' });
      }
      res.json({ success: true, path: filePath });
    });
  });

  app.post('/script', (req, res) => {
    const { path: batchPath } = req.body;

    // Validate the path
    if (!batchPath || !batchPath.endsWith('.bat')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid batch file path'
        });
    }

    // Execute the batch file
    exec(`"${batchPath}"`, {
        windowsHide: true, // Hide the command prompt window
        cwd: path.dirname(batchPath) // Set working directory to batch file location
    }, (error, stdout, stderr) => {
        if (error) {
            console.error('Execution error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            output: stdout,
            error: stderr
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

