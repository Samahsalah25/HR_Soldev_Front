import api from "./axios";

// Re-use the shared axios instance
const financeApi = api;

/**
 * GET /salary/insurance-kpis
 */
export async function getInsuranceKPIs(month) {
    const res = await financeApi.get("/salary/insurance-kpis", {
        params: { month },
    });
    return res.data?.kpis || {};
}

/**
 * GET /salary/insurance-dashboard
 */
export async function getInsuranceDashboard(month) {
    const res = await financeApi.get("/salary/insurance-dashboard", {
        params: { month },
    });
    return res.data?.tabs?.payslips || [];
}

/**
 * GET /salary/gosi-insurance
 */
export async function getGosiInsurance(month) {
    const res = await financeApi.get("/salary/gosi-insurance", {
        params: { month },
    });
    return res.data?.gosi_insurance || {};
}

/**
 * GET /salary/cost-summary
 */
export async function getCostSummary(month) {
    const res = await financeApi.get("/salary/cost-summary", {
        params: { month },
    });
    return res.data?.cost_summary || {};
}

/**
 * Load all finance dashboard data together
 */
export async function getFinanceDashboard(month) {
    const [
        kpisRes,
        insuranceDashboardRes,
        gosiRes,
        costSummaryRes,
    ] = await Promise.all([
        financeApi.get("/salary/insurance-kpis", {
            params: { month },
        }),
        financeApi.get("/salary/insurance-dashboard", {
            params: { month },
        }),
        financeApi.get("/salary/gosi-insurance", {
            params: { month },
        }),
        financeApi.get("/salary/cost-summary", {
            params: { month },
        }),
    ]);

    return {
        kpis: kpisRes.data?.kpis || {},
        payslips: insuranceDashboardRes.data?.tabs?.payslips || [],
        gosiInsurance: gosiRes.data?.gosi_insurance || {},
        costSummary: costSummaryRes.data?.cost_summary || {},
    };
}


export async function getFinancialReports({
  dateFrom,
  dateTo,
  includeNoTransactions = true,
}) {
  const res = await financeApi.get("/salary/financial-reports", {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
      include_no_transactions: includeNoTransactions,
    },
  });

  return res.data || {};
}