// server/routes/slaRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const sla = require("../controllers/slaController");

// Anyone authenticated can view this page's data
router.use(requireAuth);

router.get("/stats", sla.getStats);

router.get("/rules", sla.listRules);
router.get("/rules/:id", sla.getRule);
router.post("/rules", requireRole("admin"), sla.createRule);
router.put("/rules/:id", requireRole("admin"), sla.updateRule);
router.delete("/rules/:id", requireRole("admin"), sla.deleteRule);

router.get("/escalation-settings", sla.getEscalationSettings);
router.put("/escalation-settings", requireRole("admin"), sla.updateEscalationSettings);
router.post("/escalation-settings/recipients", requireRole("admin"), sla.addRecipient);
router.delete("/escalation-settings/recipients/:id", requireRole("admin"), sla.removeRecipient);

router.get("/alerts", sla.listAlerts);
router.post("/alerts", sla.createAlert); // called internally by escalation jobs/services
router.put("/alerts/:id/resolve", requireRole("admin"), sla.resolveAlert);

router.get("/activity", sla.listActivity);

module.exports = router;
