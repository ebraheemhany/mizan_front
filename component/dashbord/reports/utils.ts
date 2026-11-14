// component/dashbord/reports/utils.ts
import {
  CURRENT_MONTH,
  CustomerStatement,
  monthlyHistory,
  type MonthlyPoint,
  type PnlLine,
} from '@/lib/mock/reports';

export function computePnl(lines: PnlLine[]) {
  const sum = (kind: PnlLine['kind']) =>
    lines.filter((l) => l.kind === kind).reduce((s, l) => s + l.amount, 0);

  const revenue = sum('income');
  const cost = sum('cost');
  const operating = sum('expense');
  const grossProfit = revenue - cost;
  const netProfit = grossProfit - operating;

  return {
    revenue,
    cost,
    operating,
    expenses: cost + operating,
    grossProfit,
    netProfit,
    marginPct: revenue > 0 ? (netProfit / revenue) * 100 : 0,
  };
}

export function changePct(current: number, previous: number) {
  return previous === 0 ? 0 : ((current - previous) / previous) * 100;
}

export function buildSeries(lines: PnlLine[]): MonthlyPoint[] {
  const { revenue, expenses } = computePnl(lines);
  return [...monthlyHistory, { month: CURRENT_MONTH, revenue, expenses }];
}

export function monthToDate(ym: string, offset = 0) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + offset, 1));
}

// component/dashbord/reports/utils.ts  
export function computeBalanceSheet({
  cash,
  receivables,
  vatDue,
  netProfit,
  inputs,
}: {
  cash: number;
  receivables: number;
  vatDue: number;
  netProfit: number;
  inputs: { fixedAssets: number; accountsPayable: number; capital: number };
}) {
  const currentAssets = cash + receivables;
  const totalAssets = currentAssets + inputs.fixedAssets;
  const totalLiabilities = inputs.accountsPayable + vatDue;

  // TODO: الأرباح المرحّلة رقم موازنة مؤقت، هتيجي من الدفاتر لما نربط الـ API
  const equity = totalAssets - totalLiabilities;
  const retainedEarnings = equity - inputs.capital - netProfit;

  return {
    currentAssets,
    totalAssets,
    totalLiabilities,
    retainedEarnings,
    totalEquity: equity,
    totalLiabilitiesAndEquity: totalLiabilities + equity,
  };
}



export function computeCashFlow({
  netProfit,
  closingCash,
  inputs,
}: {
  netProfit: number;
  closingCash: number;
  inputs: {
    receivablesIncrease: number;
    payablesIncrease: number;
    equipmentPurchase: number;
    ownerWithdrawals: number;
  };
}) {
  const operating =
    netProfit - inputs.receivablesIncrease + inputs.payablesIncrease;
  const investing = -inputs.equipmentPurchase;
  const financing = -inputs.ownerWithdrawals;
  const netChange = operating + investing + financing;

  // TODO: رصيد أول الفترة رقم موازنة مؤقت، هييجي من الدفاتر لما نربط الـ API
  const openingCash = closingCash - netChange;

  return { operating, investing, financing, netChange, openingCash, closingCash };
}



// component/dashbord/reports/utils.ts 
export function computeStatement(customer: CustomerStatement) {
  let balance = customer.openingBalance;

  const rows = customer.txns.map((txn) => {
    balance += txn.type === 'invoice' ? txn.amount : -txn.amount;
    return { ...txn, balance };
  });

  const sum = (type: 'invoice' | 'payment') =>
    customer.txns
      .filter((txn) => txn.type === type)
      .reduce((s, txn) => s + txn.amount, 0);

  return {
    rows,
    opening: customer.openingBalance,
    invoiced: sum('invoice'),
    paid: sum('payment'),
    closing: balance,
  };
}