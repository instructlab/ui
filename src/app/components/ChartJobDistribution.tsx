import React from 'react';
import { ChartPie, ChartLegend, ChartThemeColor } from '@patternfly/react-charts';
import { useNavigate } from 'react-router-dom';
import useFetchJobs from '@app/common/HooksApiServer';

const JobStatusPieChart: React.FunctionComponent = () => {
  const jobs = useFetchJobs();
  const navigate = useNavigate();

  const countJobStatuses = (jobs) => {
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
    return statusCounts;
  };

  const jobStatusCounts = countJobStatuses(jobs);

  const chartData = Object.keys(jobStatusCounts).map(status => ({
    x: status,
    y: jobStatusCounts[status]
  }));

  const legendData = chartData.map((dataItem) => ({
    name: `${dataItem.x}: ${dataItem.y}`,
    id: dataItem.x.toLowerCase()
  }));

  const handleLegendClick = (id) => {
    navigate(`/jobs/${id}`);
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
          bottom: 20, left: 20, right: 140, top: 20
        }}
        themeColor={ChartThemeColor.multiUnordered}
        width={350}
        legendComponent={
          <ChartLegend
            data={legendData}
            itemsPerRow={4}
            onClick={(event, dataItem) => handleLegendClick(dataItem.id)}
            orientation="vertical"
          />
        }
      />
    </div>
  );
};

export default JobStatusPieChart;
