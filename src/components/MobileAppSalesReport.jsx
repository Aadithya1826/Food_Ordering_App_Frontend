import React from 'react';
import SalesReportView from './SalesReportView';

/**
 * MobileAppSalesReport
 *
 * Dedicated standalone report view for Customer Mobile App sales.
 * Analyzes only orders created through Customer Mobile App.
 */
const MobileAppSalesReport = ({ onBack }) => {
  return <SalesReportView mode="MOBILE" onBack={onBack} />;
};

export default MobileAppSalesReport;
