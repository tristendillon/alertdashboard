export const getFlowRateColor = (flow_rate: number) => {
  if (flow_rate < 500) {
    return "red";
  } else if (flow_rate >= 500 && flow_rate < 1000) {
    return "orange";
  } else if (flow_rate >= 1000 && flow_rate < 1500) {
    return "green";
  } else {
    return "blue";
  }
};
