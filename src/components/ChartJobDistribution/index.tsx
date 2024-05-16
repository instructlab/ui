// src/components/ChartJobDistribution/index.tsx
import React from 'react';
import { ChartPie, ChartLegend, ChartThemeColor } from '@patternfly/react-charts';
import { useRouter } from 'next/navigation';
import useFetchJobs from '../../common/HooksApiServer';

interface Job {
  status: string;
}

const JobStatusPieChart: React.FunctionComponent = () => {
  const jobs: Job[] = useFetchJobs();
  const router = useRouter();

  const countJobStatuses = (jobs: Job[]) => {
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return statusCounts;
  };

  const jobStatusCounts = countJobStatuses(jobs);

  const chartData = Object.keys(jobStatusCounts).map((status) => ({
    x: status,
    y: jobStatusCounts[status],
  }));

  const legendData = chartData.map((dataItem) => ({
    name: `${dataItem.x}: ${dataItem.y}`,
    id: dataItem.x.toLowerCase(),
  }));

  const handleLegendClick = (id: string) => {
    router.push(`/jobs/${id}`);
  };

  return (
    <div style={{ height: '250px', width: '100%' }}>
      <ChartPie
        ariaDesc="Job status distribution"
        ariaTitle="Job status distribution"
        constrainToVisibleArea
        data={chartData}
        height={230}
        labels={({ datum }) => `${datum.x}: ${datum.y}`}
        legendData={legendData}
        legendPosition="right"
        padding={{
          bottom: 20,
          left: 20,
          right: 140,
          top: 20,
        }}
        themeColor={ChartThemeColor.multiUnordered}
        width={350}
        legendComponent={<ChartLegend data={legendData} itemsPerRow={4} orientation="vertical" />}
        events={[
          {
            target: 'data',
            eventHandlers: {
              onClick: (event, dataProps) => {
                const id = legendData[dataProps.index].id;
                handleLegendClick(id);
                return null;
              },
            },
          },
        ]}
      />
    </div>
  );
};

export default JobStatusPieChart;
