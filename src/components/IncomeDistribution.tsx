import React, { useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DashboardData } from '@/models/InternalHCDData';

interface IncomeDistributionProps {
  data: DashboardData['incomeDistribution'];
}

const IncomeDistribution: React.FC<IncomeDistributionProps> = ({ data }) => {
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  
  // Transform the data for Highcharts
  const pieData = data.map(item => ({
    name: item.category,
    y: item.value,
    color: item.color
  }));
  
  const chartOptions = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: ''
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %'
        }
      }
    },
    series: [{
      name: 'Income Level',
      colorByPoint: true,
      data: pieData
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

export default IncomeDistribution; 