// src/components/ChartJobDuration
import React, { useEffect, useState } from 'react';
import { Chart, ChartAxis, ChartBar, ChartThemeColor, ChartTooltip } from '@patternfly/react-charts';
import useFetchJobs from '../../common/HooksApiServer';

interface Job {
  jobID: string;
  status: string;
  duration: number;
}

const JobDurationChart: React.FunctionComponent = () => {
  const jobs: Job[] = useFetchJobs();
  const [chartData, setChartData] = useState<{ x: string; y: number }[]>([]);

  useEffect(() => {
    // Process data whenever 'jobs' changes
    if (jobs.length > 0) {
      const successJobs = jobs.filter((job) => job.status === 'success' && job.duration);
      const data = successJobs.map((job) => ({
        x: `Job ${job.jobID}`,
        y: Number(job.duration) / 60,
      }));

      console.log('Processed Chart Data:', data);
      setChartData(data);
    }
  }, [jobs]);

  if (chartData.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Chart
        domainPadding={{ x: [20, 20] }}
        height={300}
        padding={{
          bottom: 70,
          left: 80,
          right: 50,
          top: 20,
        }}
        themeColor={ChartThemeColor.multi}
        width={600}
      >
        <ChartAxis label="Rollover the bar for the Job ID" tickFormat={() => ''} />
        <ChartAxis
          dependentAxis
          showGrid
          label="Job Duration (min)"
          style={{
            axisLabel: { padding: 45 },
          }}
        />
        <ChartBar data={chartData} labels={({ datum }) => `${datum.x}: ${datum.y.toFixed(2)} minutes`} labelComponent={<ChartTooltip />} />
      </Chart>
    </div>
  );
};

export default JobDurationChart;
