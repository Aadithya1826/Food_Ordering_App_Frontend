import React from 'react';
import SalesReportView from './SalesReportView';

/**
 * TotalSalesReport
 *
 * Consolidated Sales Report view incorporating all sales income across Cashier and Mobile App.
 * Displays (C) for Cashier and (M) for Mobile App with source filters and full breakdowns.
 */
const TotalSalesReport = ({ onBack }) => {
  return <SalesReportView mode="TOTAL" onBack={onBack} />;
};

export default TotalSalesReport;
