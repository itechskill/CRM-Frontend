import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { ArrowDown, TrendingUp, RefreshCw, BarChart3 } from 'lucide-react';
import './SalesPipelineView.css';

export default function SalesPipelineView() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallConv, setOverallConv] = useState('0%');

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const { response, data } = await apiRequest('/api/sales-manager/dashboard-stats');
      if (response.ok && data.success && data.data?.pipelineStages) {
        const rawStages = data.data.pipelineStages;
        const totalOpportunities = rawStages.reduce((sum, s) => sum + (s.count || 0), 0);
        const wonStage = rawStages.find(s => s.id === 'won' || s.label.toLowerCase().includes('won'));
        const wonCount = wonStage ? wonStage.count : 0;
        const convRate = totalOpportunities > 0 ? ((wonCount / totalOpportunities) * 100).toFixed(1) + '%' : '0%';
        setOverallConv(convRate);

        const mapped = rawStages.map((s, idx) => {
          const pct = totalOpportunities > 0 ? Math.max(10, Math.round((s.count / totalOpportunities) * 100)) : (100 - idx * 20);
          return {
            stage: s.label,
            count: s.count,
            value: s.pipelineValue || 'Rs. 0',
            conv: `${pct}%`,
            drop: idx < rawStages.length - 1 ? `${Math.max(5, 100 - pct)}%` : '0%'
          };
        });
        setStages(mapped);
      }
    } catch (e) {
      console.error('Fetch pipeline error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  return (
    <div className="sales-sm-pipeline-view">
      <div className="pipeline-header-card">
        <div>
          <h2 className="pipeline-title">Sales Funnel & Stage Conversion</h2>
          <p className="pipeline-subtitle">Live breakdown of conversion rates and stage velocity from active deals</p>
        </div>
        <div className="funnel-summary-badge">
          <TrendingUp size={16} />
          <span>Overall Funnel Conversion: {overallConv}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
          Loading Sales Funnel...
        </div>
      ) : stages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
          No active pipeline data found.
        </div>
      ) : (
        <div className="funnel-visualization-container">
          {stages.map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="funnel-step-row">
                <div className="step-info-col">
                  <span className="step-num">{idx + 1}</span>
                  <div className="step-titles">
                    <span className="step-name">{item.stage}</span>
                    <span className="step-val">{item.value} ({item.count} Deals)</span>
                  </div>
                </div>

                <div className="step-bar-wrap">
                  <div 
                    className={`step-bar-fill step-gradient-${(idx % 6) + 1}`} 
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
      )}
    </div>
  );
}

