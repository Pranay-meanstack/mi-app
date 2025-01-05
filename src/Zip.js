import React, { useState, useEffect } from 'react';

const Zip=({peciFileName, configFileName,onDataFromChild})=> {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fileRef = React.useRef();
    const [isDisabled, setIsDisabled] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [isPECI, setIsPECI] =useState(true);
    useEffect(() => {
        fetchFolders();
        peciFileName.includes('PECL')?setIsPECI(false):setIsPECI(true);
    });
    const fetchFolders = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/folders');
            if (!response.ok) {
                throw new Error('Failed to fetch folders');
            }
            const data = await response.json();
            if(data.folders.length>folders.length || (data.folders.length<folders.length && folders.length>0)){
                setFolders(data.folders);
            }
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const runScriptBatch=async(result)=> {
        const batchPath = result.path.trim();
        console.log(batchPath);
        // Call server to execute batch file
        await fetch('http://localhost:5000/script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: batchPath })
        })
        .then(response => response.json())
        .then(data => { 
            if (data.success) {
                if(batchPath.substring(batchPath.lastIndexOf('\\')+1)==='Run.bat'){
                    onDataFromChild('C:/Celergo/CG/SWDAYFMRL_20241212093941_GBPECI_HRMD01.txt');
                }
                else{
                setIsDisabled(true);
                fetchFolders();}
            }
        })
        .catch(error => {
            console.log(error);
        })
        .finally(() => {
        });
    }

    const generateBatchFile = async (event) => {
        const fileName=isDisabled?'':event.target.files[0];
        console.log(isPECI);
        const unzipName=isDisabled?'':fileName.name.substring(0,fileName.name.lastIndexOf('.'));
        const content = isDisabled?`C:/Celergo/BatchFile/${selectedFolder}/RUN_PECI_CGC/RUN_PECI_CGC_run.bat ^\n--context_param Tmp_Folder=C:/Celergo/LOGS ^\n--context_param Config_File="C:/Celergo/CONFIG/${configFileName} " ^\n--context_param PECI_FilePath=C:/Celergo/${isPECI?'PECI':'PECL'}/${peciFileName} ^\n--context_param CG_FilePath=C:/Celergo/CG/SWDAYFMRL_20241212093941_GBPECI_HRMD01.txt 2>> C:/Celergo/LOGS/RunLog.txt`
        :`@echo off\nCls\nIF NOT EXIST C:/Celergo/BatchFile/${unzipName} (\nMD ${unzipName}\n)\ntar -xf ${fileName.name} -C C:/Celergo/BatchFile/${unzipName}\nEXIT`;
        console.log(content)
        try {
          const response = await fetch('http://localhost:5000/api/save-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: content,
              fileName: isDisabled?'Run.bat':'script.bat',
              directory:isDisabled? `C:/Celergo/BatchFile/${selectedFolder}/RUN_PECI_CGC`:'C:\\Celergo\\BatchFile'
            }),
          });
          
          const result = await response.json();
          console.log(result);
          if (result.success) {
            runScriptBatch(result);
          }
          
        } catch (error) {
          console.error('Error saving file:', error);
          alert('Failed to save file');
        }
      };

    if (loading) {
        return <div>Loading folders...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }
    const handleFolderSelect = (e) => {
        const selected = e.target.value;
        if (selected && folders.includes(selected)) {
            setSelectedFolder(selected);
            setIsDisabled(true); // Enable execute button when valid folder is selected
        } else {
            setSelectedFolder('');
            setIsDisabled(false);
        }
    };
    return (
        <div className="Zip row">
            <div className='builds col'>
                <h2>BUILD</h2></div>
                <div className='builds col'>
                {folders.length === 0 ? (
                    <p>No folders found</p>
                ) : (
                    <select className='col'
                    value={selectedFolder} 
                    onChange={handleFolderSelect}
                >
                        <option value="">Select Build To Execute</option>
                        {folders.map((folder, index) => (
                            <option key={index} value={folder}>
                                {folder}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className='execute col'>
                <button 
                    className={isDisabled ? '' : 'disabled'} 
                    onClick={generateBatchFile}>
                    execute
                </button>
            </div>
            <div className='newbuild col'>
                <button onClick={() => fileRef.current.click()}>
                    <input id="upload" name="upload" type="file" ref={fileRef} hidden
                    onChange={generateBatchFile}/>
                    New build
                </button>
            </div>
        </div>
    );
}

export default Zip;
