import React, { useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DashboardData } from '@/models/InternalHCDData';

interface ProgressChartProps {
  data: DashboardData['progressChart'];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  
  // Transform the data for Highcharts
  const categories = data.map(item => item.category);
  const completedData = data.map(item => item.completed);
  const underConstructionData = data.map(item => item.underConstruction);
  const permittedData = data.map(item => item.permitted);
  const plannedData = data.map(item => item.planned);
  
  const chartOptions = {
    chart: {
      type: 'column'
    },
    title: {
      text: ''
    },
    xAxis: {
      categories
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Housing Units'
      },
      stackLabels: {
        enabled: true
      }
    },
    legend: {
      align: 'right',
      verticalAlign: 'top',
      layout: 'vertical'
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: false
        }
      }
    },
    series: [{
      name: 'Completed',
      data: completedData,
      color: '#28a745'
    }, {
      name: 'Under Construction',
      data: underConstructionData,
      color: '#ffc107'
    }, {
      name: 'Permitted',
      data: permittedData,
      color: '#17a2b8'
    }, {
      name: 'Planned',
      data: plannedData,
      color: '#6c757d'
    }]
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={chartOptions}
      ref={chartComponentRef}
    />
  );
};

export default ProgressChart; 