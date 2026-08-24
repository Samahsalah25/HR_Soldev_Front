// import api from "./axios";

// // Re-use shared axios instance
// const salarySettingsApi = api;


// /**
//  * GET GOSI Rates
//  * GET /accounting/settings/gosi-rates
//  */
// export async function getGosiRates() {
//     const res = await salarySettingsApi.get(
//         "/accounting/settings/gosi-rates"
//     );

//     return res.data;
// }




// /**
//  * UPDATE GOSI Rates
//  * PUT /accounting/settings/gosi-rates
//  *
//  * Body:
//  * {
//  *   saudi_employee: {
//  *     employee_subscription: 10,
//  *     retirement: 9.5,
//  *     occupational_hazards: 2.5,
//  *     workers_support_fund: 0.8
//  *   },
//  *   resident_employee: {
//  *     employee_subscription: 3,
//  *     occupational_hazards: 3,
//  *     expatriate_labor_fees: 500
//  *   }
//  * }
//  */
// export async function updateGosiRates(data) {
//     const res = await salarySettingsApi.put(
//         "/accounting/settings/gosi-rates",
//         data
//     );

//     return res.data;
// }



// // ===============================
// // Labor Law Settings
// // ===============================

// /**
//  * GET Labor Law Settings
//  * GET /accounting/settings/labor-law
//  *
//  * Response:
//  * {
//  *   success: true,
//  *   vacation: {
//  *      increase_years_threshold: 6,
//  *      lower_limit_days: 22,
//  *      upper_limit_days: 31
//  *   },
//  *   eos_overtime: {
//  *      min_eligibility_fire_years: 3,
//  *      salary_limit_years: 6,
//  *      notice_period_days: 45,
//  *      trial_period_days: 100,
//  *      overtime_multiplier: 1.75
//  *   }
//  * }
//  */
// export async function getLaborLawSettings() {
//     const res = await salarySettingsApi.get(
//         "/accounting/settings/labor-law"
//     );

//     return res.data;
// }



// /**
//  * UPDATE Labor Law Settings
//  * PUT /accounting/settings/labor-law
//  *
//  * Body:
//  * {
//  *   vacation: {
//  *      increase_years_threshold: 6,
//  *      lower_limit_days: 22,
//  *      upper_limit_days: 31
//  *   },
//  *   eos_overtime: {
//  *      min_eligibility_fire_years: 3,
//  *      salary_limit_years: 6,
//  *      notice_period_days: 45,
//  *      trial_period_days: 100,
//  *      overtime_multiplier: 1.75
//  *   }
//  * }
//  */
// export async function updateLaborLawSettings(data) {
//     const res = await salarySettingsApi.put(
//         "/accounting/settings/labor-law",
//         data
//     );

//     return res.data;
// }



// // ===============================
// // WPS Settings
// // ===============================

// /**
//  * GET WPS Settings
//  * GET /accounting/settings/wps
//  *
//  * Response:
//  * {
//  *   success: true,
//  *   payment_day_limit: 15
//  * }
//  */
// export async function getWpsSettings() {
//     const res = await salarySettingsApi.get(
//         "/accounting/settings/wps"
//     );

//     return res.data;
// }

// /**
//  * UPDATE WPS Settings
//  * PUT /accounting/settings/wps
//  *
//  * Body:
//  * {
//  *   payment_day_limit: 15
//  * }
//  */
// export async function updateWpsSettings(data) {
//     const res = await salarySettingsApi.put(
//         "/accounting/settings/wps",
//         data
//     );

//     return res.data;
// }




// /**
//  * RUN Sandbox Test
//  * POST /accounting/settings/test-environment/run
//  *
//  * Body:
//  * {
//  *   scenario: "gosi_resident"
//  * }
//  */
// export async function runSandboxTest(data) {
//     const res = await salarySettingsApi.post(
//         "/accounting/settings/test-environment/run",
//         data
//     );

//     return res.data;
// }


import api from "./axios";

// Re-use shared axios instance
const salarySettingsApi = api;

// ⬇️ أضيفي البادئة دي فوق كل الدوال
const BASE = "/salary/accounting/settings";

export async function getGosiRates() {
    const res = await salarySettingsApi.get(`${BASE}/gosi-rates`);
    return res.data;
}

export async function updateGosiRates(data) {
    const res = await salarySettingsApi.put(`${BASE}/gosi-rates`, data);
    return res.data;
}

export async function getLaborLawSettings() {
    const res = await salarySettingsApi.get(`${BASE}/labor-law`);
    return res.data;
}

export async function updateLaborLawSettings(data) {
    const res = await salarySettingsApi.put(`${BASE}/labor-law`, data);
    return res.data;
}

export async function getWpsSettings() {
    const res = await salarySettingsApi.get(`${BASE}/wps`);
    return res.data;
}

export async function updateWpsSettings(data) {
    const res = await salarySettingsApi.put(`${BASE}/wps`, data);
    return res.data;
}

export async function runSandboxTest(data) {
    const res = await salarySettingsApi.post(`${BASE}/test-environment/run`, data);
    return res.data;
}