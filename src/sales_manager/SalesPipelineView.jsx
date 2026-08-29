import React from 'react';
import { Filter, ArrowDown, TrendingUp, CheckCircle, Percent, Clock } from 'lucide-react';
import './SalesPipelineView.css';

export default function SalesPipelineView() {
  const stages = [
    { stage: 'Prospecting / New Leads', count: 142, value: '$1,850,000', conv: '100%', drop: '28%' },
    { stage: 'Initial Qualification', count: 102, value: '$1,420,000', conv: '71.8%', drop: '24%' },
    { stage: 'Solution Demo / Pitch', count: 78, value: '$1,150,000', conv: '54.9%', drop: '35%' },
    { stage: 'Proposal Submitted', count: 51, value: '$840,000', conv: '35.9%', drop: '40%' },
    { stage: 'Contract Negotiation', count: 31, value: '$560,000', conv: '21.8%', drop: '15%' },
    { stage: 'Closed Won', count: 26, value: '$485,000', conv: '18.3%', drop: '0%' }
  ];

  return (
    <div className="sales-sm-pipeline-view">
      <div className="pipeline-header-card">
        <div>
          <h2 className="pipeline-title">Sales Funnel & Stage Conversion</h2>
          <p className="pipeline-subtitle">Detailed breakdown of conversion rates and stage velocity across Q3</p>
        </div>
        <div className="funnel-summary-badge">
          <TrendingUp size={16} />
          <span>Overall Funnel Conversion: 18.3%</span>
        </div>
      </div>

      <div className="funnel-visualization-container">
        {stages.map((item, idx) => (
          <React.Fragment key={idx}>
            <div className="funnel-step-row">
              <div className="step-info-col">
                <span className="step-num">{idx + 1}</span>
                <div className="step-titles">
                  <span className="step-name">{item.stage}</span>
                  <span className="step-val">{item.value} ({item.count} Opportunities)</span>
                </div>
              </div>

              <div className="step-bar-wrap">
                <div 
                  className={`step-bar-fill step-gradient-${idx + 1}`} 
                  style={{ width: item.conv }}
                >
                  <span className="bar-conv-label">{item.conv}</span>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <div className="step-drop-col">
                  <ArrowDown size={14} className="drop-icon" />
                  <span>{item.drop} Drop-off</span>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
