import React from 'react';
import styled from 'styled-components';
import { DashboardData } from '@/models/InternalHCDData';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.2rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.95rem;
  color: #666;
`;

interface SummaryStatsProps {
  data: DashboardData['summaryStats'];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ data }) => {
  return (
    <StatsGrid>
      <StatCard>
        <StatValue>{data.totalPlannedUnits.toLocaleString()}</StatValue>
        <StatLabel>Total Planned Units</StatLabel>
      </StatCard>
      
      <StatCard>
        <StatValue>{data.permitedUnits.toLocaleString()}</StatValue>
        <StatLabel>Permits Issued</StatLabel>
      </StatCard>
      
      <StatCard>
        <StatValue>{data.completedUnits.toLocaleString()}</StatValue>
        <StatLabel>Units Completed</StatLabel>
      </StatCard>
      
      <StatCard>
        <StatValue>{data.affordableUnits.toLocaleString()}</StatValue>
        <StatLabel>Affordable Units</StatLabel>
      </StatCard>
    </StatsGrid>
  );
};

export default SummaryStats; 