import React, { useState, useRef} from 'react';
import Zip from './Zip';

function FileUpload({ acceptedFileTypes = ['.xml', '.sap'], onFileUpload }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFiles = (files) => {
    setError('');
    
    if (files.length > 1) {
      setError('Please upload only one file.');
      return;
    }

    const file = files[0];
    if (!file) return;

    const extension = file.name.toLowerCase().split('.').pop();
    const validExtensions = acceptedFileTypes.map(type => 
      type.replace('.', '').toLowerCase()
    );

    if (!validExtensions.includes(extension)) {
      setError(`Please upload only ${acceptedFileTypes.join(' or ')} file.`);
      return;
    }

    setFileInfo({
      name: file.name,
    });

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      if (onFileUpload) {
        onFileUpload({
          file,
          content: e.target.result
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="file-upload-container">
      <div
        ref={dropZoneRef}
        className={`dropzone ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
        />
        <p>Drag & drop files here or click to browse</p>
        {fileInfo?<div className="file-info">
          <p>{fileInfo.name}</p>
        </div>:<p>Only {acceptedFileTypes.join(' and ')} files are allowed.</p>}
      </div>

      {error && <div className="error">{error}</div>}

    </div>
  );
}

function Files() {
  const [peciFile, setPeciFile] = useState(null);
  const [peciFileName,setPeciFileName] = useState('');
  const [configFile, setConfigFile] = useState(null);
  const [configFileName,setConfigFileName] = useState('');
  const [c2File, setC2File] = useState(null);
const getC2File = async (data) => {
  try {
    const response = await fetch('http://localhost:5000/api/C2File', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: data
    });
      if (!response.ok) {
          throw new Error('Failed to fetch folders');
      }
      const result = await response.json();
      setC2File(result.content);
  } catch (err) {
    console.error('Error saving file:', err);
    alert('Failed to save file');
  }
};
  const [buttonvalue, setButtonvalue] = useState(null);
  const handlePeciFileUpload = ({ file, content }) => {
    setPeciFile(content);
    setPeciFileName(file.name);
  };
  const handleConfigFileUpload = ({ file, content }) => {
    setConfigFile(content);
    setConfigFileName(file.name);
  };
  const buttonchange=(event)=>{
    setButtonvalue(event.target.value)
    
  }
  return (
    <div className='Files'>
      <div className='files-container'>
        <div className='files-upload'>
          <div className='files-upload-peci'>
            <h2>PECI/PECL</h2>
            <FileUpload 
              acceptedFileTypes={['.xml', '.sap']}
              onFileUpload={handlePeciFileUpload}
            />
          </div>
        </div>
        
        <div className='files-upload'>
          <div className='files-upload-config'>
            <h2>CONFIG</h2>
            <FileUpload 
              acceptedFileTypes={['.xml', '.json']}
              onFileUpload={handleConfigFileUpload}
            />
          </div>
        </div>
      </div>
      {console.log('pecifile:',peciFileName)}
      {console.log('configfile:', configFileName)}
      {peciFileName && configFileName &&
      <Zip peciFileName={peciFileName} configFileName={configFileName} onDataFromChild={getC2File}/>}
      <div className='buttons'>
      <button className='upload-btn'
      value="PECI" disabled={!peciFile} onClick={buttonchange}>PECI</button>
      <button className='upload-btn'
       value="CONFIG" disabled={!configFile}onClick={buttonchange}>CONFIG</button>
      <button className='upload-btn'  
      value="c2File" disabled={!c2File}onClick={buttonchange}>C2</button></div>
      <textarea value={
        buttonvalue==='PECI'?peciFile:buttonvalue==='CONFIG'?configFile:buttonvalue==='c2File'?c2File:''} readOnly></textarea>
    </div>
  );
}

export default Files;
