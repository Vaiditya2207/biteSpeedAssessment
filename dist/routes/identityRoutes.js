"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const identityController_1 = __importDefault(require("../controllers/identityController"));
const router = (0, express_1.Router)();
router.post('/identify', identityController_1.default.identify);
exports.default = router;
