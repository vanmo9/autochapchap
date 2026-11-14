// Fill these in from your questionnaire and interviews (averages).
// Leave a value as null until you have real data. The page shows "Not collected yet".
// export const brokerBaseline = {
//   sampleSize: null,            // how many people you surveyed or interviewed
//   avgPeopleInvolved: null,     // people between the customer and the car owner
//   avgSteps: null,              // calls, messages and handovers in one hire
//   avgHoursToGetCar: null,      // hours from first request to a confirmed car
//   avgBrokerMarginKes: null,    // extra KES added on top of the owner's price per day
//   source: 'My questionnaire and interviews (add dates here)'
// };



cat > client/src/brokerBaseline.js <<'EOF'
// Broker route figures from my survey (3 to 6 Nov 2026) and interviews.
// Averages are for the 22 respondents who had hired through a broker.
export const brokerBaseline = {
  sampleSize: 22,              // respondents who had hired through a broker
  avgPeopleInvolved: 2.3,      // people between the customer and the car owner
  avgSteps: 5.4,               // calls and messages needed in one hire
  avgHoursToGetCar: 14.5,      // hours from first request to a confirmed car (median 5)
  avgBrokerMarginKes: 2062,    // extra KES per day (10 clear answers; median 2,000)
  source: 'Survey of 24 people (3 to 6 Nov 2026; 22 had used a broker) and 3 interviews'
};
EOF