"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var axios_1 = __importDefault(require("axios"));
var redis_1 = require("redis");
var bluebird_1 = __importDefault(require("bluebird"));
var papaparse_1 = __importDefault(require("papaparse"));
var node_cron_1 = __importDefault(require("node-cron"));
var socket_io_1 = require("socket.io");
var players_1 = require("./players");
var PORT = process.env.PORT || 3000;
var app = express_1.default();
var redis = redis_1.createClient();
var io = new socket_io_1.Server();
var playersAPI = 'https://www.balldontlie.io/api/v1/players';
// make all redis methods a Promise based.
bluebird_1.default.promisifyAll(redis);
redis.connect().then(function () { return console.log('redis is connected.'); });
io.on('connection', function (socket) {
    socket.on('player update', function (msg) {
        console.log("new player data: " + msg);
    });
});
app.get('/player', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var playersMinimalData, playersArray, csvRelevantData, playersCsvString, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, players_1.givenCsvData()];
            case 1:
                playersMinimalData = _a.sent();
                return [4 /*yield*/, Promise.all(playersMinimalData.map(function (playerRecord) { return __awaiter(void 0, void 0, void 0, function () {
                        var playerCache, playerData;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, redis.get(playerRecord.id.toString())];
                                case 1:
                                    playerCache = _a.sent();
                                    if (playerCache !== null)
                                        return [2 /*return*/, JSON.parse(playerCache)];
                                    return [4 /*yield*/, axios_1.default.get(playersAPI + "/" + playerRecord.id)];
                                case 2:
                                    playerData = (_a.sent()).data;
                                    return [4 /*yield*/, redis.set(playerData.id.toString(), JSON.stringify(playerData))];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/, playerData];
                            }
                        });
                    }); }))];
            case 2:
                playersArray = _a.sent();
                csvRelevantData = playersArray.map(function (player) {
                    return __assign(__assign({}, player), { team: player.team.full_name });
                });
                playersCsvString = papaparse_1.default.unparse(csvRelevantData);
                res.attachment('players.csv');
                return [2 /*return*/, res.status(200).send(playersCsvString)];
            case 3:
                error_1 = _a.sent();
                console.log(error_1);
                return [2 /*return*/, res.status(500).json({ error: 'Internal Server Error!' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
//Update cache data every 15 minutes
//if data has been changed in the 3rd party api or never been cached before.
node_cron_1.default.schedule('*/15 * * * *', function () { return __awaiter(void 0, void 0, void 0, function () {
    var playersMinimalData, players;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, players_1.givenCsvData()];
            case 1:
                playersMinimalData = _a.sent();
                return [4 /*yield*/, Promise.all(playersMinimalData.map(function (minimalPlayerData) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, axios_1.default.get(playersAPI + "/" + minimalPlayerData.id)];
                                case 1: return [2 /*return*/, (_a.sent())
                                        .data];
                            }
                        });
                    }); }))];
            case 2:
                players = _a.sent();
                players.forEach(function (player) { return __awaiter(void 0, void 0, void 0, function () {
                    var playerCache, playerString;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, redis.get(player.id.toString())];
                            case 1:
                                playerCache = _a.sent();
                                playerString = JSON.stringify(player);
                                if (!(playerString !== playerCache)) return [3 /*break*/, 3];
                                return [4 /*yield*/, redis.set(player.id.toString(), JSON.stringify(player))];
                            case 2:
                                _a.sent();
                                io.emit('player update', playerString);
                                _a.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); });
app.listen(PORT, function () {
    console.log("app is listening on port " + PORT);
});
//# sourceMappingURL=main.js.map