import React from 'react';
import SalesReportView from './SalesReportView';

/**
 * CashierSalesReport
 *
 * Dedicated standalone report view for Cashier POS sales.
 * Analyzes only orders created through Cashier POS.
 */
const CashierSalesReport = ({ onBack }) => {
  return <SalesReportView mode="CASHIER" onBack={onBack} />;
};

export default CashierSalesReport;
