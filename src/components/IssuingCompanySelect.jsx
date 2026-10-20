import React from 'react';
import { companiesFor } from '../utils/companies';

export default function IssuingCompanySelect({ documentType, value, onChange, required = true, style }) {
  return (
    <select value={value || ''} onChange={event => onChange(event.target.value)} required={required} style={style}>
      <option value="">Select issuing company</option>
      {companiesFor(documentType).map(company => (
        <option key={company.code} value={company.code}>{company.legalName}</option>
      ))}
    </select>
  );
}
