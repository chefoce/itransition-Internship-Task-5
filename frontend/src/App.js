import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './App.css'; // Import the CSS file

function App() {
  const [region, setRegion] = useState('Mexico');
  const [errorsPerRecord, setErrorsPerRecord] = useState(0);
  const [seed, setSeed] = useState('default-seed');
  const [data, setData] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    resetData();
  }, [region, errorsPerRecord, seed]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching]);

  const resetData = () => {
    setData([]);
    setPageNumber(1);
    fetchData(1, true);
  };

  const fetchData = async (page, reset = false) => {
    setIsFetching(true);
    try {
      const response = await axios.get('https://itransition-internship-task-5-backend.onrender.com/api/data', {
        params: {
          region,
          errorsPerRecord,
          seed,
          pageNumber: page,
        },
      });
      if (reset) {
        setData(response.data);
      } else {
        setData((prevData) => [...prevData, ...response.data]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('An error occurred while fetching data.');
    }
    setIsFetching(false);
  };

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop <
        document.documentElement.offsetHeight - 100 ||
      isFetching
    )
      return;
    setPageNumber((prevPageNumber) => {
      const nextPage = prevPageNumber + 1;
      fetchData(nextPage);
      return nextPage;
    });
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.random().toString(36).substr(2, 9);
    setSeed(randomSeed);
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data.csv');
    link.click();
  };

  return (
    <div className="container">
      <h1>Fake User Data Generator</h1>

      {/* Region Selector */}
      <div className="form-group">
        <label className="label">Region:</label>
        <select
          className="select"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="Mexico">Mexico</option>
          <option value="United_States">United States</option>
          <option value="Great_Britain">Great Britain</option>
        </select>
      </div>

      {/* Error Controls */}
      <div className="form-group">
        <label className="label">Errors per Record:</label>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={errorsPerRecord}
          onChange={(e) => setErrorsPerRecord(parseFloat(e.target.value))}
          className="input-range"
        />
        <input
          type="number"
          min="0"
          max="1000"
          step="0.5"
          value={errorsPerRecord}
          onChange={(e) => setErrorsPerRecord(parseFloat(e.target.value))}
          className="input"
        />
      </div>

      {/* Seed Input */}
      <div className="form-group">
        <label className="label">Seed:</label>
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="input"
        />
        <button onClick={generateRandomSeed} className="button">
          Random
        </button>
      </div>

      {/* Export Button */}
      <button onClick={exportToCSV} className="button">
        Export to CSV
      </button>

      {/* Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Index</th>
              <th>Identifier</th>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record) => (
              <tr key={record.identifier}>
                <td>{record.index}</td>
                <td>{record.identifier}</td>
                <td>{record.name}</td>
                <td>{record.address}</td>
                <td>{record.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFetching && <p className="loading">Loading more records...</p>}
    </div>
  );
}

export default App;
