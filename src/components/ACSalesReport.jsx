import React from 'react';
import SalesReportView from './SalesReportView';

/**
 * ACSalesReport
 *
 * Dedicated Sales Report for AC (Air Conditioned) bills.
 * Displays only bills placed or marked as AC, with full item breakdowns, hourly timeline, and order details.
 */
const ACSalesReport = ({ onBack }) => {
  return <SalesReportView mode="AC" onBack={onBack} />;
};

export default ACSalesReport;
