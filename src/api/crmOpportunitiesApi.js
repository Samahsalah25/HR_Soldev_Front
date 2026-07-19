// src/api/crmOpportunitiesApi.js
import api from "./axios";

/**
 * GET /crm/stages
 * يرجع: [{ id, name, sequence, is_won, requirements }]
 */
export async function getStages() {
    const res = await api.get("/crm/stages");
    return res.data?.data ?? [];
}

/**
 * GET /crm/opportunities
 * @param {object} filters
 *   stage_id: number  (اختياري)
 *   search:   string  (اختياري)
 *   limit, offset
 */
export async function getOpportunities(filters = {}) {
    const params = {
        limit: filters.limit ?? 100,
        offset: filters.offset ?? 0,
    };
    if (filters.stage_id) params.stage_id = filters.stage_id;
    if (filters.search) params.search = filters.search;

    const res = await api.get("/crm/opportunities", { params });
    return res.data?.data ?? [];
}

/**
 * GET /crm/opportunities/:id
 */
export async function getOpportunity(id) {
    const res = await api.get(`/crm/opportunities/${id}`);
    return res.data?.data;
}

/**
 * POST /crm/opportunities
 * payload: { name, partner_id?, stage_id?, expected_revenue?, probability?,
 *            priority?, user_id?, date_deadline?, email_from?, phone?, description? }
 */
export async function createOpportunity(payload) {
    const res = await api.post("/crm/opportunities", payload);
    return res.data;
}

/**
 * PUT /crm/opportunities/:id
 */
export async function updateOpportunity(id, payload) {
    const res = await api.put(`/crm/opportunities/${id}`, payload);
    return res.data;
}

/**
 * POST /crm/opportunities/:id/won
 */
export async function markOpportunityWon(id) {
    const res = await api.post(`/crm/opportunities/${id}/won`);
    return res.data;
}

/**
 * GET /crm/lost-reasons
 */
export async function getLostReasons() {
    const res = await api.get("/crm/lost-reasons");
    return res.data?.data ?? [];
}

/**
 * POST /crm/opportunities/:id/lost
 * payload: { lost_reason_id, lost_feedback }
 */
export async function markOpportunityLost(id, { lost_reason_id, lost_feedback }) {
    const res = await api.post(`/crm/opportunities/${id}/lost`, { lost_reason_id, lost_feedback });
    return res.data;
}
