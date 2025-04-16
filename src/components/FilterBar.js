// src/components/FilterBar.js
import React, { useState } from 'react';
import '../styles/FilterBar.css';

const FilterBar = ({ systems, formats, transmissionMethods, onFilter, colorPalette }) => {
  const [filters, setFilters] = useState({
    sourceSystem: '',
    targetSystem: '',
    format: '',
    transmissionMethod: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    setFilters({
      sourceSystem: '',
      targetSystem: '',
      format: '',
      transmissionMethod: ''
    });
    onFilter({});
  };

  return (
    <div className="filter-bar" style={{ backgroundColor: colorPalette.lightGray }}>
      <form onSubmit={handleSubmit}>
        <div className="filter-group">
          <label>Source System:</label>
          <select
            name="sourceSystem"
            value={filters.sourceSystem}
            onChange={handleChange}
          >
            <option value="">All</option>
            {systems.map((system) => (
              <option key={`source-${system}`} value={system}>
                {system}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Target System:</label>
          <select
            name="targetSystem"
            value={filters.targetSystem}
            onChange={handleChange}
          >
            <option value="">All</option>
            {systems.map((system) => (
              <option key={`target-${system}`} value={system}>
                {system}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Format:</label>
          <select
            name="format"
            value={filters.format}
            onChange={handleChange}
          >
            <option value="">All</option>
            {formats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Transmission Method:</label>
          <select
            name="transmissionMethod"
            value={filters.transmissionMethod}
            onChange={handleChange}
          >
            <option value="">All</option>
            {transmissionMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-actions">
          <button type="submit" style={{ backgroundColor: colorPalette.accent1 }}>Apply Filters</button>
          <button type="button" onClick={handleReset} style={{ backgroundColor: colorPalette.tertiary }}>Reset</button>
        </div>
      </form>
    </div>
  );
};

export default FilterBar;

