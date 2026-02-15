"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowNotesModule = void 0;
const common_1 = require("@nestjs/common");
const shadow_notes_controller_1 = require("./shadow-notes.controller");
const shadow_notes_service_1 = require("./shadow-notes.service");
const shadow_notes_repository_1 = require("./shadow-notes.repository");
const shadow_note_owner_policy_1 = require("./policies/shadow-note-owner.policy");
const sessions_module_1 = require("../sessions/sessions.module");
const crypto_module_1 = require("../../crypto/crypto.module");
const audit_module_1 = require("../audit/audit.module");
let ShadowNotesModule = class ShadowNotesModule {
};
exports.ShadowNotesModule = ShadowNotesModule;
exports.ShadowNotesModule = ShadowNotesModule = __decorate([
    (0, common_1.Module)({
        imports: [sessions_module_1.SessionsModule, crypto_module_1.CryptoModule, audit_module_1.AuditModule],
        controllers: [shadow_notes_controller_1.ShadowNotesController],
        providers: [shadow_notes_service_1.ShadowNotesService, shadow_notes_repository_1.ShadowNotesRepository, shadow_note_owner_policy_1.ShadowNoteOwnerPolicy],
        exports: [shadow_notes_service_1.ShadowNotesService, shadow_notes_repository_1.ShadowNotesRepository],
    })
], ShadowNotesModule);
//# sourceMappingURL=shadow-notes.module.js.map