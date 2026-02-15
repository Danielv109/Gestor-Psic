"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEventType = exports.StateTransitionError = exports.SessionState = exports.FINAL_STATES = exports.SESSION_CREATION_ALLOWED_STATES = exports.APPOINTMENT_TRANSITIONS = void 0;
const client_1 = require("@prisma/client");
exports.APPOINTMENT_TRANSITIONS = {
    [client_1.AppointmentStatus.SCHEDULED]: [
        client_1.AppointmentStatus.CONFIRMED,
        client_1.AppointmentStatus.CANCELLED,
        client_1.AppointmentStatus.NO_SHOW,
    ],
    [client_1.AppointmentStatus.CONFIRMED]: [
        client_1.AppointmentStatus.IN_PROGRESS,
        client_1.AppointmentStatus.CANCELLED,
    ],
    [client_1.AppointmentStatus.IN_PROGRESS]: [
        client_1.AppointmentStatus.COMPLETED,
    ],
    [client_1.AppointmentStatus.COMPLETED]: [],
    [client_1.AppointmentStatus.CANCELLED]: [],
    [client_1.AppointmentStatus.NO_SHOW]: [],
};
exports.SESSION_CREATION_ALLOWED_STATES = [
    client_1.AppointmentStatus.CONFIRMED,
];
exports.FINAL_STATES = [
    client_1.AppointmentStatus.COMPLETED,
    client_1.AppointmentStatus.CANCELLED,
    client_1.AppointmentStatus.NO_SHOW,
];
var SessionState;
(function (SessionState) {
    SessionState["DRAFT"] = "DRAFT";
    SessionState["READY_TO_SIGN"] = "READY_TO_SIGN";
    SessionState["SIGNED"] = "SIGNED";
})(SessionState || (exports.SessionState = SessionState = {}));
class StateTransitionError extends Error {
    constructor(message, fromState, toState, resourceType, resourceId) {
        super(message);
        this.fromState = fromState;
        this.toState = toState;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.name = 'StateTransitionError';
    }
}
exports.StateTransitionError = StateTransitionError;
var WorkflowEventType;
(function (WorkflowEventType) {
    WorkflowEventType["STATE_CHANGED"] = "STATE_CHANGED";
    WorkflowEventType["SESSION_STARTED"] = "SESSION_STARTED";
    WorkflowEventType["SESSION_ENDED"] = "SESSION_ENDED";
    WorkflowEventType["SESSION_SIGNED"] = "SESSION_SIGNED";
    WorkflowEventType["SESSION_AMENDED"] = "SESSION_AMENDED";
    WorkflowEventType["SESSION_VOIDED"] = "SESSION_VOIDED";
    WorkflowEventType["AMENDMENT_SIGNED"] = "AMENDMENT_SIGNED";
    WorkflowEventType["APPOINTMENT_CONFIRMED"] = "APPOINTMENT_CONFIRMED";
    WorkflowEventType["APPOINTMENT_CANCELLED"] = "APPOINTMENT_CANCELLED";
    WorkflowEventType["APPOINTMENT_NO_SHOW"] = "APPOINTMENT_NO_SHOW";
})(WorkflowEventType || (exports.WorkflowEventType = WorkflowEventType = {}));
//# sourceMappingURL=workflow.interfaces.js.map